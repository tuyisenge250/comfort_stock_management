"use client";

import React, { useState, useEffect } from "react";
import { Form, Input, Button, Select, Divider, message } from "antd";

const { Option } = Select;

interface Product {
  id: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  category: {
    id: string;
    name: string;
  };
  brand: {
    id: string;
    name: string;
  };
}

interface ApiResponse {
  success: boolean;
  data: Product[];
}

const AddProductPage = () => {
  const [form] = Form.useForm();
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryBrandMap, setCategoryBrandMap] = useState<Record<string, string[]>>({});
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [brandOptions, setBrandOptions] = useState<string[]>([]);
  const [productOptions, setProductOptions] = useState<string[]>([]);
  const [existingProduct, setExistingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000/api";

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/getallproduct`);
        const data: ApiResponse = await res.json();
        
        if (data.success) {
          setProducts(data.data);

          const newCategoryBrandMap: Record<string, string[]> = {};
          data.data.forEach((product) => {
            const categoryName = product.category.name.toLowerCase();
            const brandName = product.brand.name.toLowerCase();
            
            if (!newCategoryBrandMap[categoryName]) {
              newCategoryBrandMap[categoryName] = [];
            }
            
            if (!newCategoryBrandMap[categoryName].includes(brandName)) {
              newCategoryBrandMap[categoryName].push(brandName);
            }
          });
          
          setCategoryBrandMap(newCategoryBrandMap);
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
        message.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleCategoryChange = (value: string) => {
    const key = value.toLowerCase();
    setSelectedCategory(key);
    setBrandOptions(categoryBrandMap[key] || []);
    setSelectedBrand("");
    form.setFieldsValue({ brand: undefined, product: undefined, unitPrice: undefined });
    setProductOptions([]);
    setExistingProduct(null);
  };
  console.log(products)
  const handleBrandChange = (value: string) => {
    const brand = value.toLowerCase();
    setSelectedBrand(brand);
    form.setFieldsValue({ product: undefined, unitPrice: undefined });

    const names = products
      .filter(p => 
        p.category.name.toLowerCase() === selectedCategory && 
        p.brand.name.toLowerCase() === brand
      )
      .map(p => p.productName);
      
    setProductOptions(names);
    setExistingProduct(null);
  };

  const handleProductChange = (value: string) => {
    const name = value.toLowerCase();
    const found = products.find(
      p =>
        p.productName.toLowerCase() === name &&
        p.category.name.toLowerCase() === selectedCategory &&
        p.brand.name.toLowerCase() === selectedBrand
    );
    
    if (found) {
      setExistingProduct(found);
      form.setFieldsValue({
        unitPrice: found.unitPrice,
        quantity: 1 // Default quantity when selecting existing product
      });
    } else {
      setExistingProduct(null);
      form.setFieldsValue({ unitPrice: undefined, quantity: 1 });
    }
  };

  const onFinish = async (values: any) => {
    try {
      const productData = {
        productName: values.product,
        categoryName: values.category,
        brandName: values.brand,
        unitPrice: parseFloat(values.unitPrice),
        quantity: parseInt(values.quantity, 10)
      };

      const res = await fetch(`${BACKEND_URL}/admin/addproduct`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });

      const response = await res.json();

      if (response.success) {
        message.success("Product saved successfully");
        // Refresh the product list
        const refreshRes = await fetch(`${BACKEND_URL}/getallproduct`);
        const refreshData: ApiResponse = await refreshRes.json();
        setProducts(refreshData.data);
        form.resetFields();
      } else {
        throw new Error(response.message || "Failed to save product");
      }
    } catch (err) {
      console.error(err);
      message.error(err instanceof Error ? err.message : "Failed to save product");
    }
  };

  if (loading) {
    return <div className="p-6 max-w-xl mx-auto text-center">Loading products...</div>;
  }

  return (
    <div className="p-6 max-w-xl mx-auto bg-white shadow rounded-md mt-8">
      <h2 className="text-2xl font-bold mb-4">🛍 Add / Update Product</h2>

      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item name="category" label="Category" rules={[{ required: true }]}>
          <Select
            showSearch
            placeholder="Select category"
            onChange={handleCategoryChange}
            options={Object.keys(categoryBrandMap).map((cat) => ({
              value: cat,
              label: cat,
            }))}
            allowClear
          />
        </Form.Item>

        <Form.Item name="brand" label="Brand" rules={[{ required: true }]}>
          <Select
            showSearch
            placeholder="Select brand"
            disabled={!selectedCategory}
            onChange={handleBrandChange}
            options={brandOptions.map((b) => ({ value: b, label: b }))}
            allowClear
          />
        </Form.Item>

        <Form.Item name="product" label="Product" rules={[{ required: true }]}>
          <Select
            showSearch
            placeholder="Choose product"
            disabled={!selectedBrand}
            onChange={handleProductChange}
            options={productOptions.map((p) => ({ value: p, label: p }))}
            allowClear
          />
        </Form.Item>

        <Form.Item name="unitPrice" label="Price (RWF)" rules={[{ required: true }]}>
          <Input type="number" placeholder="e.g. 15000" min={0} />
        </Form.Item>

        <Form.Item
          name="quantity"
          label="Quantity"
          rules={[{ required: true, min: 1 }]}
          initialValue={1}
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