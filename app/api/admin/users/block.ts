import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { userId, block } = await req.json();
    if (!userId || typeof block !== "boolean") {
      return NextResponse.json({ error: "Missing userId or block flag" }, { status: 400 });
    }
    // Falls das Feld isBlocked nicht existiert, bitte im Prisma-Schema ergänzen!
    const user = await db.user.update({
      where: { id: userId },
      data: { isBlocked: block },
    });
    return NextResponse.json({ success: true, user });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
