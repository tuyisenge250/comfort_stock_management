"use client";

import React, { useEffect, useState } from "react";
import dayjs from "dayjs";

interface Sale {
  productId: string;
  sold: {
    id: string;
    status: string;
    soldQty: number;
    clientId: string;
    updatedAt: string;
    initialQty: number;
    priceAtSale: number;
    remainingQty: number;
    paymentBreakdown: {
      cash: number;
    };
  }[];
}

interface Client {
  id: string;
  name: string;
  telephone: string;
  creditTrackers: {
    id: string;
    productId: string;
    qty: number;
    pricePerUnit: number;
    amountPaid: number;
    remainingAmount: number;
    creditDate: string;
    status: string;
    paymentStatus: string;
  }[];
}

const SellReport: React.FC = () => {
  const [allSales, setAllSales] = useState<any[]>([]);
  const [clientMap, setClientMap] = useState<Record<string, Client>>({});
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

        const salesData: Sale[] = salesJson.data;
        const clients: Client[] = clientsJson.clients;

        // Group client by ID
        const clientMap: Record<string, Client> = {};
        clients.forEach((client) => {
          clientMap[client.id] = client;
        });
        setClientMap(clientMap);

        // Flatten sales
        const sales: any[] = [];
        let soldQty = 0;
        let salesAmount = 0;

        salesData.forEach((product) => {
          product.sold.forEach((s) => {
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

        // Filter today's loans
        let loanAmount = 0;
        let loanRemaining = 0;
        const loans: any[] = [];

        clients.forEach((client) => {
          client.creditTrackers.forEach((loan) => {
            const isToday = dayjs(loan.creditDate).isSame(today, "day");
            if (isToday && (loan.paymentStatus === "PARTIALLY_PAID" || loan.paymentStatus === "PENDING")) {
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

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Sell Report with Loans</h1>

      <div className="mb-4">
        <p>Total Sold Quantity: {totals.soldQty}</p>
        <p>Total Sales Revenue: {totals.salesAmount} RWF</p>
        <p className="my-2 font-semibold">Outstanding Loans (Today):</p>
        <p>Total Loaned Amount: {totals.loanAmount} RWF</p>
        <p>Total Remaining to Collect: {totals.loanRemaining} RWF</p>
      </div>

      <h2 className="font-bold text-lg mb-2">Sales History</h2>
      <div className="hidden sm:flex justify-between mb-2 font-bold">
        <p>Product</p>
        <p>Date</p>
        <p>Sold Qty</p>
        <p>Amount</p>
        <p>Sold By</p>
      </div>
      {allSales.map((sale, idx) => (
        <div key={idx} className="flex justify-between flex-col sm:flex-row gap-2 sm:gap-0 pb-2 shadow-sm">
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

      <h2 className="text-xl font-semibold my-4">Loan Tracker (Today)</h2>
      {loansToday.map((loan, idx) => (
        <div
          key={idx}
          className="pt-2 mt-2 flex flex-col sm:flex-row justify-between items-start sm:items-center border rounded-md p-4 shadow-sm bg-white"
        >
          <p>Client: {loan.clientName} ({loan.telephone})</p>
          <p>Qty: {loan.qty}</p>
          <p>Total: {loan.qty * loan.pricePerUnit} RWF</p>
          <p>Paid: {loan.amountPaid} RWF</p>
          <p>Remaining: {loan.remainingAmount} RWF</p>
          <p>Status: {loan.status} - {loan.paymentStatus}</p>
          <p>Date: {dayjs(loan.creditDate).format("YYYY-MM-DD HH:mm")}</p>
        </div>
      ))}
    </div>
  );
};

export default SellReport;
