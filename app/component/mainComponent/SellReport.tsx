"use client";

import React from "react";
import { Card } from "antd";

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

const SellReport: React.FC = () => {
  const allSales: any[] = [];
  let totalSold = 0;
  let totalAmount = 0;
  let totalLoanAmount = 0;
  let totalLoanRemaining = 0;

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
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Sell Report with Loans</h1>

      <div title="Overall Summary" className="mb-4">
        <p>Total Sold Quantity: {totalSold}</p>
        <p>Total Sales Revenue: {totalAmount} RWF</p>
        <p className="my-2 font-semibold">Outstanding Loans:</p>
        <p>Total Loaned Amount: {totalLoanAmount} RWF</p>
        <p>Total Remaining to Collect: {totalLoanRemaining} RWF</p>
      </div>
      <p className="font-bold text-lg mb-4">product Sell</p>
      <div className="flex flex-col justify-between gap-6 sm:flex-row mb-4 flex-wrap">
        {Object.entries(groupedByProduct).map(([productName, data]: any) => (
          <div key={productName} title={productName}>
            <p>Total Sold: {data.totalSold}</p>
            <p>Total Remaining Stock: {data.remaining}</p>
          </div>
        ))}
      </div>

      <div className="space-y-4 mb-8">
        <h2 className="text-xl font-semibold mb-2">Sales History</h2>
        <div className="hiden sm:flex justify-between mr-15">
            <p className="font-bold text-lg">Product</p>
            <p className="font-bold text-lg">Date</p>
            <p className="font-bold text-lg">sold Qty</p>
            <p className="font-bold text-lg">Amount</p>
            <p className="font-bold text-lg">Sold By</p>
        </div>
        {allSales.map((sale, index) => (
          <div key={index} className="flex justify-between flex-col sm:flex-row gap-2 sm:gap-0 pb-2 shadow-sm">
            <p className="font-semibold">{sale.productName}</p>
            <p>{sale.date}</p>
            <p>
              {sale.soldQty} / {sale.qty}
            </p>
            <p>{sale.soldQty * sale.priceAtSale} RWF</p>
            <p>
              {userMap[sale.userId]?.name} (
              {userMap[sale.userId]?.telephone})
            </p>
          </div>
        ))}
      </div>          


      <div className="space-y-4">
        <h2 className="text-xl font-semibold mb-2">Loan Tracker</h2>
        {Object.entries(userMap).map(([userId, user]: any) =>
          user.loans && user.loans.length > 0 ? (
            <div key={userId} title={`${user.name} (${user.telephone})`}>
              {user.loans.map((loan: any, i: number) => (
                <div key={i} className="pt-2 mt-2 flex flex-col sm:flex-row justify-between items-start sm:items-center border rounded-md p-4 shadow-sm bg-white">
                    
                  <p>Qty: {loan.qty}</p>
                  <p>Total: {loan.totalAmount} RWF</p>
                  <p>Paid: {loan.amountPaid} RWF</p>
                  <p>Remaining: {loan.remainingAmount} RWF</p>
                  <p>
                    Status: {loan.status} - {loan.paymentStatus}
                  </p>
                  <p>Date: {loan.loanDate}</p>
                </div>
              ))}
            </div>
          ) : null
        )}
      </div>
    </div>
  );
};

export default SellReport;
