// app/api/creditpayment/route.ts

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type PaymentStatus = "PENDING" | "PARTIALLY_PAID" | "PAID";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { creditId, amountPaid } = body;

    if (!creditId || typeof amountPaid !== "number" || amountPaid <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid input: 'creditId' must be provided and 'amountPaid' must be a positive number.",
        },
        { status: 400 }
      );
    }

    const credit = await prisma.creditTracker.findUnique({
      where: { id: creditId },
    });

    if (!credit) {
      return NextResponse.json(
        { success: false, message: "Credit not found." },
        { status: 404 }
      );
    }

    if (credit.paymentStatus === "PAID") {
      return NextResponse.json(
        { success: false, message: "Loan is already fully paid." },
        { status: 400 }
      );
    }

    if (amountPaid > credit.remainingAmount) {
      return NextResponse.json(
        { success: false, message: "Amount exceeds remaining loan." },
        { status: 400 }
      );
    }

    const totalAmount = credit.qty * credit.pricePerUnit;
    const newAmountPaid = credit.amountPaid + amountPaid;
    const newRemainingAmount = totalAmount - newAmountPaid;

    let newPaymentStatus: PaymentStatus =
      newRemainingAmount <= 0 ? "PAID" : "PARTIALLY_PAID";

    const updatedCredit = await prisma.creditTracker.update({
      where: { id: creditId },
      data: {
        amountPaid: newAmountPaid,
        remainingAmount: newRemainingAmount,
        paymentStatus: newPaymentStatus,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Payment updated successfully.",
      data: updatedCredit,
    });
  } catch (error) {
    console.error("[CREDIT_PAYMENT_ERROR]", error);
    return NextResponse.json(
      { success: false, message: "Server error." },
      { status: 500 }
    );
  }
}
