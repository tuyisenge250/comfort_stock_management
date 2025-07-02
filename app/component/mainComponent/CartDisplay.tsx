"use client";

import React, { useState } from 'react';
import { Card, Button, Modal, Select, Input } from 'antd';

const CartDisplay: React.FC<{ cart: any[] }> = ({ cart }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [cashPaid, setCashPaid] = useState(0);

  const total = cart.reduce((sum, item) => sum + item.qty * item.price, 0);
  const remaining = total - cashPaid;

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    setIsModalOpen(false);
    console.log("Order submitted", { paymentMethod, total, cashPaid, remaining });
  };

  const handleCancel = () => {
    setIsModalOpen(false);
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
          <p className='font-bold'>Total: {item.qty * item.price} RWF</p>
          <button
            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
            onClick={() => {
              cart.splice(index, 1);
              console.log(`Remove ${item.name} from cart`);
            }}
          >     
            Remove
          </button>
        </Card>
      ))}

      <div className="mt-2 text-right font-bold">Total: {total} RWF</div>

      <Button type="primary" onClick={showModal} className="mt-4">Checkout</Button>

      <Modal
        title="Checkout"
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <p className="font-semibold mb-2">Select Payment Method:</p>
        <Select
          value={paymentMethod}
          onChange={(value) => setPaymentMethod(value)}
          style={{ width: '100%' }}
          options={[
            { label: 'Cash', value: 'cash' },
            { label: 'Mobile Money', value: 'momo' },
            { label: 'Credit', value: 'credit' }
          ]}
        />

        {paymentMethod === 'credit' && (
          <div className="mt-4">
            <p className="mb-1 font-medium">Cash Paid (if partial):</p>
            <Input
              type="number"
              value={cashPaid}
              onChange={(e) => setCashPaid(Number(e.target.value))}
              placeholder="Enter amount paid"
              addonAfter="RWF"
            />
            <p className="mt-2 text-sm text-gray-600">Remaining Credit: <strong>{remaining > 0 ? remaining : 0} RWF</strong></p>
          </div>
        )}
      </Modal>

      <button
        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 mt-3 ml-2"
        onClick={() => {
          console.log("Clear cart clicked");
        }}
      >
        Clear Cart
      </button>
    </div>
  );
};

export default CartDisplay;
