import { NextResponse } from 'next/server';
import prisma  from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      name,
      unitPrice,
      quantity,
      categoryName,
      brandName,
      productTypeName,
      qualityLevel,
      sizeName,
    } = body;

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

    const newProduct = await prisma.product.create({
      data: {
        name,
        unitPrice,
        quantity,
        categoryId: category.id,
        brandId: brand.id,
        productTypeId: productType.id,
        qualityId: quality.id,
        sizeId: size.id,
      },
    });

    return NextResponse.json({ success: true, product: newProduct }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Failed to create product' }, { status: 500 });
  }
}
