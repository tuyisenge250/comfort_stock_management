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
      clientId = null,
      paymentBreakdown,
      status = "complete",
    } = await req.json();

    if (!productId || typeof soldQty !== "number" || typeof priceAtSale !== "number") {
      return NextResponse.json(
        { success: false, message: "productId, soldQty, and priceAtSale must be provided and numeric." },
        { status: 400 }
      );
    }

    if (soldQty <= 0) {
      return NextResponse.json(
        { success: false, message: "paymentBreakdown must be provided as an object." },
        { status: 400 }
      );
    }

    const allowedPayments = ["cash", "MOMO", "credit"];
    const paymentKeys = Object.keys(paymentBreakdown);

    for (const method of paymentKeys) {
      if (!allowedPayments.includes(method)) {
        return NextResponse.json(
          { success: false, message: `Invalid payment method "${method}". Use only: ${allowedPayments.join(", ")}` },
          { status: 400 }
        );
      }
    }

    const totalAmount = priceAtSale * soldQty;
    const amountPaid = Object.entries(paymentBreakdown)
      .filter(([method]) => method !== "credit")
      .reduce((sum, [, value]) => sum + (Number(value) || 0), 0);

    const creditAmount = totalAmount - amountPaid;

    if (creditAmount < 0) {
      return NextResponse.json(
        { success: false, message: "Paid amount exceeds total." },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return NextResponse.json({ success: false, message: "Product not found." }, { status: 404 });
    if (product.quantity < soldQty)
      return NextResponse.json({ success: false, message: `Not enough stock. Only ${product.quantity} available.` }, { status: 400 });

    const stockTracker = await prisma.stockTracker.findUnique({ where: { productId } });
    if (!stockTracker)
      return NextResponse.json({ success: false, message: "StockTracker not found." }, { status: 404 });

    const today = dayjs().format("YYYY-MM-DD");
    const oldSoldTracker = stockTracker.soldTracker || {};
    const todayLogs = oldSoldTracker[today] || [];

    const soldEntry = {
      id: randomUUID(),
      initialQty: product.quantity,
      soldQty,
      remainingQty: product.quantity - soldQty,
      priceAtSale,
      paymentBreakdown,
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
        data: { quantity: { decrement: soldQty } },
      }),
    ]);

    let creditRecord = null;

    if (creditAmount > 0 && clientId) {
      creditRecord = await prisma.creditTracker.create({
        data: {
          productId,
          clientId,
          qty: soldQty,
          pricePerUnit: priceAtSale,
          amountPaid,
          remainingAmount: creditAmount,
          creditDate: new Date(),
          status: "LOANED",
          paymentStatus: amountPaid === 0 ? "PENDING" : "PARTIALLY_PAID",
        },
      });
    }

    if (clientId) {
      await prisma.client.update({
        where: { id: clientId },
        data: { cart: {} },
      }).catch((err) => console.error("Failed to clear cart:", err));
    }

    return NextResponse.json(
      {
        success: true,
        message: "Sale recorded successfully.",
        product: updatedProduct,
        stockTracker: updatedStock,
        creditTracker: creditRecord,
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
