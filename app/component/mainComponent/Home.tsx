"use client";

import React, { useState } from "react";
import { Select, Input, message, Card, Button } from "antd";
import CartDisplay from "./CartDisplay";
import AddUser from "./AddUser";

const mockData = {
  users: [
    {
      id: "user-001",
      name: "Alice",
      telephone: "+250788123456",
      cart: [
        {
          productId: "prod-101",
          name: "T-shirt",
          qty: 2,
          price: 20.0,
          category: { id: "cat-001", name: "Clothing" },
          brand: { id: "brand-001", name: "Nike" }
        }
      ]
    },
    {
      id: "user-002",
      name: "Bob",
      telephone: "+250788654321",
      cart: []
    }
  ],
  categories: [
    {
      id: "cat-001",
      name: "Clothing",
      brands: [
        {
          id: "brand-001",
          name: "Nike",
          products: [
            {
              id: "prod-101",
              name: "T-shirt",
              price: 20.0,
              quality: 100,
              createdAt: "2025-07-02T12:00:00Z"
            }
          ]
        }
      ]
    },
    {
      id: "cat-002",
      name: "Footwear",
      brands: [
        {
          id: "brand-002",
          name: "Adidas",
          products: [
            {
              id: "prod-102",
              name: "Shoes",
              price: 50.0,
              quality: 80,
              createdAt: "2025-07-01T09:00:00Z"
            }
          ]
        }
      ]
    }
  ]
};



const Home: React.FC = () => {
  const [users, setUsers] = useState(mockData.users);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedUserCart, setSelectedUserCart] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedBrandId, setSelectedBrandId] = useState<string>("");
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedProductQty, setSelectedProductQty] = useState<number>(1);
  const [selectedProductPrice, setSelectedProductPrice] = useState<number>(0);

    const handleUserChange = (userId: string) => {
    setSelectedUserId(userId);
    const foundUser = users.find((user) => user.id === userId);
    setSelectedUserCart(foundUser?.cart || []);
  };

  const handleAddUser = (newUser: { id: string; name: string; telephone: string }) => {
    setUsers([...users, newUser]);
    setSelectedUserId(newUser.id);
    setSelectedUserCart([]);
  };


  const handleAddProductToCart = () => {
    const category = mockData.categories.find(c => c.id === selectedCategoryId);
    const brand = category?.brands.find(b => b.id === selectedBrandId);
    const product = brand?.products.find(p => p.id === selectedProductId);
    if (!product || !brand || !category) return;

    const updatedCart = [
      ...selectedUserCart,
      {
        productId: product.id,
        name: product.name,
        qty: selectedProductQty,
        price: selectedProductPrice,
        category: { id: category.id, name: category.name },
        brand: { id: brand.id, name: brand.name }
      }
    ];
    setSelectedUserCart(updatedCart);
    selectedBrandId && setSelectedBrandId("");
    setSelectedProductId("");
    setSelectedProductQty(1);
    setSelectedProductPrice(0); 
  };

  const getBrands = () =>
    mockData.categories.find((cat) => cat.id === selectedCategoryId)?.brands || [];

  const getProducts = () =>
    getBrands().find((b) => b.id === selectedBrandId)?.products || [];

  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
    const product = getProducts().find((p) => p.id === productId);
    if (product) {
      setSelectedProductPrice(product.price);
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
          filterSort={(a, b) => (a?.label ?? "").localeCompare(b?.label ?? "")}
          onChange={handleUserChange}
          value={selectedUserId || undefined}
          options={users.map((user) => ({
            label: user.name,
            value: user.id
          }))}
        />

        <h2 className="text-xl font-semibold mt-6 mb-2">Select Category</h2>
        <Select
          showSearch
          style={{ width: "100%" }}
          placeholder="Category"
          onChange={(id) => {
            setSelectedCategoryId(id);
            setSelectedBrandId("");
            setSelectedProductId("");
          }}
          options={mockData.categories.map((cat) => ({ label: cat.name, value: cat.id }))}
        />

        <h2 className="text-xl font-semibold mt-6 mb-2">Select Brand</h2>
        <Select
          showSearch
          style={{ width: "100%" }}
          placeholder="Brand"
          onChange={(id) => {
            setSelectedBrandId(id);
            setSelectedProductId("");
          }}
          value={selectedBrandId || undefined}
          options={getBrands().map((brand) => ({ label: brand.name, value: brand.id }))}
          disabled={!selectedCategoryId}
        />

        <h2 className="text-xl font-semibold mt-6 mb-2">Select Product</h2>
        <Select
          showSearch
          style={{ width: "100%" }}
          placeholder="Product"
          onChange={handleProductSelect}
          value={selectedProductId || undefined}
          options={getProducts().map((product) => ({ label: product.name, value: product.id }))}
          disabled={!selectedBrandId}
        />

        <h2 className="text-xl font-semibold mt-6 mb-2">Product Price (Editable)</h2>
        <Input
          type="number"
          min={0}
          value={selectedProductPrice}
          onChange={(e) => setSelectedProductPrice(Number(e.target.value))}
          placeholder="Product price"
        />
        <p className="mt-3"></p>
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
        <CartDisplay cart={selectedUserCart} />
      ) : (
        <AddUser onAdd={handleAddUser} />
      )}
    </div>
  );
};

export default Home;
