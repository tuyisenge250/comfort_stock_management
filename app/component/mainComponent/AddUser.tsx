"use client";
import { Select, Input, Button, message } from "antd";
import React, { useState } from "react";
import { User } from "lucide-react";

const AddUser: React.FC<{ onAdd: (user: { id: string; name: string; telephone: string; tinNumber?: string }) => void }> = ({ onAdd }) => {
  const [name, setName] = useState("");
  const [telephone, setTelephone] = useState("");
  const [tinNumber, setTinNumber] = useState("");

  const handleAdd = () => {
    if (!name.trim() || !telephone.trim()) {
      message.error("Please fill in all required fields (Name and Telephone)");
      return;
    }
    const newUser = {
      id: `user-${Date.now()}`,
      name,
      telephone,
      tinNumber: tinNumber.trim() || undefined,
      cart: []
    };
    onAdd(newUser);
    setName("");
    setTelephone("");
    setTinNumber("");
  };

  return (
    <div className="p-4 rounded shadow-lg w-full max-w-md">
      <h3 className="text-lg font-semibold mb-3">Add New User</h3>
      <Input
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="mb-3"
      />
      <p className="mt-3"></p>
      <Input
        placeholder="Telephone"
        value={telephone}
        onChange={(e) => setTelephone(e.target.value)}
        className="mb-3"
      />
        <p className="mt-3"></p>
      <Input
        placeholder="TIN Number (optional)"
        value={tinNumber}
        onChange={(e) => setTinNumber(e.target.value)}
        className="mb-3"
      />
      <Button type="primary" onClick={handleAdd} block className="mt-4">
        Add User
      </Button>
    </div>
  );
};

export default AddUser;
