"use client";

import React, { useState, useEffect, useMemo } from "react";
import { DatePicker, Select, Button, Spin, message, Card, Table } from "antd";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;

interface Transaction {
  id: string;
  productId: string;
  productName: string;
  date: string;
  status: string;
  soldQty: number;
  clientId: string;
  priceAtSale: number;
  paymentBreakdown?: {
    cash?: number;
    MOMO?: number;
    credit?: number;
  };
  amountPaid?: number;
  creditAmount?: number;
  paymentStatus?: string;
  updatedAt: string;
}

interface Product {
  id: string;
  productName: string;
  category: {
    name: string;
  };
  brand: {
    name: string;
  };
}

interface Client {
  id: string;
  name: string;
  telephone: string;
}

const SellReportAdmin = () => {
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000/api";

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all data in parallel
        const [transactionsRes, productsRes, clientsRes] = await Promise.all([
          fetch(`${BACKEND_URL}/admin/alltransaction`),
          fetch(`${BACKEND_URL}/getallproduct`),
          fetch(`${BACKEND_URL}/getallclient`)
        ]);

        if (!transactionsRes.ok || !productsRes.ok || !clientsRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const transactionsData = await transactionsRes.json();
        const productsData = await productsRes.json();
        const clientsData = await clientsRes.json();

        // Transform the transactions data from the nested structure
        const allTransactions: Transaction[] = [];
        transactionsData.products.forEach((product: any) => {
          Object.entries(product.stockTracker.soldTracker).forEach(([date, items]: [string, any]) => {
            items.forEach((item: any) => {
              allTransactions.push({
                ...item,
                productId: product.id,
                productName: product.productName,
                date: date,
                updatedAt: item.updatedAt
              });
            });
          });
        });

        setTransactions(allTransactions);
        setProducts(productsData.data || []);
        setClients(clientsData.clients || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        message.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Date filter
      const dateFilter = !dateRange || (
        dayjs(t.date).isAfter(dateRange[0].startOf('day')) && 
        dayjs(t.date).isBefore(dateRange[1].endOf('day'))
      );
      
      // Product filter
      const productFilter = selectedProducts.length === 0 || 
        selectedProducts.includes(t.productId);
      
      // Client filter
      const clientFilter = selectedClients.length === 0 || 
        selectedClients.includes(t.clientId);
      
      return dateFilter && productFilter && clientFilter;
    });
  }, [transactions, dateRange, selectedProducts, selectedClients]);

  const totals = useMemo(() => {
    return filteredTransactions.reduce(
      (acc, t) => {
        acc.totalSold += t.soldQty || 0;
        acc.totalRevenue += (t.amountPaid || 0) + (t.creditAmount || 0);
        acc.totalPaid += t.amountPaid || 0;
        acc.totalCredit += t.creditAmount || 0;
        return acc;
      },
      { 
        totalSold: 0, 
        totalRevenue: 0,
        totalPaid: 0,
        totalCredit: 0
      }
    );
  }, [filteredTransactions]);

  const printReport = () => {
    const content = document.getElementById("report-print").innerHTML;
    const win = window.open();
    win.document.write(`
      <html>
        <head>
          <title>Sales Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .totals { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Sales Report</h1>
            <p>Generated on: ${new Date().toLocaleString()}</p>
          </div>
          ${content}
        </body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: 'Product',
      dataIndex: 'productName',
      key: 'productName',
    },
    {
      title: 'Client',
      key: 'client',
      render: (record: Transaction) => {
        const client = clients.find(c => c.id === record.clientId);
        return client ? `${client.name} (${client.telephone})` : record.clientId;
      },
    },
    {
      title: 'Qty Sold',
      dataIndex: 'soldQty',
      key: 'soldQty',
    },
    {
      title: 'Price',
      dataIndex: 'priceAtSale',
      key: 'priceAtSale',
      render: (price: number) => `${price} RWF`,
    },
    {
      title: 'Amount Paid',
      dataIndex: 'amountPaid',
      key: 'amountPaid',
      render: (amount: number) => amount ? `${amount} RWF` : '-',
    },
    {
      title: 'Credit',
      dataIndex: 'creditAmount',
      key: 'creditAmount',
      render: (amount: number) => amount ? `${amount} RWF` : '-',
    },
    {
      title: 'Payment Method',
      key: 'paymentMethod',
      render: (record: Transaction) => {
        if (!record.paymentBreakdown) return '-';
        return Object.entries(record.paymentBreakdown)
          .filter(([_, value]) => value && value > 0)
          .map(([method]) => method)
          .join(', ');
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-4 bg-white">
      <h1 className="text-xl font-bold mb-4">📊 Advanced Sales Report</h1>

      <div className="flex flex-wrap gap-4 mb-4 no-print">
        <RangePicker 
          onChange={(dates) => setDateRange(dates as [Dayjs, Dayjs])} 
          style={{ width: 250 }}
        />

        <Select
          mode="multiple"
          style={{ minWidth: 250 }}
          placeholder="Select product(s)"
          onChange={setSelectedProducts}
          options={products.map((p) => ({ 
            value: p.id, 
            label: p.productName 
          }))}
          loading={loading}
        />

        <Select
          mode="multiple"
          style={{ minWidth: 250 }}
          placeholder="Select client(s)"
          onChange={setSelectedClients}
          options={clients.map((c) => ({
            value: c.id,
            label: `${c.name} (${c.telephone})`,
          }))}
          loading={loading}
        />

        <Button 
          onClick={printReport}
          type="primary"
          icon={<span>🖨</span>}
        >
          Print Report
        </Button>
      </div>

      <div id="report-print">
        <div className="mb-6">
          <Card title="Summary" className="mb-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded">
                <h3 className="font-semibold">Total Sold</h3>
                <p className="text-2xl">{totals.totalSold}</p>
              </div>
              <div className="bg-green-50 p-4 rounded">
                <h3 className="font-semibold">Total Revenue</h3>
                <p className="text-2xl">{totals.totalRevenue.toLocaleString()} RWF</p>
              </div>
              <div className="bg-purple-50 p-4 rounded">
                <h3 className="font-semibold">Total Paid</h3>
                <p className="text-2xl">{totals.totalPaid.toLocaleString()} RWF</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded">
                <h3 className="font-semibold">Total Credit</h3>
                <p className="text-2xl">{totals.totalCredit.toLocaleString()} RWF</p>
              </div>
            </div>
          </Card>

          <Card title="Transaction Details">
            <Table
              columns={columns}
              dataSource={filteredTransactions}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              scroll={{ x: true }}
            />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SellReportAdmin;