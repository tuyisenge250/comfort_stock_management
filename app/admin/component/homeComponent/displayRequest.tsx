"use client";

import React, { useEffect, useState } from "react";

interface ProductData {
    success: boolean;
    products: Product[];
}

interface Product {
    id: string;
    categoryId: string;
    brandId: string;
    unitPrice: number;
    quantity: number;
    productName: string;
    stockTracker: StockTracker;
    category: {
        name: string;
    };
    brand: {
        name: string;
    };
}

interface StockTracker {
    soldTracker: {
        [date: string]: SoldItem[];
    };
}

interface SoldItem {
    id: string;
    status: string;
    soldQty: number;
    clientId: string;
    updatedAt: string;
    initialQty?: number;
    priceAtSale?: number;
    remainingQty?: number;
    paymentBreakdown?: PaymentBreakdown;
    amountPaid?: number;
    creditAmount?: number;
    paymentStatus?: string;
}

interface PaymentBreakdown {
    cash?: number;
    MOMO?: number;
    credit?: number;
}

type DisplayRequestProps = { setSelectedKey: (key: string) => void };

const DisplayRequest: React.FC<DisplayRequestProps> = ({ setSelectedKey }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000/api";

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/getallsell`);
        const data: ProductData = await response.json();
        setProducts(data.products || []);
      } catch (error) {
        console.error("Error fetching sales data:", error);
      }
    };

    fetchSales();
  }, []);

  const handleAction = async (
    productId: string,
    entryId: string,
    action: "approve" | "reject"
  ) => {
    setIsLoading(true);
    try {
      // First make the API call to update the status in the backend
      const response = await fetch(`${BACKEND_URL}/admin/approvalrequest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          entryId,
          action
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      // Only update the frontend state if the backend update was successful
      setProducts(prevProducts => 
        prevProducts.map(product => {
          if (product.id === productId) {
            const updatedSoldTracker = {...product.stockTracker.soldTracker};
            
            // Find and update the specific entry across all dates
            Object.keys(updatedSoldTracker).forEach(date => {
              updatedSoldTracker[date] = updatedSoldTracker[date].map(item => {
                if (item.id === entryId) {
                  return {
                    ...item, 
                    status: action === "approve" ? "complete" : "cancelled"
                  };
                }
                return item;
              });
            });

            return {
              ...product,
              stockTracker: {
                ...product.stockTracker,
                soldTracker: updatedSoldTracker
              }
            };
          }
          return product;
        })
      );
    } catch (error) {
      console.error("Error updating sale status:", error);
      alert("Failed to update status. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Flatten and sort all RequestCancel items from all products
  const allCancelRequests = products.flatMap(product => {
    const soldTracker = product.stockTracker.soldTracker;
    return Object.entries(soldTracker).flatMap(([date, items]) => 
      items
        .filter(item => item.status === "RequestCancel")
        .map(item => ({
          productId: product.id,
          entryId: item.id,
          productName: product.productName,
          brand: product.brand.name,
          category: product.category.name,
          date,
          ...item
        }))
    );
  }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  // Get either the latest 3 or all requests based on showAll state
  const cancelRequests = showAll ? allCancelRequests : allCancelRequests.slice(0, 3);

  return (
    <div className="w-full bg-gray-100 p-2">
      <h1 className="font-bold text-3xl text-center mb-6">Cancel Request Approvals</h1>

      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg">Processing request...</div>
        </div>
      )}

      {cancelRequests.length > 0 ? (
        <>
          {cancelRequests.map((request) => {
            const paymentMethods = request.paymentBreakdown 
              ? Object.entries(request.paymentBreakdown)
                  .filter(([_, value]) => value && value > 0)
                  .map(([method]) => method)
                  .join(", ")
              : "Unknown";

            return (
              <div
                key={`${request.productId}-${request.entryId}`}
                className="bg-white shadow p-4 rounded mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="text-gray-800 text-sm">
                  <p>
                    <strong>Product:</strong> {request.productName} ({request.brand})
                  </p>
                  <p>
                    <strong>Category:</strong> {request.category}
                  </p>
                  <p>
                    <strong>Date:</strong> {new Date(request.updatedAt).toLocaleString()}
                  </p>
                  <p>
                    <strong>Qty:</strong> {request.soldQty} | 
                    <strong> Price:</strong> {request.priceAtSale} RWF
                  </p>
                  <p>
                    <strong>Payment:</strong> {paymentMethods}
                  </p>
                </div>

                <div className="flex gap-2 flex-col">
                  <button
                    onClick={() => handleAction(request.productId, request.entryId, "reject")}
                    disabled={isLoading}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-red-400"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleAction(request.productId, request.entryId, "approve")}
                    disabled={isLoading}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-green-400"
                  >
                    Approve
                  </button>
                </div>
              </div>
            );
          })}

          {allCancelRequests.length > 3 && (
            <button 
              onClick={() => setShowAll(!showAll)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 w-full"
            >
              {showAll ? "Show Less" : "Show All Requests"}
            </button>
          )}
        </>
      ) : (
        <p className="text-center text-gray-500 mt-8">
          No cancel requests pending.
        </p>
      )}

      <button 
        onClick={() => setSelectedKey("2")}
        className="mt-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 w-full"
      >
        Move To All Request to Cancel
      </button>
    </div>
  );
};

export default DisplayRequest;