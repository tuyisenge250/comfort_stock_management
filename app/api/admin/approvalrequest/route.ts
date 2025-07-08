import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { productId, entryId, action } = await req.json();

    if (!productId || !entryId || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { success: false, message: "productId, entryId, and valid action are required." },
        { status: 400 }
      );
    }

    const stockTracker = await prisma.stockTracker.findUnique({ where: { productId } });
    const product = await prisma.product.findUnique({ where: { id: productId } });

    if (!stockTracker || !product) {
      return NextResponse.json({ success: false, message: "Product or stockTracker not found." }, { status: 404 });
    }

    const soldTracker = stockTracker.soldTracker || {};
    let updated = false;

    for (const date in soldTracker) {
      const entries = soldTracker[date];

      for (let i = 0; i < entries.length; i++) {
        if (entries[i].id === entryId) {
          // Update status
          entries[i].status = action === "approve" ? "complete" : "cancel";
          entries[i].updatedAt = new Date().toISOString();

          // If rejected, return stock
          if (action === "reject") {
            await prisma.product.update({
              where: { id: productId },
              data: {
                quantity: {
                  increment: entries[i].soldQty,
                },
              },
            });
          }

          updated = true;
          break;
        }
      }

      if (updated) break;
    }

    if (!updated) {
      return NextResponse.json({ success: false, message: "Entry ID not found." }, { status: 404 });
    }

    await prisma.stockTracker.update({
      where: { productId },
      data: { soldTracker },
    });

    return NextResponse.json(
      {
        success: true,
        message: `Request ${action === "approve" ? "approved" : "rejected"} successfully.`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error approving/rejecting request:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}
