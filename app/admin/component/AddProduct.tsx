"use client";

import React, { useState } from "react";
import { Form, Input, Button, Select, Divider, message } from "antd";
import { v4 as uuidv4 } from "uuid";

const { Option } = Select;

interface Product {
  id: string;
  name: string;
  category: string;
  brand: string;
  price: number;
  quality: string | number;
  quantity: number;
  createdAt: string;
}

const AddProductPage = () => {
  const [form] = Form.useForm();

  // Initial data
  const initialProducts: Product[] = [
    {
      id: uuidv4(),
      name: "t-shirt",
      category: "clothing",
      brand: "nike",
      price: 20000,
      quality: 8,
      quantity: 15,
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      name: "jacket",
      category: "clothing",
      brand: "adidas",
      price: 40000,
      quality: 9,
      quantity: 10,
      createdAt: new Date().toISOString(),
    },
  ];

  const [products, setProducts] = useState<Product[]>(initialProducts);

  const [categoryBrandMap, setCategoryBrandMap] = useState<Record<string, string[]>>({
    clothing: ["nike", "adidas"],
  });

  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [brandOptions, setBrandOptions] = useState<string[]>([]);
  const [productOptions, setProductOptions] = useState<string[]>([]);
  const [existingProduct, setExistingProduct] = useState<Product | null>(null);

  const handleCategoryChange = (value: string) => {
    const key = value.toLowerCase();
    setSelectedCategory(key);
    setBrandOptions(categoryBrandMap[key] || []);
    setSelectedBrand("");
    form.setFieldsValue({ brand: undefined, product: undefined, price: undefined, quality: undefined });
    setProductOptions([]);
    setExistingProduct(null);
  };

  const handleCategoryAdd = (input: string) => {
    const key = input.toLowerCase();
    if (!categoryBrandMap[key]) {
      setCategoryBrandMap((prev) => ({ ...prev, [key]: [] }));
      setBrandOptions([]);
    }
    setSelectedCategory(key);
  };

  const handleBrandChange = (value: string) => {
    const brand = value.toLowerCase();
    setSelectedBrand(brand);
    form.setFieldsValue({ product: undefined, price: undefined, quality: undefined });
    const names = products
      .filter((p) => p.category === selectedCategory && p.brand === brand)
      .map((p) => p.name);
    setProductOptions(names);
    setExistingProduct(null);
  };

  const handleBrandAdd = (input: string) => {
    const brand = input.toLowerCase();
    if (!selectedCategory) {
      message.warning("Select category first.");
      return;
    }
    setCategoryBrandMap((prev) => {
      const updated = {
        ...prev,
        [selectedCategory]: Array.from(new Set([...(prev[selectedCategory] || []), brand])),
      };
      setBrandOptions(updated[selectedCategory]);
      return updated;
    });
    setSelectedBrand(brand);
  };

  const handleProductChange = (value: string) => {
    const name = value.toLowerCase();
    const found = products.find(
      (p) =>
        p.name === name &&
        p.category === selectedCategory &&
        p.brand === selectedBrand
    );
    if (found) {
      setExistingProduct(found);
      form.setFieldsValue({
        price: found.price,
        quality: found.quality,
      });
    } else {
      setExistingProduct(null);
      form.setFieldsValue({ price: undefined, quality: undefined });
    }
  };

  const handleProductAdd = (input: string) => {
    const name = input.toLowerCase();
    if (!selectedCategory || !selectedBrand) {
      message.warning("Select category and brand first.");
      return;
    }
    const existingNames = products
      .filter((p) => p.category === selectedCategory && p.brand === selectedBrand)
      .map((p) => p.name.toLowerCase());
    if (!existingNames.includes(name)) {
      setProductOptions((prev) => Array.from(new Set([...prev, name])));
      form.setFieldsValue({ product: name });
    }
    setExistingProduct(null);
  };

  const onFinish = (values: any) => {
    const name = values.product.toLowerCase();
    const category = values.category.toLowerCase();
    const brand = values.brand.toLowerCase();
    const price = parseFloat(values.price);
    // Accept quality as string or number
    const quality = values.quality;
    const quantity = parseInt(values.quantity, 10);

    const existingIndex = products.findIndex(
      (p) => p.name === name && p.category === category && p.brand === brand
    );

    if (existingIndex !== -1) {
      const updated = [...products];
      updated[existingIndex].quantity += quantity;
      updated[existingIndex].price = price;
      updated[existingIndex].quality = quality;
      setProducts(updated);
      message.success("Product quantity updated.");
    } else {
      const newProduct: Product = {
        id: uuidv4(),
        name,
        category,
        brand,
        price,
        quality,
        quantity,
        createdAt: new Date().toISOString(),
      };
      setProducts([...products, newProduct]);

      setCategoryBrandMap((prev) => ({
        ...prev,
        [category]: Array.from(new Set([...(prev[category] || []), brand])),
      }));

      message.success("New product added.");
    }

    form.resetFields();
    setExistingProduct(null);
    setProductOptions([]);
  };

  return (
    <div className="p-6 max-w-xl mx-auto bg-white shadow rounded-md mt-8">
      <h2 className="text-2xl font-bold mb-4">🛍 Add / Update Product</h2>

      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item name="category" label="Category" rules={[{ required: true }]}>
          <Select
            showSearch
            placeholder="Select or create category"
            onChange={handleCategoryChange}
            onSearch={handleCategoryAdd}
            options={Object.keys(categoryBrandMap).map((cat) => ({
              value: cat,
              label: cat,
            }))}
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            allowClear
          />
        </Form.Item>

        <Form.Item name="brand" label="Brand" rules={[{ required: true }]}>
          <Select
            showSearch
            placeholder="Select or create brand"
            disabled={!selectedCategory}
            onChange={handleBrandChange}
            onSearch={handleBrandAdd}
            options={brandOptions.map((b) => ({ value: b, label: b }))}
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            allowClear
          />
        </Form.Item>

        <Form.Item name="product" label="Product" rules={[{ required: true }]}>
          <Select
            showSearch
            placeholder="Enter or choose product"
            disabled={!selectedBrand}
            onChange={handleProductChange}
            onSearch={handleProductAdd}
            options={productOptions.map((p) => ({ value: p, label: p }))}
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            allowClear
          />
        </Form.Item>

        <Form.Item name="price" label="Price (RWF)" rules={[{ required: true }]}>
          <Input type="number" placeholder="e.g. 15000" min={0} />
        </Form.Item>

        <Form.Item
          name="quality"
          label="Quality (number or string)"
          rules={[{ required: true }]}
        >
          <Select
            showSearch
            mode="tags"
            placeholder="Enter or select quality (1–10 or text like 'excellent')"
            maxTagCount={1}
            open={false}
            onChange={(value) => {
              if (Array.isArray(value)) {
                form.setFieldsValue({ quality: value[0] });
              }
            }}
          />
        </Form.Item>

        <Form.Item
          name="quantity"
          label="Quantity to Add"
          rules={[{ required: true, min: 1 }]}
        >
          <Input type="number" min={1} />
        </Form.Item>

        <Divider />
        <Form.Item>
          <Button type="primary" htmlType="submit" block>
            Save Product
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default AddProductPage;
