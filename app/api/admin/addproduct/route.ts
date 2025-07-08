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
      productName,
    } = body;

    if (!unitPrice || !quantity || !categoryName || !brandName || !productName) {
      return NextResponse.json(
        { success: false, message: 'All fields are required.' },
        { status: 400 }
      );
    }

    const [category, brand] = await Promise.all([
      prisma.category.upsert({
        where: { name: categoryName },
        update: {},
        create: { name: categoryName },
      }),
      prisma.brand.upsert({
        where: { name: brandName },
        update: {},
        create: { name: brandName },
      }),
    ]);

    const existingProduct = await prisma.product.findFirst({
      where: {
        categoryId: category.id,
        brandId: brand.id,
        productName: productName,
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

      const currentTracker = stock?.addingTracker || {};
      const todayLogs = currentTracker[today] || [];

      const updatedTracker = {
        ...currentTracker,
        [today]: [...todayLogs, newLog],
      };

      if (stock) {
        await prisma.stockTracker.update({
          where: { productId: updatedProduct.id },
          data: { addingTracker: updatedTracker },
        });
      } else {
        await prisma.stockTracker.create({
          data: {
            productId: updatedProduct.id,
            addingTracker: { [today]: [newLog] },
            soldTracker: {},
          },
        });
      }

      return NextResponse.json(
        { success: true, message: 'Product updated with stock log.', product: updatedProduct },
        { status: 200 }
      );
    } else {
      const newProduct = await prisma.product.create({
        data: {
          productName,
          unitPrice,
          quantity,
          categoryId: category.id,
          brandId: brand.id,
        },
      });

      await prisma.stockTracker.create({
        data: {
          productId: newProduct.id,
          addingTracker: { [today]: [newLog] },
          soldTracker: {},
        },
      });

      return NextResponse.json(
        { success: true, message: 'Product created with initial stock log.', product: newProduct },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("Product API Error:", error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while processing product.' },
      { status: 500 }
    );
  }
}
