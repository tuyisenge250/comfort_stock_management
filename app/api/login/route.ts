import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";
import { generateToken } from "@/util";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userName, password } = body;
    console.log("Login attempt for user:", userName);

    const existingUser = await prisma.user.findUnique({
      where: { userName },
    });

    if (!existingUser) {
      return new Response(
        JSON.stringify({ error: "User not found. Please check your username or sign up." }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Verify password
    const isCorrectPassword = await bcrypt.compare(password, existingUser.password);
    if (!isCorrectPassword) {
      return new Response(JSON.stringify({ error: "Invalid password." }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Generate JWT token
    const token = await generateToken(existingUser, "1h");

    const response = NextResponse.json(
      { success: true, user: { id: existingUser.id, name: existingUser.name, role: existingUser.role } },
      { status: 200 }
    );

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60, // 1 hour
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return new Response(JSON.stringify({ error: "Internal server error." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
