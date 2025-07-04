"use client";

import React, { useState } from "react";

const mockSaleTracker = [
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
  },{
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
  },
];

const DisplayRequest: React.FC = ({ setSelectedKey }: { setSelectedKey: (key: string) => void })  => {
  const [sales, setSales] = useState(mockSaleTracker);

  const handleAction = (
    productIndex: number,
    saleIndex: number,
    action: "cancelled" | "complete"
  ) => {
    const updatedSales = [...sales];
    updatedSales[productIndex].sell[saleIndex].status = action;
    setSales(updatedSales);
  };

  return (
    <div className="w-full bg-gray-100 p-2">
      <h1 className="font-bold text-3xl text-center mb-6">Cancel Request Approvals</h1>

      {sales.map((product, productIdx) => (
        <div key={product.productId} className="mb-6">
          <h2 className="text-xl font-semibold mb-2">{product.name}</h2>

          {product.sell
            .map((sale, saleIdx) => ({ ...sale, saleIdx }))
            .filter((sale) => sale.status === "cancel_request")
            .map((sale) => (
              <div
                key={sale.saleIdx}
                className="bg-white shadow p-4 rounded mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 overflow-hidden max-h-screen"
              >
                <div className="text-gray-800 text-sm">
                  <p>
                    Date: <strong>{sale.date}</strong>
                  </p>
                  <p>
                    Qty: {sale.qty} | Sold: {sale.soldQty} | Remaining:{" "}
                    {sale.remainingQty}
                  </p>
                  <p>Price: {sale.priceAtSale} RWF</p>
                  <p>Payment: {sale.paymentMethod}</p>
                </div>

                <div className="flex gap-2 flex-col">
                  <button
                    onClick={() =>
                      handleAction(productIdx, sale.saleIdx, "cancelled")
                    }
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() =>
                      handleAction(productIdx, sale.saleIdx, "complete")
                    }
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Approve
                  </button>
                </div>
              </div>
            ))}
            <button 
            onClick={() => setSelectedKey("2")}>
              show more ...
            </button>
        </div>
      ))}

      {sales.every((product) =>
        product.sell.every((sale) => sale.status !== "cancel_request")
      ) && (
        <p className="text-center text-gray-500 mt-8">
          No cancel requests pending.
        </p>
      )}
    </div>
  );
};

export default DisplayRequest;
