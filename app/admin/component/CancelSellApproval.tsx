"use client";

import React, { useEffect, useState } from "react";
import { Input, Calendar, Card } from "antd";
import type { CalendarProps } from "antd";
import dayjs, { Dayjs } from "dayjs";

interface Client {
    id: string;
    name: string;
    telephone: string;
    cart: Record<string, unknown>;
    creditTrackers: Array<Record<string, unknown>>;
}

interface ClientsData {
    success: boolean;
    clients: Client[];
}

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

const CancelSellApproval: React.FC<{ setSelectedKey: (key: string) => void }> = ({
    setSelectedKey,
}) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [showAll, setShowAll] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [searchUser, setSearchUser] = useState("");
    const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000/api";

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const [productsResponse, clientsResponse] = await Promise.all([
                    fetch(`${BACKEND_URL}/getallsell`),
                    fetch(`${BACKEND_URL}/getallclient`),
                ]);

                const productsData: ProductData = await productsResponse.json();
                const clientsData: ClientsData = await clientsResponse.json();

                setProducts(productsData.products || []);
                setClients(clientsData.clients || []);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const getUserName = (userId: string) => {
        const client = clients.find((c) => c.id === userId);
        return client ? client.name : userId;
    };

    const handleAction = async (
        productId: string,
        entryId: string,
        action: "approve" | "reject"
    ) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${BACKEND_URL}/admin/approvalrequest`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    productId,
                    entryId,
                    action,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to update status");
            }

            setProducts((prevProducts) =>
                prevProducts.map((product) => {
                    if (product.id === productId) {
                        const updatedSoldTracker = { ...product.stockTracker.soldTracker };

                        Object.keys(updatedSoldTracker).forEach((date) => {
                            updatedSoldTracker[date] = updatedSoldTracker[date].map((item) => {
                                if (item.id === entryId) {
                                    return {
                                        ...item,
                                        status: action === "approve" ? "complete" : "cancelled",
                                    };
                                }
                                return item;
                            });
                        });

                        return {
                            ...product,
                            stockTracker: {
                                ...product.stockTracker,
                                soldTracker: updatedSoldTracker,
                            },
                        };
                    }
                    return product;
                })
            );
        } catch (error) {
            console.error("Error updating sale status:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const clearDateFilter = () => {
        setSelectedDate(null);
    };

    // Flatten and sort all RequestCancel items from all products
    const allCancelRequests = products
        .flatMap((product) => {
            const soldTracker = product.stockTracker.soldTracker;
            return Object.entries(soldTracker).flatMap(([date, items]) =>
                items
                    .filter((item) => item.status === "RequestCancel")
                    .map((item) => ({
                        productId: product.id,
                        entryId: item.id,
                        productName: product.productName,
                        brand: product.brand.name,
                        category: product.category.name,
                        date: dayjs(date).format("YYYY-MM-DD"),
                        updatedAt: item.updatedAt,
                        userName: getUserName(item.clientId),
                        priceAtSale: item.priceAtSale,
                        soldQty: item.soldQty,
                        remainingQty: item.remainingQty,
                        paymentMethod: item.paymentBreakdown
                            ? Object.entries(item.paymentBreakdown)
                                .filter(([_, value]) => value && value > 0)
                                .map(([method]) => method)
                                .join(", ")
                            : "Unknown",
                        ...item,
                    }))
            );
        })
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    // Apply filters
    const filteredRequests = allCancelRequests
        .filter((request) =>
            searchUser
                ? request.userName.toLowerCase().includes(searchUser.toLowerCase())
                : true
        )
        .filter((request) =>
            selectedDate
                ? dayjs(request.date, "YYYY-MM-DD").isSame(selectedDate, "day")
                : true
        );

    // Get either the latest 3 or all requests based on showAll state
    const cancelRequests = showAll ? filteredRequests : filteredRequests.slice(0, 3);

    return (
        <div className="w-full bg-gray-100 p-4">
            <h1 className="font-bold text-3xl text-center mb-6">Cancel Request Approvals</h1>

            {isLoading && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-4 rounded-lg">Loading data...</div>
                </div>
            )}

            <div className="flex flex-col sm:flex-row gap-6">
                {/* Left: Filters */}
                <div className="w-full sm:w-1/3">
                    <Input
                        placeholder="Search by seller name"
                        value={searchUser}
                        onChange={(e) => setSearchUser(e.target.value)}
                        className="mb-4"
                    />
                    
                    <div className="border rounded-md p-2 bg-white">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-medium">Filter by Date</h3>
                            {selectedDate && (
                                <button 
                                    onClick={clearDateFilter}
                                    className="text-blue-500 text-sm"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                        <Calendar
                            fullscreen={false}
                            onSelect={(date) => setSelectedDate(date)}
                            className="border-none"
                        />
                        {selectedDate && (
                            <div className="mt-2 text-sm text-center">
                                Selected: {selectedDate.format("MMMM D, YYYY")}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Results */}
                <div className="flex-1">
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-lg font-semibold">Cancel Requests</h2>
                        {selectedDate && (
                            <span className="text-sm text-gray-600">
                                Showing results for: {selectedDate.format("MMMM D YYYY")}
                            </span>
                        )}
                    </div>

                    {cancelRequests.length === 0 ? (
                        <div className="bg-white p-4 rounded shadow text-center">
                            <p className="text-gray-500">
                                {selectedDate || searchUser
                                    ? "No matching cancel requests found for your filters."
                                    : "No cancel requests pending."}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {cancelRequests.map((request) => (
                                <Card
                                    key={`${request.productId}-${request.entryId}`}
                                    title={`${request.productName} (${request.brand})`}
                                    bordered={false}
                                    className="shadow"
                                >
                                    <div className="text-gray-800 text-sm">
                                        <p><strong>Category:</strong> {request.category}</p>
                                        <p><strong>Date:</strong> {new Date(request.updatedAt).toLocaleString()}</p>
                                        <p><strong>Qty:</strong> {request.soldQty}</p>
                                        <p><strong>Price:</strong> {request.priceAtSale} RWF</p>
                                        <p><strong>Payment:</strong> {request.paymentMethod}</p>
                                        <p><strong>Seller:</strong> {request.userName}</p>
                                    </div>
                                    <div className="flex gap-2 mt-4">
                                        <button
                                            onClick={() =>
                                                handleAction(request.productId, request.entryId, "reject")
                                            }
                                            disabled={isLoading}
                                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-red-400 flex-1"
                                        >
                                            Reject
                                        </button>
                                        <button
                                            onClick={() =>
                                                handleAction(request.productId, request.entryId, "approve")
                                            }
                                            disabled={isLoading}
                                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-green-400 flex-1"
                                        >
                                            Approve
                                        </button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}

                    {filteredRequests.length > 3 && (
                        <button
                            onClick={() => setShowAll(!showAll)}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 w-full"
                        >
                            {showAll ? "Show Less" : "Show All Requests"}
                        </button>
                    )}

                    <div className="mt-4 text-center">
                        <button
                            onClick={() => setSelectedKey("2")}
                            className="text-blue-600 underline"
                        >
                            Show more...
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CancelSellApproval;