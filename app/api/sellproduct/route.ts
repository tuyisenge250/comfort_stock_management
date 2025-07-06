import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import dayjs from "dayjs";

export async function POST(req: NextRequest) {
  try {
    const {
      productId,
      soldQty,
      priceAtSale,
      paymentMethod,
      status,
      clientId,
    } = await req.json();

    if (!productId || !soldQty || !priceAtSale) {
      return NextResponse.json(
        { success: false, message: "productId, soldQty, and priceAtSale are required." },
        { status: 400 }
      );
    }

    // ✅ Validate payment method
    const allowedPayments = ["cash", "MOMO", "credit"];
    if (paymentMethod && !allowedPayments.includes(paymentMethod)) {
      return NextResponse.json(
        { success: false, message: `Invalid paymentMethod. Must be one of: ${allowedPayments.join(", ")}` },
        { status: 400 }
      );
    }

    // ✅ Validate status
    const allowedStatuses = ["complete", "RequestCancel", "cancel"];
    if (status && !allowedStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: `Invalid status. Must be one of: ${allowedStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    // 🟢 Check product
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ success: false, message: "Product not found." }, { status: 404 });
    }

    // 🟢 Get or check stock tracker
    const stockTracker = await prisma.stockTracker.findUnique({ where: { productId } });
    if (!stockTracker) {
      return NextResponse.json({ success: false, message: "StockTracker not found." }, { status: 404 });
    }

    // 🕒 Today's date
    const today = dayjs().format("YYYY-MM-DD");
    const oldSoldTracker = stockTracker.soldTracker || {};
    const todayLogs = oldSoldTracker[today] || [];


    const soldEntry = {
      qty: product.quantity,
      soldQty,
      remainingQty: product.quantity - soldQty,
      priceAtSale,
      paymentMethod: paymentMethod || "cash",
      status: status || "complete",
      cliedId: clientId || null,
      updatedAt: new Date().toISOString(),
    };

    // 📦 Update soldTracker JSON
    const updatedSoldTracker = {
      ...oldSoldTracker,
      [today]: [...todayLogs, soldEntry],
    };

    // 🔄 Update DB
    const [updatedStock, updatedProduct] = await Promise.all([
      prisma.stockTracker.update({
        where: { productId },
        data: { soldTracker: updatedSoldTracker },
      }),
      prisma.product.update({
        where: { id: productId },
        data: {
          quantity: {
            decrement: soldQty,
          },
        },
      }),
    ]);

    return NextResponse.json(
      {
        success: true,
        message: "SoldTracker updated successfully.",
        stock: updatedStock,
        product: updatedProduct,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("SoldTracker error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}
