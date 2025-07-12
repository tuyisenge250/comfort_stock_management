import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import dayjs from "dayjs";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const sales: any[] = await req.json();
    console.log("Received sales data:", sales);
    if (!Array.isArray(sales) || sales.length === 0) {
      return NextResponse.json(
        { success: false, message: "Expected an array of sales items." },
        { status: 400 }
      );
    }

    const results = [];
    const errors = [];

    for (const sale of sales) {
      const {
        productId,
        soldQty,
        priceAtSale,
        clientId = null,
        paymentBreakdown,
        status = "complete",
      } = sale;

      if (!productId || typeof soldQty !== "number" || typeof priceAtSale !== "number" || soldQty <= 0) {
        console.log("Invalid sale data:", sale);
        errors.push({ productId, error: "Missing or invalid fields" });
        continue;
      }

      const allowedPayments = ["cash", "MOMO", "credit"];
      const paymentKeys = Object.keys(paymentBreakdown || {});
      if (!paymentBreakdown || paymentKeys.length === 0 || !paymentKeys.every((k) => allowedPayments.includes(k))) {
        console.log("Invalid payment breakdown:", paymentBreakdown);
        errors.push({ productId, error: "Invalid or missing payment breakdown" });
        continue;
      }
      console.log("Payment Breakdown:", paymentBreakdown);
      const totalAmount = priceAtSale * soldQty;
      const amountPaid = Object.entries(paymentBreakdown)
        .filter(([method]) => method !== "credit")
        .reduce((sum, [, val]) => sum + (Number(val) || 0), 0);
      const creditAmount = totalAmount - amountPaid;
      console.log("Total Amount:", creditAmount);
      if (creditAmount < 0) {
        errors.push({ productId, error: "Paid amount exceeds total" });
        continue;
      }

      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product) {
        console.log("Product not found:", productId);
        errors.push({ productId, error: "Product not found" });
        continue;
      }
      if (product.quantity < soldQty) {
        errors.push({ productId, error: `Insufficient stock. Only ${product.quantity} available.` });
        continue;
      }
      console.log("Product found:", product);

      const stockTracker = await prisma.stockTracker.findUnique({ where: { productId } });
      if (!stockTracker) {
        errors.push({ productId, error: "Stock tracker not found" });
        continue;
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
        paymentBreakdown,
        status,
        clientId,
        updatedAt: new Date().toISOString(),
      };
      console.log("Sold Entry:", soldEntry);

      const updatedSoldTracker = {
        ...oldSoldTracker,
        [today]: [...todayLogs, soldEntry],
      };
      console.log("Updated Sold Tracker:", updatedSoldTracker);
      // Update database
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

      results.push({
        product: updatedProduct,
        stockTracker: updatedStock,
        creditTracker: creditRecord,
        message: "Sale recorded",
      });
    }

    const clientIdsToClear = [...new Set(sales.map(s => s.clientId).filter(Boolean))];
    await Promise.all(clientIdsToClear.map(id =>
      prisma.client.update({ where: { id }, data: { cart: {} } })
        .catch((err) => console.error(`Failed to clear cart for client ${id}:`, err))
    ));

    return NextResponse.json({
      success: true,
      results,
      errors,
    });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}