import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import dayjs from "dayjs";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const {
      productId,
      soldQty,
      priceAtSale,
      paymentMethod = "cash",
      status = "complete",
      clientId = null,
    } = await req.json();

    if (!productId || typeof soldQty !== "number" || typeof priceAtSale !== "number") {
      return NextResponse.json(
        { success: false, message: "productId, soldQty, and priceAtSale must be provided and numeric." },
        { status: 400 }
      );
    }

    if (soldQty <= 0) {
      return NextResponse.json(
        { success: false, message: "Sold quantity must be greater than 0." },
        { status: 400 }
      );
    }

    const allowedPayments = ["cash", "MOMO", "credit"];
    if (!allowedPayments.includes(paymentMethod)) {
      return NextResponse.json(
        { success: false, message: `Invalid paymentMethod. Use one of: ${allowedPayments.join(", ")}` },
        { status: 400 }
      );
    }

    const allowedStatuses = ["complete", "RequestCancel", "cancel"];
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: `Invalid status. Use one of: ${allowedStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ success: false, message: "Product not found." }, { status: 404 });
    }

    if (product.quantity < soldQty) {
      return NextResponse.json(
        { success: false, message: `Not enough stock. Only ${product.quantity} available.` },
        { status: 400 }
      );
    }

    const stockTracker = await prisma.stockTracker.findUnique({ where: { productId } });
    if (!stockTracker) {
      return NextResponse.json({ success: false, message: "StockTracker not found." }, { status: 404 });
    }

    const today = dayjs().format("YYYY-MM-DD");
    const oldSoldTracker = stockTracker.soldTracker || {};
    const todayLogs = oldSoldTracker[today] || [];

    const soldEntry = {
      id: randomUUID(),
      initialQty: product.quantity,
      soldQty,
      remainingQty: product.quantity - soldQty,
      priceAtSale,
      paymentMethod,
      status,
      clientId,
      updatedAt: new Date().toISOString(),
    };

    const updatedSoldTracker = {
      ...oldSoldTracker,
      [today]: [...todayLogs, soldEntry],
    };

    const [updatedStock, updatedProduct] = await Promise.all([
      prisma.stockTracker.update({
        where: { productId },
        data: { soldTracker: updatedSoldTracker },
      }),
      prisma.product.update({
        where: { id: productId },
        data: {
          quantity: { decrement: soldQty },
        },
      }),
    ]);

    if (clientId) {
      await prisma.client.update({
        where: { id: clientId },
        data: {
          cart: {}, // Clear the cart
        },
      }).catch((error) => {
        console.error("Failed to update client cart:", error);
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Sale recorded successfully.",
        product: updatedProduct,
        stockTracker: updatedStock,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}
