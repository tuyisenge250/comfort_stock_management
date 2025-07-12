"use client";

import React, { useState } from 'react';
import { Card, Button, Modal, Input, message } from 'antd';

interface CartItem {
  productId: string;
  name: string;
  qty: number;
  price: number;
  category: { name: string };
  brand: { name: string };
  cartId?: string; 
  date?: string;   
}

interface CartDisplayProps {
  cart: CartItem[];
  clientId?: string;
  onUpdateCart: (updatedCart: CartItem[]) => void;
}

const CartDisplay: React.FC<CartDisplayProps> = ({ cart, clientId, onUpdateCart }) => {
  console.log('CartDisplay rendered with cart:', cart, 'clientId:', clientId);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentBreakdown, setPaymentBreakdown] = useState<{ cash?: number; MOMO?: number; credit?: number }>({});
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000/api";

  const total = cart.reduce((sum, item) => sum + item.qty * item.price, 0);
  const amountPaid = (paymentBreakdown.cash || 0) + (paymentBreakdown.MOMO || 0);
  const remaining = total - amountPaid;

  const removeItem = async (cartId?: string, date?: string) => {
    if (!cartId || !date || !clientId){
      console.log('missing: '+cartId + date + clientId);
      return
    };

    try {
      const res = await fetch(`${BACKEND_URL}/removetocart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, cartId, clientId }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        message.error("Failed to remove item from cart");
        return;
      }


      const updatedCart = cart.filter((item) => item.cartId !== cartId);
      onUpdateCart(updatedCart);
    } catch (err) {
      console.error("Remove cart error:", err);
      message.error("Something went wrong while removing the item.");
    }
  };

  const clearCart = async () => {
    if (!clientId) return;

    try {
      const res = await fetch(`${BACKEND_URL}/removeallcart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        message.error("Failed to clear cart");
        return;
      }

      onUpdateCart([]);
    } catch (err) {
      console.error("Clear cart error:", err);
      message.error("Failed to clear cart.");
    }
  };

  const handleCheckout = async () => {
    if (!clientId) {
      message.error("Client not selected.");
      return;
    }

    const sales = cart.map((item) => ({
      productId: item.productId,
      soldQty: item.qty,
      priceAtSale: item.price,
      clientId,
      paymentBreakdown,
      status: "complete",
    }));

    try {
      const res = await fetch(`${BACKEND_URL}/sellproduct`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sales),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        message.error("Failed to submit sales.");
        console.error("SellProduct error:", result);
        return;
      }

      message.success("Sales submitted successfully!");
      setIsModalOpen(false);
      onUpdateCart([]);
    } catch (err) {
      console.error("Checkout Error:", err);
      message.error("An error occurred while submitting sales.");
    }
  };

  const updateBreakdown = (method: string, value: string) => {
    const num = Number(value);
    setPaymentBreakdown((prev) => ({
      ...prev,
      [method]: isNaN(num) ? 0 : num,
    }));
  };

  if (!cart || cart.length === 0) {
    return (
      <div className="w-full sm:max-w-md">
        <h2 className="text-xl font-semibold mb-4">🛒 Cart</h2>
        <p className="text-gray-500">Your cart is empty.</p>
      </div>
    );
  }

  return (
    <div className="w-full sm:max-w-md">
      <h2 className="text-xl font-semibold mb-4">🛒 Cart</h2>
      {cart.map((item, index) => (
        <Card key={index} className="mb-3" size="small">
          <p><strong>{item.name}</strong></p>
          <p>Qty: {item.qty}</p>
          <p>Price: {item.price} RWF</p>
          <p>Category: {item.category.name}</p>
          <p>Brand: {item.brand.name}</p>
          <p className="font-bold">Total: {item.qty * item.price} RWF</p>
          <div>
            <button
              className='text-red-500 border border-red-500 px-3 py-1 rounded hover:bg-red-100'
              onClick={() => removeItem(item.cartId, item.date)}
            >
              Remove
            </button>
          </div>
        </Card>
      ))}

      <div className="mt-2 text-right font-bold">Total: {total} RWF</div>

      <div className="flex justify-between gap-3 mt-4">
        <Button type="primary" onClick={() => setIsModalOpen(true)}>
          Checkout
        </Button>
        <Button onClick={clearCart} danger>
          Clear Cart
        </Button>
      </div>

      <Modal
        title="Checkout"
        open={isModalOpen}
        onOk={handleCheckout}
        onCancel={() => setIsModalOpen(false)}
        okText="Submit Order"
      >
        <div className="space-y-4">
          <div>
            <p className="font-medium mb-1">Cash Paid:</p>
            <Input
              type="number"
              placeholder="Cash amount"
              onChange={(e) => updateBreakdown("cash", e.target.value)}
              addonAfter="RWF"
            />
          </div>
          <div>
            <p className="font-medium mb-1">Mobile Money Paid:</p>
            <Input
              type="number"
              placeholder="Momo amount"
              onChange={(e) => updateBreakdown("MOMO", e.target.value)}
              addonAfter="RWF"
            />
          </div>
          <div>
            <p className="font-medium mb-1">Credit (auto-calculated):</p>
            <Input
              type="number"
              value={remaining > 0 ? remaining : 0}
              readOnly
              addonAfter="RWF"
            />
          </div>
          <p className="text-sm text-gray-600">Amount Paid: <strong>{amountPaid}</strong> RWF — Remaining: <strong>{remaining}</strong> RWF</p>
        </div>
      </Modal>
    </div>
  );
};

export default CartDisplay;
