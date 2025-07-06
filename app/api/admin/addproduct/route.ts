import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      unitPrice,
      quantity,
      categoryName,
      brandName,
      productTypeName,
      qualityLevel,
      sizeName,
    } = body;

    // Get or create references
    const category = await prisma.category.upsert({
      where: { name: categoryName },
      update: {},
      create: { name: categoryName },
    });

    const brand = await prisma.brand.upsert({
      where: { name: brandName },
      update: {},
      create: { name: brandName },
    });

    const productType = await prisma.productType.upsert({
      where: { name: productTypeName },
      update: {},
      create: { name: productTypeName },
    });

    const quality = await prisma.quality.upsert({
      where: { level: qualityLevel },
      update: {},
      create: { level: qualityLevel },
    });

    const size = await prisma.size.upsert({
      where: { name: sizeName },
      update: {},
      create: { name: sizeName },
    });

    // Check if a product with the same unique combination exists
    const existingProduct = await prisma.product.findFirst({
      where: {
        categoryId: category.id,
        brandId: brand.id,
        productTypeId: productType.id,
        qualityId: quality.id,
        sizeId: size.id,
      },
    });

    if (existingProduct) {
      // Update the quantity and price if needed
      const updatedProduct = await prisma.product.update({
        where: { id: existingProduct.id },
        data: {
          quantity: existingProduct.quantity + quantity,
          unitPrice: unitPrice !== existingProduct.unitPrice ? unitPrice : existingProduct.unitPrice,
        },
      });

      return NextResponse.json(
        { success: true, message: 'Product updated', product: updatedProduct },
        { status: 200 }
      );
    } else {
      // Create new product if not found
      const newProduct = await prisma.product.create({
        data: {
          unitPrice,
          quantity,
          categoryId: category.id,
          brandId: brand.id,
          productTypeId: productType.id,
          qualityId: quality.id,
          sizeId: size.id,
        },
      });

      return NextResponse.json(
        { success: true, message: 'Product created', product: newProduct },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Failed to process product' }, { status: 500 });
  }
}
