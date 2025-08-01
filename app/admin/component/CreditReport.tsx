import React, { useState, useMemo, useEffect } from "react";
import { Select, DatePicker, Table, Tag, Spin, Statistic, Row, Col } from "antd";
import dayjs, { Dayjs } from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";

const { RangePicker } = DatePicker;
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);


interface Client {
  id: string;
  name: string;
  telephone: string;
  creditTrackers: {
    id: string;
    productId: string;
    clientId: string;
    qty: number;
    pricePerUnit: number;
    amountPaid: number;
    remainingAmount: number;
    creditDate: string;
    returnDate: string | null;
    status: string;
    paymentStatus: "PENDING" | "PARTIALLY_PAID" | "PAID";
    createdAt: string;
    updatedAt: string;
  }[];
}

interface ApiResponse {
  success: boolean;
  clients: Client[];
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000/api";

const CreditReport: React.FC = () => {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${BACKEND_URL}/getallclient`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: ApiResponse = await response.json();
        if (data.success) {
          setClients(data.clients);
        } else {
          throw new Error("Failed to fetch clients");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
        console.error("Error fetching clients:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  const allLoans = useMemo(() => {
    const records: any[] = [];

    clients.forEach((client) => {
      client.creditTrackers.forEach((loan) => {
        records.push({
          ...loan,
          userId: client.id,
          userName: client.name,
          telephone: client.telephone,
          loanDate: loan.creditDate,
          updatedDate: loan.updatedAt,
          totalAmount: loan.qty * loan.pricePerUnit,
        });
      });
    });

    return records;
  }, [clients]);

  const filtered = useMemo(() => {
    return allLoans.filter((loan) => {
      const matchUser =
        selectedUsers.length === 0 || selectedUsers.includes(loan.userId);
      const matchStatus =
        !selectedStatus || loan.paymentStatus === selectedStatus;
      const matchDate =
        !dateRange ||
        (dayjs(loan.loanDate).isSameOrAfter(dateRange[0], "day") &&
         dayjs(loan.loanDate).isSameOrBefore(dateRange[1], "day"));

      return matchUser && matchStatus && matchDate;
    });
  }, [allLoans, selectedUsers, selectedStatus, dateRange]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    return filtered.reduce(
      (acc, loan) => {
        acc.totalAmount += loan.totalAmount;
        acc.amountPaid += loan.amountPaid;
        acc.remainingAmount += loan.remainingAmount;
        return acc;
      },
      { totalAmount: 0, amountPaid: 0, remainingAmount: 0 }
    );
  }, [filtered]);

  const columns = [
    {
      title: "User",
      dataIndex: "userName",
      key: "userName",
      render: (text: string, record: any) => (
        <div>
          <p className="font-medium">{text}</p>
          <p className="text-xs text-gray-500">{record.telephone}</p>
        </div>
      ),
    },
    {
      title: "Qty",
      dataIndex: "qty",
      key: "qty",
    },
    {
      title: "Price/Unit",
      dataIndex: "pricePerUnit",
      key: "pricePerUnit",
      render: (value: number) => value.toLocaleString(),
    },
    {
      title: "Total",
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (value: number) => value.toLocaleString(),
    },
    {
      title: "Paid",
      dataIndex: "amountPaid",
      key: "amountPaid",
      render: (value: number) => value.toLocaleString(),
    },
    {
      title: "Remaining",
      dataIndex: "remainingAmount",
      key: "remainingAmount",
      render: (value: number) => value.toLocaleString(),
    },
    {
      title: "Loan Date",
      dataIndex: "loanDate",
      key: "loanDate",
      render: (date: string) => dayjs(date).format("YYYY-MM-DD"),
    },
    {
      title: "Updated",
      dataIndex: "updatedDate",
      key: "updatedDate",
      render: (date: string) => date ? dayjs(date).format("YYYY-MM-DD") : "—",
    },
    {
      title: "Status",
      dataIndex: "paymentStatus",
      key: "paymentStatus",
      render: (status: string) => {
        const color = {
          PENDING: "red",
          PARTIALLY_PAID: "orange",
          PAID: "green",
        }[status] || "gray";

        return <Tag color={color}>{status}</Tag>;
      },
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-white rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Credit Report</h2>
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded shadow max-w-full overflow-x-auto">
      <h2 className="text-xl font-semibold mb-4">Credit Report</h2>

      <div className="flex flex-wrap gap-4 mb-4">
        <Select
          mode="multiple"
          placeholder="Select user(s)"
          style={{ minWidth: 200 }}
          onChange={setSelectedUsers}
          options={clients.map((client) => ({
            value: client.id,
            label: `${client.name} (${client.telephone})`,
          }))}
        />

        <RangePicker onChange={(val) => setDateRange(val)} />

        <Select
          allowClear
          placeholder="Payment Status"
          style={{ minWidth: 180 }}
          onChange={setSelectedStatus}
          options={[
            { value: "PENDING", label: "Not Paid" },
            { value: "PARTIALLY_PAID", label: "Partially Paid" },
            { value: "PAID", label: "Paid" },
          ]}
        />
      </div>

      {/* Summary Statistics Row */}
      <Row gutter={16} className="mb-4">
        <Col span={8}>
          <div className="p-4 border rounded">
            <Statistic
              title="Total Credit Amount"
              value={summary.totalAmount}
              precision={2}
              valueStyle={{ color: '#3f8600' }}
              prefix="RWF"
              formatter={(value) => value.toLocaleString()}
            />
          </div>
        </Col>
        <Col span={8}>
          <div className="p-4 border rounded">
            <Statistic
              title="Amount Paid"
              value={summary.amountPaid}
              precision={2}
              valueStyle={{ color: '#3f8600' }}
              prefix="RWF"
              formatter={(value) => value.toLocaleString()}
            />
          </div>
        </Col>
        <Col span={8}>
          <div className="p-4 border rounded">
            <Statistic
              title="Remaining Amount"
              value={summary.remainingAmount}
              precision={2}
              valueStyle={{ color: '#cf1322' }}
              prefix="RWF"
              formatter={(value) => value.toLocaleString()}
            />
          </div>
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={filtered}
        rowKey="id"
        pagination={{ pageSize: 5 }}
        bordered
        summary={() => (
          <Table.Summary fixed>
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={3}>
                <strong>Total</strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1}>
                <strong>{summary.totalAmount.toLocaleString()}</strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2}>
                <strong>{summary.amountPaid.toLocaleString()}</strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={3}>
                <strong>{summary.remainingAmount.toLocaleString()}</strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={4} colSpan={4} />
            </Table.Summary.Row>
          </Table.Summary>
        )}
      />
    </div>
  );
};

export default CreditReport;