"use client";

import { Input, Button, message } from "antd";
import React, { useState } from "react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000/api";

const AddUser: React.FC<{
  onAdd: (user: { id: string; name: string; telephone: string; tinNumber?: string; cart: any[] }) => void;
}> = ({ onAdd }) => {
  const [name, setName] = useState("");
  const [telephone, setTelephone] = useState("");
  const [tinNumber, setTinNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!name.trim() || !telephone.trim()) {
      message.error("Please fill in all required fields (Name and Telephone)");
      return;
    }

    setLoading(true);
    const newClient = {
      name,
      telephone,
      tinNumber: tinNumber.trim() || undefined,
      cart: {}, // Optional: empty object to represent structured cart
    };

    try {
      const res = await fetch(`${BACKEND_URL}/addclient`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newClient),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        message.error(result.message || "Failed to add client.");
        return;
      }

      onAdd(result.client); // assuming backend returns { success: true, client: { ... } }
      message.success("Client added successfully!");

      setName("");
      setTelephone("");
      setTinNumber("");
    } catch (err) {
      console.error("Add client error:", err);
      message.error("An error occurred while adding the client.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 rounded shadow-lg w-full max-w-md">
      <h3 className="text-lg font-semibold mb-3">Add New Client</h3>
      <Input
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="mb-3"
      />
      <Input
        placeholder="Telephone"
        value={telephone}
        onChange={(e) => setTelephone(e.target.value)}
        className="mb-3"
      />
      <Input
        placeholder="TIN Number (optional)"
        value={tinNumber}
        onChange={(e) => setTinNumber(e.target.value)}
        className="mb-3"
      />
      <Button
        type="primary"
        onClick={handleAdd}
        block
        loading={loading}
        className="mt-4"
      >
        Add Client
      </Button>
    </div>
  );
};

export default AddUser;
