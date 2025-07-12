"use client";

import React, { useEffect, useState } from "react";
import { Calendar, Select, Spin, message } from "antd";
import type { CalendarProps } from "antd";
import dayjs, { Dayjs } from "dayjs";

interface Client {
  id: string;
  name: string;
}

interface SaleEntry {
  id: string;
  date: string;
  soldQty: number;
  initialQty: number;
  remainingQty: number;
  clientId: string;
  priceAtSale: number;
  paymentBreakdown: Record<string, number>;
  status: string;
  productId: string;
  productName: string;
}

const CancelSell: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [sales, setSales] = useState<SaleEntry[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | undefined>();
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [loading, setLoading] = useState(true);

  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3000/api";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cRes, sRes] = await Promise.all([
          fetch(`${BACKEND}/getallclient`),
          fetch(`${BACKEND}/getallsell`)
        ]);

        const cJson = await cRes.json();
        const sJson = await sRes.json();

        setClients(cJson.clients || []);

        const flatSales: SaleEntry[] = [];

        sJson.products?.forEach((p: any) => {
          const soldTracker = p.stockTracker?.soldTracker || {};
          for (const [date, entries] of Object.entries(soldTracker)) {
            (entries as any[]).forEach((entry) => {
              flatSales.push({
                id: entry.id,
                date,
                soldQty: entry.soldQty,
                initialQty: entry.initialQty,
                remainingQty: entry.remainingQty,
                clientId: entry.clientId,
                priceAtSale: entry.priceAtSale,
                paymentBreakdown: entry.paymentBreakdown,
                status: entry.status,
                productId: p.id,
                productName: p.productName,
              });
            });
          }
        });

        setSales(flatSales);
      } catch (err) {
        console.error(err);
        message.error("Failed to load sales or clients.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const onDateSelect: CalendarProps<Dayjs>["onSelect"] = (value) => {
    setSelectedDate(value);
  };

  const handleCancelSale = async (sale: SaleEntry) => {
    console.log("Cancelling sale:", sale);
    try {
      const res = await fetch(`${BACKEND}/sellcancelrequest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: sale.productId,
          date: sale.date,
          entryId: sale.id,
        }),
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        console.error("Cancel failed:", result);
        message.error("❌ Failed to cancel sale.");
        return;
      }

      setSales((prev) => prev.filter((s) => s.id !== sale.id));
      message.success("✅ Sale cancelled successfully.");
    } catch (error) {
      console.error("Error cancelling sale:", error);
      message.error("⚠️ Something went wrong while cancelling.");
    }
  };

  const filteredSales = sales
    .filter((s) => (selectedClientId ? s.clientId === selectedClientId : true))
    .filter((s) => (selectedDate ? dayjs(s.date).isSame(selectedDate, "day") : true));

  if (loading) return <Spin style={{ margin: "20px auto", display: "block" }} />;

  return (
    <div className="flex flex-col sm:flex-row gap-6">
      {/* Left Filter Panel */}
      <div className="w-full sm:w-1/3">
        <Select
          showSearch
          allowClear
          className="mb-4 w-full"
          placeholder="Select client"
          value={selectedClientId}
          onChange={setSelectedClientId}
          options={clients.map((c) => ({ value: c.id, label: c.name }))}
          filterOption={(input, option) =>
            (option?.label as string).toLowerCase().includes(input.toLowerCase())
          }
        />

        <Calendar fullscreen={false} onSelect={onDateSelect} />

        {selectedDate && (
          <button
            className="mt-2 text-sm text-blue-600 underline"
            onClick={() => setSelectedDate(null)}
          >
            Clear selected date
          </button>
        )}
      </div>

      {/* Right Sales Records */}
      <div className="flex-1">
        <h2 className="text-lg font-semibold mb-3">Sales Records</h2>
        <div className="space-y-4">
          {filteredSales.length === 0 ? (
            <p className="text-gray-500">No sales match your criteria.</p>
          ) : (
            filteredSales.map((s, index) => (
              <div
                key={index}
                className="flex justify-between p-4 border rounded-md bg-white shadow-sm"
              >
                <div>
                  <p className="font-semibold text-blue-700">{s.productName}</p>
                  <p className="text-sm">Date: {s.date}</p>
                  <p className="text-sm">Qty: {s.soldQty} / {s.initialQty}</p>
                  <p className="text-sm">Remaining: {s.remainingQty}</p>
                  <p className="text-sm">Price: {s.priceAtSale} RWF</p>
                  <p className="text-sm">Status: {s.status}</p>
                  <p className="text-sm">Paid: {JSON.stringify(s.paymentBreakdown)}</p>
                </div>
                <div className="flex items-center justify-center">
                  <button
                    className="bg-red-500 py-2 px-4 font-bold text-white rounded-lg hover:bg-red-700"
                    onClick={() => handleCancelSale(s)}
                  >
                    Cancel Sale
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CancelSell;