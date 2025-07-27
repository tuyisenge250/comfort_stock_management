import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const productsWithSold = await prisma.product.findMany({
      include: {
        stockTracker: {
          select: {
            soldTracker: true,
            addingTracker: true,
          },
        },
        category: {
          select: {
            name: true,
          },
        },
        brand: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        products: productsWithSold,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to fetch products with soldTracker:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
