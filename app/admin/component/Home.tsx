"use client";

import React from "react";
import { Card } from "antd";
import DisplayRequest from "./homeComponent/displayRequest";

const userMap = {
  "user-456": {
    name: "Alice",
    telephone: "+250788123456",
    loans: [
      {
        productId: "pro-234",
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
};

const sellData = {
  products: [
    {
      "pro-234": {
        productName: "T-shirt",
        dates: {
          "2025-06-25": [
            {
              qty: 20,
              soldQty: 5,
              remainingQty: 15,
              userId: "user-456",
              priceAtSale: 30.0,
            },
          ],
          "2025-06-28": [
            {
              qty: 10,
              soldQty: 2,
              remainingQty: 8,
              userId: "user-123",
              priceAtSale: 25.0,
            },
          ],
        },
      },
    },
    {
      "pro-254": {
        productName: "T-Pant",
        dates: {
          "2025-06-25": [
            {
              qty: 20,
              soldQty: 5,
              remainingQty: 15,
              userId: "user-456",
              priceAtSale: 30.0,
            },
          ],
          "2025-06-28": [
            {
              qty: 10,
              soldQty: 2,
              remainingQty: 8,
              userId: "user-123",
              priceAtSale: 25.0,
            },
          ],
        },
      },
    },
  ],
};

const Home = ({ setSelectedKey }: { setSelectedKey: (key: string) => void } ) => {
  const allSales: any[] = [];
  let totalSold = 0;
  let totalAmount = 0;
  let totalLoanAmount = 0;
  let totalLoanRemaining = 0;
  const today = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  sellData.products.forEach((productObj) => {
    const [productId, productData] = Object.entries(productObj)[0];

    Object.entries(productData.dates).forEach(([date, sales]: any) => {
      sales.forEach((sale: any) => {
        allSales.push({
          date,
          productName: productData.productName,
          ...sale,
        });
        totalSold += sale.soldQty;
        totalAmount += sale.soldQty * sale.priceAtSale;
      });
    });
  });

  const groupedByProduct = allSales.reduce((acc: any, sale) => {
    if (!acc[sale.productName]) {
      acc[sale.productName] = { totalSold: 0, remaining: 0 };
    }
    acc[sale.productName].totalSold += sale.soldQty;
    acc[sale.productName].remaining += sale.remainingQty;
    return acc;
  }, {});

  Object.values(userMap).forEach((user: any) => {
    user.loans?.forEach((loan: any) => {
      if (
        loan.paymentStatus === "PARTIALLY_PAID" ||
        loan.paymentStatus === "PENDING"
      ) {
        totalLoanAmount += loan.totalAmount;
        totalLoanRemaining += loan.remainingAmount;
      }
    });
  });

  return (
    <div className="flex flex-col sm:flex-row gap-10 w-full sm:pl-6 justify-between">
    <div className="sm:p-4 space-y-2 sm:w-4/5 w-full">
      <Card title={`Today Overview ${today}`}  className="bg-white shadow">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-gray-800 font-medium">
          <p>Total Sold Quantity: {totalSold}</p>
          <p>Total Sales Revenue: {totalAmount} RWF</p>
          <p>Total Loaned Amount: {totalLoanAmount} RWF</p>
          <p>Total Remaining to Collect: {totalLoanRemaining} RWF</p>
        </div>
      </Card>

      <Card title="Product Stock Summary" bordered={false} className="bg-white shadow">
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(groupedByProduct).map(([productName, data]: any) => (
            <div
              key={productName}
              className="border p-4 rounded-md bg-gray-50 text-gray-800"
            >
              <p className="font-semibold">{productName}</p>
              <p>Total Sold: {data.totalSold}</p>
              <p>Total Remaining: {data.remaining}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Sales History */}
      <Card title="Sales History" bordered={false} className="bg-white shadow">
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
            <p>{sale.productName}</p>
            <p>{sale.date}</p>
            <p>
              {sale.soldQty} / {sale.qty}
            </p>
            <p>{sale.soldQty * sale.priceAtSale} RWF</p>
            <p>
              {userMap[sale.userId]?.name} ({userMap[sale.userId]?.telephone})
            </p>
          </div>
        ))}
      </Card>

      {/* Loan Tracker */}
      <Card title="Loan Tracker" bordered={false} className="bg-white shadow">
        {Object.entries(userMap).map(([userId, user]: any) =>
          user.loans && user.loans.length > 0 ? (
            <div key={userId} className="mb-4">
              <p className="font-semibold text-blue-600">
                {user.name} ({user.telephone})
              </p>
              {user.loans.map((loan: any, i: number) => (
                <div
                  key={i}
                  className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mt-2 border p-2 rounded text-sm bg-gray-50"
                >
                  <p>Qty: {loan.qty}</p>
                  <p>Total: {loan.totalAmount} RWF</p>
                  <p>Paid: {loan.amountPaid} RWF</p>
                  <p>Remaining: {loan.remainingAmount} RWF</p>
                  <p>Status: {loan.status} - {loan.paymentStatus}</p>
                  <p>Date: {loan.loanDate}</p>
                </div>
              ))}
            </div>
          ) : null
        )}
      </Card>
    </div>
    <div className="sm:w-1/5 sm:shadow-2xl">
        <DisplayRequest setSelectedKey={setSelectedKey}/>
    </div>
    </div>
  );
};

export default Home;
