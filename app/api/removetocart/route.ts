import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { date, cartId, clientId } = await req.json();

    if (!date || !cartId || !clientId) {
      return NextResponse.json({ success: false, message: "Missing parameters." }, { status: 400 });
    }

    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client || !client.cart) {
      return NextResponse.json({ success: false, message: "Client or cart not found." }, { status: 404 });
    }

    const cart = client.cart as Record<string, any[]>;

    const updatedDateCart = (cart[date] || []).filter(item => item.id !== cartId);

    if (updatedDateCart.length === 0) {
      delete cart[date];
    } else {
      cart[date] = updatedDateCart;
    }

    await prisma.client.update({
      where: { id: clientId },
      data: { cart },
    });

    return NextResponse.json({ success: true, message: "Cart item removed." });
  } catch (error) {
    console.error("Remove cart item error:", error);
    return NextResponse.json({ success: false, message: "Server error." }, { status: 500 });
  }
}
