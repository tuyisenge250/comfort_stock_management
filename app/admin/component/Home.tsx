"use client";

import React, { useEffect, useState } from "react";
import { Card } from "antd";
import dayjs from "dayjs";
import DisplayRequest from "./homeComponent/displayRequest";

const Home = ({ setSelectedKey }: { setSelectedKey: (key: string) => void }) => {
  const [allSales, setAllSales] = useState<any[]>([]);
  const [clientMap, setClientMap] = useState<Record<string, any>>({});
  const [loansToday, setLoansToday] = useState<any[]>([]);
  const [totals, setTotals] = useState({
    soldQty: 0,
    salesAmount: 0,
    loanAmount: 0,
    loanRemaining: 0,
  });

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000/api";
  const today = dayjs().format("YYYY-MM-DD");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [salesRes, clientsRes] = await Promise.all([
          fetch(`${BACKEND_URL}/gettodaysell`),
          fetch(`${BACKEND_URL}/getallclient`),
        ]);

        const salesJson = await salesRes.json();
        const clientsJson = await clientsRes.json();

        const salesData = salesJson.data;
        const clients = clientsJson.clients;

        const map: Record<string, any> = {};
        clients.forEach((client: any) => {
          map[client.id] = client;
        });
        setClientMap(map);

        const sales: any[] = [];
        let soldQty = 0;
        let salesAmount = 0;

        salesData.forEach((product: any) => {
          product.sold.forEach((s: any) => {
            const saleDate = dayjs(s.updatedAt).format("YYYY-MM-DD");
            sales.push({
              productId: product.productId,
              date: saleDate,
              soldQty: s.soldQty,
              qty: s.initialQty,
              remainingQty: s.remainingQty,
              priceAtSale: s.priceAtSale,
              clientId: s.clientId,
            });

            soldQty += s.soldQty;
            salesAmount += s.soldQty * s.priceAtSale;
          });
        });

        setAllSales(sales);

        // Loan section
        let loanAmount = 0;
        let loanRemaining = 0;
        const loans: any[] = [];

        clients.forEach((client: any) => {
          client.creditTrackers?.forEach((loan: any) => {
            const isToday = dayjs(loan.creditDate).isSame(today, "day");
            if (
              isToday &&
              (loan.paymentStatus === "PARTIALLY_PAID" || loan.paymentStatus === "PENDING")
            ) {
              loanAmount += loan.qty * loan.pricePerUnit;
              loanRemaining += loan.remainingAmount;

              loans.push({
                ...loan,
                clientName: client.name,
                telephone: client.telephone,
              });
            }
          });
        });

        setLoansToday(loans);
        setTotals({ soldQty, salesAmount, loanAmount, loanRemaining });
      } catch (err) {
        console.error("Fetch error:", err);
      }
    };

    fetchData();
  }, []);

  const groupedByProduct = allSales.reduce((acc: any, sale) => {
    if (!acc[sale.productId]) {
      acc[sale.productId] = { totalSold: 0, remaining: 0 };
    }
    acc[sale.productId].totalSold += sale.soldQty;
    acc[sale.productId].remaining += sale.remainingQty;
    return acc;
  }, {});

  return (
    <div className="flex flex-col sm:flex-row gap-10 w-full sm:pl-6 justify-between">
      <div className="sm:p-4 space-y-4 sm:w-4/5 w-full">
        <Card title={`Today Overview ${today}`} className="bg-white shadow">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-gray-800 font-medium">
            <p>Total Sold Quantity: {totals.soldQty}</p>
            <p>Total Sales Revenue: {totals.salesAmount} RWF</p>
            <p>Total Loaned Amount: {totals.loanAmount} RWF</p>
            <p>Total Remaining to Collect: {totals.loanRemaining} RWF</p>
          </div>
        </Card>

        <Card title="Product Stock Summary" className="bg-white shadow">
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(groupedByProduct).map(([productId, data]: any) => (
              <div
                key={productId}
                className="border p-4 rounded-md bg-gray-50 text-gray-800"
              >
                <p className="font-semibold">Product ID: {productId}</p>
                <p>Total Sold: {data.totalSold}</p>
                <p>Total Remaining: {data.remaining}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Sales History" className="bg-white shadow">
          <div className="hidden sm:grid grid-cols-5 font-bold text-gray-600 mb-2">
            <p>Product</p>
            <p>Date</p>
            <p>Sold Qty</p>
            <p>Amount</p>
            <p>Sold By</p>
          </div>
          {allSales.map((sale, index) => (
            <div
              key={index}
              className="grid grid-cols-2 sm:grid-cols-5 text-gray-700 py-2 border-b"
            >
              <p>{sale.productId}</p>
              <p>{sale.date}</p>
              <p>
                {sale.soldQty} / {sale.qty}
              </p>
              <p>{sale.soldQty * sale.priceAtSale} RWF</p>
              <p>
                {clientMap[sale.clientId]?.name} ({clientMap[sale.clientId]?.telephone})
              </p>
            </div>
          ))}
        </Card>

        <Card title="Loan Tracker (Today)" className="bg-white shadow">
          {loansToday.length === 0 ? (
            <p className="text-gray-500">No loans today.</p>
          ) : (
            loansToday.map((loan, i) => (
              <div
                key={i}
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mt-2 border p-2 rounded text-sm bg-gray-50"
              >
                <p>Client: {loan.clientName} ({loan.telephone})</p>
                <p>Qty: {loan.qty}</p>
                <p>Total: {loan.qty * loan.pricePerUnit} RWF</p>
                <p>Paid: {loan.amountPaid} RWF</p>
                <p>Remaining: {loan.remainingAmount} RWF</p>
                <p>Status: {loan.status} - {loan.paymentStatus}</p>
              </div>
            ))
          )}
        </Card>
      </div>

      <div className="sm:w-1/5 sm:shadow-2xl">
        <DisplayRequest setSelectedKey={setSelectedKey} />
      </div>
    </div>
  );
};

export default Home;
