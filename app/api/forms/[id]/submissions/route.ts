import { NextResponse } from "next/server";
import db from "@/lib/prisma";


export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {

  const { id } = await context.params;

  try {
    const submissions = await db.submission.findMany({
      where: { formId: id },
      orderBy: { createdAt: "desc" },
      include: { answers: true },
    });

    return NextResponse.json(submissions);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {

  const auth = req.headers.get("Authorization");
    if (auth !== `Bearer ${process.env.PUBLIC_FORM_KEY}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const { id: formId } = await context.params; 
  const answers = await req.json();

  try {
    const submission = await db.submission.create({
      data: {
        formId,
        answers: {
          create: answers,
        },
      },
      include: { answers: true },
    });

    await db.form.update({
      where: { id: formId },
      data: { submissions: { increment: 1 } },
    });

    return NextResponse.json(submission, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to submit form" }, { status: 500 });
  }
}