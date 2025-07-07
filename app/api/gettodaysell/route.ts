import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import dayjs from "dayjs";

export async function GET() {
  try {
    const today = dayjs().format("YYYY-MM-DD");

    const stockTrackers = await prisma.stockTracker.findMany({
      select: {
        productId: true,
        soldTracker: true,
      },
    });

    const todaySales = stockTrackers
      .filter((tracker) => tracker.soldTracker?.[today])
      .map((tracker) => ({
        productId: tracker.productId,
        sold: tracker.soldTracker[today],
      }));

    return NextResponse.json(
      { success: true, data: todaySales },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
