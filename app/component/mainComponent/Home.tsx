"use client";

import React, { useEffect, useState } from "react";
import { Select, Input, message, Button } from "antd";
import CartDisplay from "./CartDisplay";
import AddUser from "./AddUser";


const Home: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedUserCart, setSelectedUserCart] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedBrandId, setSelectedBrandId] = useState<string>("");
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedProductQty, setSelectedProductQty] = useState<number>(1);
  const [selectedProductPrice, setSelectedProductPrice] = useState<number>(0);
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL //|| "http://localhost:3000/api";

  useEffect(() => {
    fetchClients();
    fetchProducts();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/getallclient`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.clients);
      } else {
        message.error("Failed to load clients");
      }
    } catch (err) {
      console.error("Client Fetch Error:", err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/getallproduct`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
      } else {
      }
    } catch (err) {
      console.error("Product Fetch Error:", err);
      message.error("Error fetching products");
    }
  };

  const handleUserChange = (userId: string) => {
  setSelectedUserId(userId);
  const user = users.find((u) => u.id === userId);
  const rawCart = user?.cart || {};

  const flatCart: any[] = [];

  Object.values(rawCart).forEach((items: any, index) => {
    items.forEach((entry: any) => {
      const product = products.find((p) => p.id === entry.productId);
      if (product) {
        flatCart.push({
          cartId: entry.id,
          productId: entry.productId,
          name: product.productName,
          qty: entry.qty,
          price: product.unitPrice,
          category: product.category,
          brand: product.brand,
          date: Object.keys(rawCart)[index], // Use the date as the key
        });
      }
    });
  });

  setSelectedUserCart(flatCart);
};


  const handleAddUser = (newUser: any) => {
    setUsers((prev) => [...prev, newUser]);
    setSelectedUserId(newUser.id);
    setSelectedUserCart([]);
  };

 const handleAddProductToCart = async () => {
  const product = products.find((p) => p.id === selectedProductId);
  if (!product || !selectedUserId) return;

  try {
    const res = await fetch(`${BACKEND_URL}/addtocart`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        clientId: selectedUserId,
        productId: product.id,
        qty: selectedProductQty,
      }),
    });

    const result = await res.json();
    if (!res.ok || !result.success) {
      message.error("Failed to add product to cart");
      return;
    }

    const updatedCart = [
      ...selectedUserCart,
      {
        productId: product.id,
        name: product.productName,
        qty: selectedProductQty,
        price: selectedProductPrice,
        category: product.category,
        brand: product.brand,
      },
    ];

    setSelectedUserCart(updatedCart);
    setSelectedProductId("");
    setSelectedProductQty(1);
    setSelectedProductPrice(0);
    message.success("Product added to cart successfully");
  } catch (error) {
    console.error("Error adding to cart:", error);
    message.error("An error occurred while adding product to cart");
  }
};


  const categories = Array.from(
    new Map(products.map((p) => [p.category.id, p.category])).values()
  );

  const brands = selectedCategoryId
    ? Array.from(
        new Map(
          products
            .filter((p) => p.categoryId === selectedCategoryId)
            .map((p) => [p.brand.id, p.brand])
        ).values()
      )
    : [];

  const filteredProducts = selectedBrandId
    ? products.filter((p) => p.brandId === selectedBrandId && p.categoryId === selectedCategoryId)
    : [];

  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
    const product = products.find((p) => p.id === productId);
    if (product) {
      setSelectedProductPrice(product.unitPrice);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-10 w-full p-6 justify-between">
      <div className="w-full sm:max-w-3/5">
        <h2 className="text-xl font-semibold mb-4">Select User</h2>
        <Select
          showSearch
          style={{ width: "100%" }}
          placeholder="Search user"
          optionFilterProp="label"
          onChange={handleUserChange}
          value={selectedUserId || undefined}
          options={users.map((user) => ({
            label: user.name,
            value: user.id,
          }))}
        />

        <h2 className="text-xl font-semibold mt-6 mb-2">Select Category</h2>
        <Select
          style={{ width: "100%" }}
          placeholder="Select category"
          onChange={(id) => {
            setSelectedCategoryId(id);
            setSelectedBrandId("");
            setSelectedProductId("");
          }}
          value={selectedCategoryId || undefined}
          options={categories.map((cat) => ({ label: cat.name, value: cat.id }))}
        />

        <h2 className="text-xl font-semibold mt-6 mb-2">Select Brand</h2>
        <Select
          style={{ width: "100%" }}
          placeholder="Select brand"
          onChange={(id) => {
            setSelectedBrandId(id);
            setSelectedProductId("");
          }}
          value={selectedBrandId || undefined}
          options={brands.map((b) => ({ label: b.name, value: b.id }))}
          disabled={!selectedCategoryId}
        />

        <h2 className="text-xl font-semibold mt-6 mb-2">Select Product</h2>
        <Select
          style={{ width: "100%" }}
          placeholder="Select product"
          onChange={handleProductSelect}
          value={selectedProductId || undefined}
          options={filteredProducts.map((p) => ({
            label: p.productName,
            value: p.id,
          }))}
          disabled={!selectedBrandId}
        />

        <h2 className="text-xl font-semibold mt-6 mb-2">Product Price (Editable)</h2>
        <Input
          type="number"
          min={0}
          value={selectedProductPrice}
          onChange={(e) => setSelectedProductPrice(Number(e.target.value))}
          placeholder="Enter price"
        />

        <Input
          type="number"
          min={1}
          value={selectedProductQty}
          onChange={(e) => setSelectedProductQty(Number(e.target.value))}
          className="mt-3"
          placeholder="Quantity"
        />

        <Button
          type="primary"
          className="mt-3 w-full"
          onClick={handleAddProductToCart}
          disabled={!selectedProductId || !selectedUserId}
        >
          Add to Cart
        </Button>
      </div>

      {selectedUserId ? (
    <CartDisplay
        cart={selectedUserCart}
        clientId={selectedUserId}
        onUpdateCart={(updated) => setSelectedUserCart(updated)}
      />

      ) : (
        <AddUser onAdd={handleAddUser} />
      )}
    </div>
  );
};

export default Home;
