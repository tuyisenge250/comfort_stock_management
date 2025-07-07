import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { productId, date, entryId } = await req.json();

    if (!productId || !date || !entryId) {
      return NextResponse.json(
        { success: false, message: "productId, date, and entryId are required." },
        { status: 400 }
      );
    }

    const stockTracker = await prisma.stockTracker.findUnique({
      where: { productId },
    });

    if (!stockTracker || !stockTracker.soldTracker) {
      return NextResponse.json(
        { success: false, message: "StockTracker or soldTracker not found." },
        { status: 404 }
      );
    }

    const currentDayLogs = stockTracker.soldTracker[date];
    if (!currentDayLogs) {
      return NextResponse.json(
        { success: false, message: `No sales found for date: ${date}` },
        { status: 404 }
      );
    }

    const updatedLogs = currentDayLogs.map((entry: any) =>
      entry.id === entryId ? { ...entry, status: "RequestCancel", updatedAt: new Date().toISOString() } : entry
    );

    const updatedSoldTracker = {
      ...stockTracker.soldTracker,
      [date]: updatedLogs,
    };

    const updatedStock = await prisma.stockTracker.update({
      where: { productId },
      data: {
        soldTracker: updatedSoldTracker,
      },
    });

    return NextResponse.json(
      { success: true, message: "Sale status updated to RequestCancel", stockTracker: updatedStock },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
