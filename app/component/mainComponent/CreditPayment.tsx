"use client";

import React, { useEffect, useState } from "react";
import {
  Calendar,
  Card,
  Input,
  Button,
  Modal,
  message,
  Select,
  Spin,
} from "antd";
import type { CalendarProps } from "antd";
import dayjs, { Dayjs } from "dayjs";

interface CreditTracker {
  id: string;
  productId: string;
  qty: number;
  pricePerUnit: number;
  amountPaid: number;
  remainingAmount: number;
  creditDate: string;
  status: string;
  paymentStatus: string;
}

interface Client {
  id: string;
  name: string;
  telephone: string;
  creditTrackers: CreditTracker[];
}

const CreditPayment: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentLoan, setCurrentLoan] = useState<{
    clientId: string;
    loanIndex: number;
  } | null>(null);
  const [paymentInput, setPaymentInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL //|| "http://localhost:3000/api";

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/getallclient`);
      const data = await res.json();
      if (data.success) {
        setClients(data.clients);
      } else {
        message.error("Failed to load clients.");
      }
    } catch (error) {
      message.error("Error fetching clients.");
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients
    .filter((client) =>
      selectedClientId ? client.id === selectedClientId : true
    )
    .filter((client) =>
      selectedDate
        ? client.creditTrackers.some((loan) =>
            dayjs(loan.creditDate).isSame(selectedDate, "day")
          )
        : true
    )
    .filter((client) => client.creditTrackers.length > 0);

  const handleDateSelect: CalendarProps<Dayjs>["onSelect"] = (value) => {
    setSelectedDate(value);
  };

  const openPaymentModal = (clientId: string, loanIndex: number) => {
    setCurrentLoan({ clientId, loanIndex });
    setPaymentInput("");
    setIsModalOpen(true);
  };

  const handleOk = async () => {
    console.log("Submitting payment for loan:", currentLoan);
    if (!currentLoan) return;

    const { clientId, loanIndex } = currentLoan;
    const client = clients.find((c) => c.id === clientId);
    if (!client) return;
    const loan = client.creditTrackers[loanIndex];

    const paidAmount = parseFloat(paymentInput);
    if (isNaN(paidAmount) || paidAmount <= 0) {
      message.error("Please enter a valid amount.");
      return;
    }

    if (paidAmount > loan.remainingAmount) {
      message.error("Amount exceeds remaining loan.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${BACKEND_URL}/creditpayment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creditId: loan.id,
          amountPaid: paidAmount,
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || "Payment failed");
      }

      const newAmountPaid = loan.amountPaid + paidAmount;
      const newRemaining = loan.qty * loan.pricePerUnit - newAmountPaid;
      const paymentStatus = newRemaining <= 0 ? "PAID" : "PARTIALLY_PAID";

      const updatedClients = clients.map((c) =>
        c.id === clientId
          ? {
              ...c,
              creditTrackers: c.creditTrackers.map((l, idx) =>
                idx === loanIndex
                  ? {
                      ...l,
                      amountPaid: newAmountPaid,
                      remainingAmount: newRemaining,
                      paymentStatus,
                    }
                  : l
              ),
            }
          : c
      );

      setClients(updatedClients);
      setIsModalOpen(false);
      message.success("✅ Payment recorded successfully.");
    } catch (err) {
      console.error(err);
      message.error("❌ Failed to record payment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Credit & Loan Payments</h1>

      {loading ? (
        <Spin size="large" />
      ) : (
        <div className="flex flex-col sm:flex-row gap-6 mb-6">
          {/* Left Panel */}
          <div className="w-full sm:w-1/3">
            <Select
              showSearch
              allowClear
              placeholder="Search client by name"
              className="w-full mb-4"
              onChange={(val) => setSelectedClientId(val || null)}
              filterOption={(input, option) =>
                (option?.label as string)
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={clients.map((client) => ({
                label: client.name,
                value: client.id,
              }))}
            />

            <Calendar
              fullscreen={false}
              onSelect={handleDateSelect}
              className="w-full"
            />

            <Button
              onClick={() => {
                setSelectedClientId(null);
                setSelectedDate(null);
              }}
              className="mt-4 bg-red-500 text-white"
            >
              Clear Filters
            </Button>
          </div>

          {/* Right Panel */}
          <div className="flex-1 space-y-4">
            {filteredClients.length === 0 ? (
              <p className="text-gray-500">
                No credit or loan records match filters.
              </p>
            ) : (
              filteredClients.map((client) => (
                <Card
                  key={client.id}
                  title={`${client.name} (${client.telephone})`}
                  className="shadow-md"
                >
                  {client.creditTrackers.map((loan, index) => (
                    <div
                      key={loan.id}
                      className="border-b py-2 flex flex-col sm:flex-row justify-between sm:items-center"
                    >
                      <div>
                        <p className="font-semibold">Product ID: {loan.productId}</p>
                        <p className="text-sm">
                          Loan Date: {dayjs(loan.creditDate).format("YYYY-MM-DD")}
                        </p>
                        <p className="text-sm">
                          Qty: {loan.qty} × {loan.pricePerUnit} RWF
                        </p>
                        <p className="text-sm">
                          Total: {loan.qty * loan.pricePerUnit} RWF, Paid:{" "}
                          {loan.amountPaid} RWF, Remaining:{" "}
                          <strong className="text-red-500">
                            {loan.remainingAmount} RWF
                          </strong>
                        </p>
                        <p className="text-sm">
                          Status: {loan.status} - {loan.paymentStatus}
                        </p>
                      </div>

                      {loan.paymentStatus !== "PAID" ? (
                        <Button
                          type="primary"
                          className="mt-3 sm:mt-0"
                          onClick={() => openPaymentModal(client.id, index)}
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
      )}

      {/* Modal for payment */}
      <Modal
        title="Record Payment"
        open={isModalOpen}
        onOk={handleOk}
        confirmLoading={submitting}
        onCancel={() => setIsModalOpen(false)}
        okText="Submit"
      >
        {currentLoan && (() => {
          const client = clients.find((c) => c.id === currentLoan.clientId);
          if (!client) return null;
          const loan = client.creditTrackers[currentLoan.loanIndex];

          if (loan.paymentStatus === "PAID") {
            return <p>This loan has already been fully paid.</p>;
          }

          return (
            <div className="space-y-2">
              <p>
                Remaining Balance:{" "}
                <strong className="text-red-500">
                  {loan.remainingAmount} RWF
                </strong>
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
