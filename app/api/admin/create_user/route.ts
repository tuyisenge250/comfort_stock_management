import { NextRequest } from "next/server";
import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";

enum Role{
    ADMIN = "ADMIN",
    NORMAL = "NORMAL",
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, password, userName, role, id } = body;

    const existingUser = await prisma.user.findUnique({
      where: { userName },
    });

    if (existingUser) {
      return new Response(JSON.stringify({ error: "User already exists. Please log in." }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }

    // const adminUser = await prisma.user.findUnique({ where: { id } });

    // if (!adminUser || adminUser.role !== "ADMIN") {
    //   return new Response(JSON.stringify({ error: "Unauthorized. Only admins can create users." }), {
    //     status: 403,
    //     headers: { "Content-Type": "application/json" },
    //   });
    // }

    if (!password || password.length < 5) {
      return new Response(JSON.stringify({ error: "Password must be at least 5 characters." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        userName,
        password: hashedPassword,
        role: role || "NORMAL", 
      },
    });

    return new Response(JSON.stringify({ message: "User created", userId: newUser.id }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error creating user:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

