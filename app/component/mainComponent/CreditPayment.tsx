"use client";

import React, { useState } from "react";
import { Input, Calendar, Card, Button, Modal, message } from "antd";
import type { CalendarProps } from "antd";
import dayjs, { Dayjs } from "dayjs";

interface Loan {
  productId: string;
  qty: number;
  pricePerUnit: number;
  totalAmount: number;
  amountPaid: number;
  remainingAmount: number;
  loanDate: string;
  status: string;
  paymentStatus: string;
}

interface UserCredit {
  name: string;
  telephone: string;
  loans: Loan[];
}

const initialUserData: Record<string, UserCredit> = {
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
  "user-432": {
    name: "Aline",
    telephone: "+250788123456",
    loans: [
      {
        productId: "pro-234",
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

const CreditPayment: React.FC = () => {
  const [userData, setUserData] = useState(initialUserData);
  const [searchName, setSearchName] = useState("");
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentLoan, setCurrentLoan] = useState<{
    userId: string;
    loanIndex: number;
  } | null>(null);
  const [paymentInput, setPaymentInput] = useState("");

  const handleDateSelect: CalendarProps<Dayjs>["onSelect"] = (value) => {
    setSelectedDate(value);
  };

  const filteredUsers = Object.entries(userData)
    .filter(([_, user]) =>
      searchName
        ? user.name.toLowerCase().includes(searchName.toLowerCase())
        : true
    )
    .filter(([_, user]) =>
      selectedDate
        ? user.loans.some((loan) =>
            dayjs(loan.loanDate).isSame(selectedDate, "day")
          )
        : true
    )
    .filter(([_, user]) => user.loans && user.loans.length > 0);

  const openPaymentModal = (userId: string, loanIndex: number) => {
    setCurrentLoan({ userId, loanIndex });
    setPaymentInput("");
    setIsModalOpen(true);
  };

  const handleOk = () => {
    if (!currentLoan) return;
    const { userId, loanIndex } = currentLoan;
    const user = userData[userId];
    const loan = user.loans[loanIndex];

    const paidAmount = parseFloat(paymentInput);
    if (isNaN(paidAmount) || paidAmount <= 0) {
      message.error("Please enter a valid amount.");
      return;
    }

    if (paidAmount > loan.remainingAmount) {
      message.error("Amount exceeds remaining loan.");
      return;
    }

    const newAmountPaid = loan.amountPaid + paidAmount;
    const newRemaining = loan.totalAmount - newAmountPaid;

    const newStatus =
      newRemaining === 0 ? "PAID" : loan.paymentStatus === "PENDING" ? "PARTIALLY_PAID" : loan.paymentStatus;

    const updatedUser = {
      ...user,
      loans: user.loans.map((l, idx) =>
        idx === loanIndex
          ? {
              ...l,
              amountPaid: newAmountPaid,
              remainingAmount: newRemaining,
              paymentStatus: newRemaining === 0 ? "PAID" : "PARTIALLY_PAID",
            }
          : l
      ),
    };

    setUserData((prev) => ({
      ...prev,
      [userId]: updatedUser,
    }));

    message.success("Payment recorded successfully.");
    setIsModalOpen(false);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Credit & Loan Payments</h1>

      <div className="flex flex-col sm:flex-row gap-6 mb-6">
        <div className="w-full sm:w-1/3">
          <Input
            placeholder="Search user by name"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="mb-4"
          />

          <div className="border rounded-md p-2">
            <Calendar
              fullscreen={false}
              onSelect={handleDateSelect}
              className="w-full"
            />
          </div>

          <button
            className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-700 font-semibold"
            onClick={() => {
              setSearchName("");
              setSelectedDate(null);
            }}
          >
            Clear
          </button>
        </div>

        <div className="flex-1 space-y-4">
          {filteredUsers.length === 0 ? (
            <p className="text-gray-500">No users found with credit/loan.</p>
          ) : (
            filteredUsers.map(([userId, user]) => (
              <Card
                key={userId}
                title={`${user.name} (${user.telephone})`}
                className="shadow-sm"
              >
                {user.loans.map((loan, index) => (
                  <div
                    key={index}
                    className="border-b py-2 flex flex-col sm:flex-row justify-between sm:items-center"
                  >
                    <div>
                      <p className="font-semibold">Product: {loan.productId}</p>
                      <p className="text-sm">Loan Date: {loan.loanDate}</p>
                      <p className="text-sm">
                        Qty: {loan.qty} × {loan.pricePerUnit} RWF
                      </p>
                      <p className="text-sm">
                        Total: {loan.totalAmount} RWF, Paid: {loan.amountPaid} RWF, Remaining:{" "}
                        <strong className="text-red-500">{loan.remainingAmount} RWF</strong>
                      </p>
                      <p className="text-sm">
                        Status: {loan.status} - {loan.paymentStatus}
                      </p>
                    </div>

                    {loan.paymentStatus !== "PAID" ? (
                      <Button
                        type="primary"
                        className="mt-3 sm:mt-0"
                        onClick={() => openPaymentModal(userId, index)}
                      >
                        Pay Now
                      </Button>
                    ) : (
                      <p className="mt-3 sm:mt-0 text-green-600 font-medium">
                        Fully Paid
                      </p>
                    )}
                  </div>
                ))}
              </Card>
            ))
          )}
        </div>
      </div>

      <Modal
        title="Record Payment"
        open={isModalOpen}
        onOk={handleOk}
        onCancel={() => setIsModalOpen(false)}
      >
        {currentLoan && (() => {
          const loan =
            userData[currentLoan.userId].loans[currentLoan.loanIndex];
          if (loan.paymentStatus === "PAID") {
            return <p>This loan has already been fully paid.</p>;
          }
          return (
            <div className="space-y-2">
              <p>
                Remaining Balance:{" "}
                <strong className="text-red-500">{loan.remainingAmount} RWF</strong>
              </p>
              <Input
                type="number"
                placeholder="Enter amount paid"
                value={paymentInput}
                onChange={(e) => setPaymentInput(e.target.value)}
              />
            </div>
          );
        })()}
      </Modal>
    </div>
  );
};

export default CreditPayment;
