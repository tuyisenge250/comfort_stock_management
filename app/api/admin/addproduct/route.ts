import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import dayjs from 'dayjs';

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

    const existingProduct = await prisma.product.findFirst({
      where: {
        categoryId: category.id,
        brandId: brand.id,
        productTypeId: productType.id,
        qualityId: quality.id,
        sizeId: size.id,
      },
    });

    const today = dayjs().format('YYYY-MM-DD');

    const newLog = {
      qty: quantity,
      remainingQty: existingProduct ? existingProduct.quantity : 0,
      currentQty: existingProduct ? existingProduct.quantity + quantity : quantity,
      price: unitPrice,
    };

    if (existingProduct) {
      // 3. Update product
      const updatedProduct = await prisma.product.update({
        where: { id: existingProduct.id },
        data: {
          quantity: existingProduct.quantity + quantity,
          unitPrice: unitPrice !== existingProduct.unitPrice ? unitPrice : existingProduct.unitPrice,
        },
      });

      const stock = await prisma.stockTracker.findUnique({
        where: { productId: updatedProduct.id },
      });

      if (stock) {
        // merge with existing JSON
        const currentLog = stock.addingTracker || {};
        const existingLogs = currentLog[today] || [];

        const updatedLog = {
          ...currentLog,
          [today]: [...existingLogs, newLog],
        };

        await prisma.stockTracker.update({
          where: { productId: updatedProduct.id },
          data: {
            addingTracker: updatedLog,
          },
        });
      } else {
        await prisma.stockTracker.create({
          data: {
            productId: updatedProduct.id,
            addingTracker: {
              [today]: [newLog],
            },
            soldTracker: {},
          },
        });
      }

      return NextResponse.json(
        { success: true, message: 'Product updated with stock', product: updatedProduct },
        { status: 200 }
      );
    } else {
      // 5. Create new product and stock tracker
      const newProduct = await prisma.product.create({
        data: {
          name: `${brandName} ${productTypeName} ${sizeName}`,
          unitPrice,
          quantity,
          categoryId: category.id,
          brandId: brand.id,
          productTypeId: productType.id,
          qualityId: quality.id,
          sizeId: size.id,
        },
      });

      await prisma.stockTracker.create({
        data: {
          productId: newProduct.id,
          addingTracker: {
            [today]: [newLog],
          },
          soldTracker: {},
        },
      });

      return NextResponse.json(
        { success: true, message: 'Product created with stock', product: newProduct },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Failed to process product' }, { status: 500 });
  }
}
