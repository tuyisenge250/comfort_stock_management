import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const stockTrackers = await prisma.stockTracker.findMany({
      include: {
        product: {
          select: {
            id: true,
            productName: true,
            category: { select: { name: true } },
            brand: { select: { name: true } },
          },
        },
      },
    });

    const cancelRequests = [];

    for (const tracker of stockTrackers) {
      const soldTracker = tracker.soldTracker || {};

      for (const date in soldTracker) {
        const entries = soldTracker[date];

        for (const entry of entries) {
          if (entry.status === "RequestCancel") {
            cancelRequests.push({
              date,
              productId: tracker.product.id,
              productName: tracker.product.productName,
              category: tracker.product.category.name,
              brand: tracker.product.brand.name,
              ...entry,
            });
          }
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        cancelRequests,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching RequestCancel entries:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
