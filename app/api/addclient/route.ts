import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, telephone, cart } = body;

    if (!name || !telephone) {
      return NextResponse.json(
        { success: false, message: "Name and telephone are required." },
        { status: 400 }
      );
    }

    const newClient = await prisma.client.create({
      data: {
        name,
        telephone,
        cart: cart || null,
      },
    });

    return NextResponse.json(
      { success: true, message: "Client created successfully", client: newClient },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating client:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
