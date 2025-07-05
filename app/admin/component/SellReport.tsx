"use client";

import React, { useState, useMemo } from "react";
import { DatePicker, Select, Button } from "antd";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;

const users = {
  "user-456": {
    name: "Alice",
    telephone: "+250788123456",
    loans: [
      {
        productId: "pro-234",
        creditId: "credit_341",
        qty: 10,
        pricePerUnit: 30.0,
        totalAmount: 300,
        amountPaid: 100,
        remainingAmount: 200,
        loanDate: "2025-06-26",
        status: "LOANED",
        paymentStatus: "PARTIALLY_PAID",
      },
    ],
  },
  "user-123": {
    name: "Bob",
    telephone: "+250788654321",
    loans: [],
  },
  "user-432": {
    name: "Aline",
    telephone: "+250788123456",
    loans: [
      {
        productId: "pro-234",
        creditId: "credit_342",
        qty: 10,
        pricePerUnit: 30.0,
        totalAmount: 300,
        amountPaid: 0,
        remainingAmount: 300,
        loanDate: "2025-06-26",
        status: "LOANED",
        paymentStatus: "PENDING",
      },
    ],
  },
};

const products = [
  {
    productId: "pro-234",
    name: "T-shirt",
    sell: [
      {
        date: "2025-06-25",
        qty: 20,
        soldQty: 5,
        remainingQty: 15,
        userId: "user-456",
        priceAtSale: 30.0,
        status: "complete",
        paymentMethod: "mobile money",
      },
      {
        date: "2025-06-28",
        qty: 10,
        soldQty: 2,
        remainingQty: 8,
        userId: "user-123",
        priceAtSale: 25.0,
        status: "cancel_request",
        paymentMethod: "cash",
      },
      {
        date: "2025-07-01",
        qty: 5,
        soldQty: 5,
        remainingQty: 0,
        userId: "user-789",
        priceAtSale: 28.0,
        status: "cancel_request",
        paymentMethod: "card",
      },
    ],
    adding: [
      {
        date: "2025-06-25",
        qty: 20,
        Existing: 4,
        remainingQty: 24,
        userId: "user-456",
        priceAtSale: 30.0,
      },
    ],
  },
  {
    productId: "pro-254",
    name: "T-Pant",
    sell: [
      {
        date: "2025-06-25",
        qty: 20,
        soldQty: 5,
        remainingQty: 15,
        userId: "user-456",
        priceAtSale: 30.0,
        status: "complete",
        paymentMethod: "mobile money",
      },
      {
        date: "2025-06-28",
        qty: 10,
        soldQty: 2,
        remainingQty: 8,
        userId: "user-123",
        priceAtSale: 25.0,
        status: "cancel_request",
        paymentMethod: "credit",
        creditId: ["credit_342"],
      },
    ],
  },
];

const SellReportAdmin = () => {
  const [dateRange, setDateRange] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);

  const allRecords = useMemo(() => {
    const records = [];

    products.forEach((product) => {
      product.sell.forEach((item) => {
        records.push({
          type: "Sell",
          productName: product.name,
          date: item.date,
          qty: item.qty,
          soldQty: item.soldQty,
          remainingQty: item.remainingQty,
          userId: item.userId,
          paymentMethod: item.paymentMethod,
          price: item.priceAtSale,
          total: item.soldQty * item.priceAtSale,
        });
      });
      product.adding?.forEach((item) => {
        records.push({
          type: "Add",
          productName: product.name,
          date: item.date,
          qty: item.qty,
          remainingQty: item.remainingQty,
          userId: item.userId,
          paymentMethod: "n/a",
          price: item.priceAtSale,
          total: 0,
        });
      });
    });
    return records;
  }, []);

  const filtered = allRecords.filter((r) => {
    const inDate =
      !dateRange.length ||
      (dayjs(r.date).isAfter(dateRange[0], "day") &&
        dayjs(r.date).isBefore(dateRange[1], "day"));
    const matchProduct = !selectedProducts.length || selectedProducts.includes(r.productName);
    const matchUser = !selectedUsers.length || selectedUsers.includes(r.userId);
    return inDate && matchProduct && matchUser;
  });

  const totalQty = filtered.reduce((sum, r) => sum + (r.qty || 0), 0);
  const totalSold = filtered.reduce((sum, r) => sum + (r.soldQty || 0), 0);
  const totalRevenue = filtered.reduce((sum, r) => sum + (r.total || 0), 0);

  const printReport = () => {
    const content = document.getElementById("report-print").innerHTML;
    const win = window.open();
    win.document.write(`<html><head><title>Report</title></head><body>${content}</body></html>`);
    win.document.close();
    win.print();
  };

  return (
    <div className="p-4 bg-white">
      <h1 className="text-xl font-bold mb-4">📊 Advanced Sell Report</h1>

      <div className="flex flex-wrap gap-4 mb-4">
        <RangePicker onChange={(range) => setDateRange(range)} />

        <Select
          mode="multiple"
          style={{ minWidth: 200 }}
          placeholder="Select product(s)"
          onChange={setSelectedProducts}
          options={products.map((p) => ({ value: p.name, label: p.name }))}
        />

        <Select
          mode="multiple"
          style={{ minWidth: 200 }}
          placeholder="Select user(s)"
          onChange={setSelectedUsers}
          options={Object.entries(users).map(([id, u]) => ({
            value: id,
            label: `${u.name} (${u.telephone})`,
          }))}
        />

        <Button onClick={printReport}>🖨 Print Report</Button>
      </div>

      <div id="report-print">
        <div className="mb-3">
          <p>Total Qty: {totalQty}</p>
          <p>Total Sold: {totalSold}</p>
          <p>Total Revenue: {totalRevenue} RWF</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-6 gap-2 font-semibold border-b pb-2">
          <span>Date</span>
          <span>Product</span>
          <span>Type</span>
          <span>Qty</span>
          <span>Remaining</span>
          <span>Payment</span>
        </div>

        {filtered.map((r, i) => (
          <div key={i} className="grid grid-cols-1 sm:grid-cols-6 gap-2 border-b py-1">
            <span>{r.date}</span>
            <span>{r.productName}</span>
            <span>{r.type}</span>
            <span>{r.type === "Sell" ? r.soldQty : r.qty}</span>
            <span>{r.remainingQty}</span>
            <span>{r.paymentMethod}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SellReportAdmin;
