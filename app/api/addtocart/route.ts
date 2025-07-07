import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import dayjs from "dayjs";

export async function POST(req: NextRequest) {
  try {
    const { clientId, productId, qty } = await req.json();

    if (!clientId || !productId || typeof qty !== "number" || qty <= 0) {
      return NextResponse.json(
        { success: false, message: "clientId, productId, and a positive qty are required." },
        { status: 400 }
      );
    }

    const client = await prisma.client.findUnique({ where: { id: clientId } });

    if (!client) {
      return NextResponse.json({ success: false, message: "Client not found." }, { status: 404 });
    }

    const today = dayjs().format("YYYY-MM-DD");
    const oldCart = client.cart || {};
    const todayCart = oldCart[today] || [];

    const newTodayCart = [...todayCart, { productId, qty }];
    const updatedCart = {
      [today]: newTodayCart,
    };

    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: { cart: updatedCart },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Cart updated for today only.",
        client: updatedClient,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Cart Error:", error);
    return NextResponse.json({ success: false, error: "Internal server error." }, { status: 500 });
  }
}
