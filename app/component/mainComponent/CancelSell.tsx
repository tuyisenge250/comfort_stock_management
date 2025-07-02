"use client";

import React, { useState } from "react";
import { Input, Calendar } from "antd";
import type { CalendarProps } from "antd";
import dayjs, { Dayjs } from "dayjs";

// Simulated user data to resolve user names from IDs
const mockUsers = [
  { id: "user-456", name: "Alice" },
  { id: "user-123", name: "Bob" },
];

// Mock sales data
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
      },
      {
        date: "2025-06-28",
        qty: 10,
        soldQty: 2,
        remainingQty: 8,
        userId: "user-123",
        priceAtSale: 25.0,
      },
    ],
  },
];

// Utility to map userId to name
const getUserName = (userId: string) => {
  const user = mockUsers.find((u) => u.id === userId);
  return user ? user.name : userId;
};

const CancelSell: React.FC = () => {
  const [searchUser, setSearchUser] = useState("");
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);

  const onDateChange: CalendarProps<Dayjs>["onPanelChange"] = (value) => {
    setSelectedDate(value);
  };

  const filteredSales = mockSaleTracker
    .flatMap((product) =>
      product.sell.map((sellItem) => ({
        ...sellItem,
        productName: product.name,
        userName: getUserName(sellItem.userId),
      }))
    )
    .filter((sale) =>
      searchUser
        ? sale.userName.toLowerCase().includes(searchUser.toLowerCase())
        : true
    )
    .filter((sale) =>
      selectedDate ? dayjs(sale.date).isSame(selectedDate, "day") : true
    );

  return (
    <div className="flex flex-col sm:flex-row gap-6">
      <div className="w-full sm:w-1/3">
        <Input
          placeholder="Search by seller name"
          value={searchUser}
          onChange={(e) => setSearchUser(e.target.value)}
          className="mb-4"
        />


        <div className="border rounded-md p-2 mt-3">
          <Calendar
            fullscreen={false}
            onPanelChange={onDateChange}
            className="w-full"
          />
        </div>
      </div>

      {/* Right Content */}
      <div className="flex-1">
        <h2 className="text-lg font-semibold mb-3">Sales Records</h2>

        <div className="space-y-4">
          {filteredSales.length === 0 ? (
            <p className="text-gray-500">No sales match your criteria.</p>
          ) : (
            filteredSales.map((item, index) => (
              <div
                key={index}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center border rounded-md p-4 shadow-sm bg-white"
              >
                <div>
                  <p className="font-semibold text-blue-600">{item.productName}</p>
                  <p className="text-sm">Date: {item.date}</p>
                  <p className="text-sm">
                    Sold Qty: {item.soldQty} / {item.qty}
                  </p>
                  <p className="text-sm">Remaining: {item.remainingQty}</p>
                  <p className="text-sm">Sold By: {item.userName}</p>
                  <p className="text-sm">Price: {item.priceAtSale} RWF</p>
                </div>
                <button
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 mt-3 sm:mt-0"
                  onClick={() => console.log("Cancel sale", item)}
                >
                  Cancel Sale
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CancelSell;
