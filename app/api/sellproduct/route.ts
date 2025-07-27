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
    const allowedPayments = ["cash", "MOMO", "credit"];

    const paymentPool: Record<string, number> = { cash: 0, MOMO: 0 };
    for (const s of sales) {
      const breakdown = s.paymentBreakdown || {};
      for (const method of Object.keys(breakdown)) {
        if (allowedPayments.includes(method) && method !== "credit") {
          paymentPool[method] = (paymentPool[method] || 0) + Number(breakdown[method] || 0);
        }
      }
    }
    function payFromPool(amount: number, pool: Record<string, number>) {
      const payment: Record<string, number> = {};
      let remaining = amount;

      for (const method of ["cash", "MOMO"]) {
        const available = pool[method] || 0;
        if (available > 0) {
          const used = Math.min(available, remaining);
          payment[method] = used;
          pool[method] -= used;
          remaining -= used;
        }
      }

      return {
        amountPaid: amount - remaining,
        remainingCredit: remaining,
        paymentBreakdown: payment,
      };
    }

    for (const sale of sales) {
      const {
        productId,
        soldQty,
        priceAtSale,
        clientId = null,
        paymentBreakdown,
        status = "complete",
      } = sale;

      if (
        !productId ||
        typeof soldQty !== "number" ||
        typeof priceAtSale !== "number" ||
        soldQty <= 0
      ) {
        errors.push({ productId, error: "Missing or invalid fields" });
        continue;
      }

      const paymentKeys = Object.keys(paymentBreakdown || {});
      if (
        !paymentBreakdown ||
        paymentKeys.length === 0 ||
        !paymentKeys.every((k) => allowedPayments.includes(k))
      ) {
        console.log("Invalid payment breakdown:", paymentBreakdown);
        errors.push({ productId, error: "Invalid or missing payment breakdown" });
        continue;
      }

      const totalAmount = priceAtSale * soldQty;

      const {
        amountPaid,
        remainingCredit: creditAmount,
        paymentBreakdown: salePaymentBreakdown,
      } = payFromPool(totalAmount, paymentPool);

      let paymentStatus: "PAID" | "PARTIALLY_PAID" | "PENDING" = "PAID";
      if (creditAmount > 0 && amountPaid > 0) paymentStatus = "PARTIALLY_PAID";
      else if (creditAmount > 0 && amountPaid === 0) paymentStatus = "PENDING";

      if (creditAmount < 0) {
        errors.push({ productId, error: "Paid amount exceeds total" });
        continue;
      }

      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product) {
        errors.push({ productId, error: "Product not found" });
        continue;
      }

      if (product.quantity < soldQty) {
        errors.push({
          productId,
          error: `Insufficient stock. Only ${product.quantity} available.`,
        });
        continue;
      }

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
        paymentBreakdown: salePaymentBreakdown,
        status,
        clientId,
        updatedAt: new Date().toISOString(),
        amountPaid,
        creditAmount,
        paymentStatus,
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
            paymentStatus,
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

    // Step 4: Clear client carts
    const clientIdsToClear = [...new Set(sales.map((s) => s.clientId).filter(Boolean))];
    await Promise.all(
      clientIdsToClear.map((id) =>
        prisma.client.update({ where: { id }, data: { cart: {} } }).catch((err) => {
          console.error(`Failed to clear cart for client ${id}:`, err);
        })
      )
    );

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
