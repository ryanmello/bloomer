import { NextResponse } from "next/server"
import db from "@/lib/prisma"

export async function POST (req: Request, context: { params: Promise<{ id: string }> }) {

  const auth = req.headers.get("Authorization");
  if (auth !== `Bearer ${process.env.FORM_KEY}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 })
  }

  await db.form.update({
    where: { id },
    data: {
      views: {
        increment: 1,
      },
    },
  })

  return NextResponse.json({ success: true })
}