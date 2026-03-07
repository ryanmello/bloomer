import { NextResponse } from "next/server";
import db from "@/lib/prisma";

export async function POST(req: Request, context: { params: { id: string } }) {
  const { id } = context.params;
  const answers = await req.json(); 
  try {
    const submission = await db.submission.create({
      data: {
        formId: id,
        answers,
      },
    });

    await db.form.update({
      where: { id },
      data: { submissions: { increment: 1 } },
    });

    return NextResponse.json(submission, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to submit form" }, { status: 500 });
  }
}