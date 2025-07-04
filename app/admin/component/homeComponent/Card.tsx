import React from "react";

type CardProps = {
  title: string;
  sold: number;
  remaining: number;
  amount: number;
};

const Card: React.FC<CardProps> = ({ title, sold, remaining, amount }) => {
  return (
    <div className="bg-white shadow-md rounded-xl p-4 w-full sm:w-[300px] border border-gray-100 hover:shadow-lg transition-all">
      <h3 className="text-lg font-semibold text-blue-600 mb-3">{title}</h3>
      <div className="space-y-1 text-sm text-gray-700">
        <p>Total Sold: <span className="font-medium">{sold}</span></p>
        <p>Remaining Stock: <span className="font-medium">{remaining}</span></p>
        <p>Total Amount: <span className="font-semibold text-green-600">{amount.toLocaleString()} RWF</span></p>
      </div>
    </div>
  );
};

export default Card;
