"use client";

import React, { useState } from "react";
import { Input, Calendar } from "antd";
import type { CalendarProps } from "antd";
import dayjs, { Dayjs } from "dayjs";

const mockUsers = [
  { id: "user-456", name: "Alice" },
  { id: "user-123", name: "Bob" },
  { id: "user-789", name: "Charlie" },
];

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
        paymentMethod: "cash",
      },
    ],
  },
];

const getUserName = (userId: string) => {
  const user = mockUsers.find((u) => u.id === userId);
  return user ? user.name : userId;
};

const CancelSellApproval: React.FC<{ setSelectedKey: (key: string) => void }> = ({
  setSelectedKey,
}) => {
  const [sales, setSales] = useState(mockSaleTracker);
  const [searchUser, setSearchUser] = useState("");
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);

  const handleAction = (
    productIndex: number,
    saleIndex: number,
    action: "cancelled" | "complete"
  ) => {
    const updated = [...sales];
    updated[productIndex].sell[saleIndex].status = action;
    setSales(updated);
  };

  const onDateChange: CalendarProps<Dayjs>["onPanelChange"] = (value) => {
    setSelectedDate(value);
  };

  const allCancelSales = sales.flatMap((product, productIndex) =>
    product.sell
      .map((sale, saleIndex) => ({
        ...sale,
        productIndex,
        saleIndex,
        productName: product.name,
        userName: getUserName(sale.userId),
      }))
      .filter((sale) => sale.status === "cancel_request")
  );

  const filteredSales = allCancelSales
    .filter((sale) =>
      searchUser
        ? sale.userName.toLowerCase().includes(searchUser.toLowerCase())
        : true
    )
    .filter((sale) =>
      selectedDate ? dayjs(sale.date).isSame(selectedDate, "day") : true
    );

  return (
    <div className="w-full bg-gray-100 p-4">
      <h1 className="font-bold text-3xl text-center mb-6">Cancel Request Approvals</h1>

      <div className="flex flex-col sm:flex-row gap-6">
        {/* Left: Filters */}
        <div className="w-full sm:w-1/3">
          <Input
            placeholder="Search by seller name"
            value={searchUser}
            onChange={(e) => setSearchUser(e.target.value)}
            className="mb-4"
          />
          <div className="border rounded-md p-2">
            <Calendar fullscreen={false} onPanelChange={onDateChange} />
          </div>
        </div>

        {/* Right: Results */}
        <div className="flex-1">
          <h2 className="text-lg font-semibold mb-3">Cancel Requests</h2>

          {filteredSales.length === 0 ? (
            <p className="text-gray-500">No matching cancel requests found.</p>
          ) : (
            filteredSales.map((sale, idx) => (
              <div
                key={idx}
                className="bg-white shadow p-4 rounded mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="text-gray-800 text-sm">
                  <p className="font-bold">{sale.productName}</p>
                  <p>Date: {sale.date}</p>
                  <p>
                    Qty: {sale.qty} | Sold: {sale.soldQty} | Remaining: {sale.remainingQty}
                  </p>
                  <p>Price: {sale.priceAtSale} RWF</p>
                  <p>Payment: {sale.paymentMethod}</p>
                  <p>Seller: {sale.userName}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() =>
                      handleAction(sale.productIndex, sale.saleIndex, "cancelled")
                    }
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() =>
                      handleAction(sale.productIndex, sale.saleIndex, "complete")
                    }
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Approve
                  </button>
                </div>
              </div>
            ))
          )}

          <div className="mt-4 text-center">
            <button
              onClick={() => setSelectedKey("2")}
              className="text-blue-600 underline"
            >
              Show more...
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancelSellApproval;
