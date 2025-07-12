import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { clientId } = await req.json();

    if (!clientId) {
      return NextResponse.json({ success: false, message: "Missing clientId." }, { status: 400 });
    }

    const client = await prisma.client.findUnique({ where: { id: clientId } });

    if (!client) {
      return NextResponse.json({ success: false, message: "Client not found." }, { status: 404 });
    }

    await prisma.client.update({
      where: { id: clientId },
      data: { cart: {} },
    });

    return NextResponse.json({ success: true, message: "Cart cleared successfully." });
  } catch (error) {
    console.error("Clear cart error:", error);
    return NextResponse.json({ success: false, message: "Server error." }, { status: 500 });
  }
}
