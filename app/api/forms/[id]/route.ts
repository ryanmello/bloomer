import { NextResponse } from "next/server";
import db from "../../../../lib/prisma";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const form = await db.form.findUnique({ where: { id } });

  if (!form) {
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }

  return NextResponse.json(form);
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  
  const { id } = await context.params;

  const body = await req.json();

  try {
    const updatedForm = await db.form.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        status: body.status,
        access: body.access,
        questions: body.questions,
      },
    });
    return NextResponse.json(updatedForm);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update form" }, { status: 400 });
  }
}


export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    await db.form.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error(err);
    return NextResponse.error();
  }
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const original = await db.form.findUnique({ where: { id } });
    if (!original) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    const duplicate = await db.form.create({
      data: {
        title: original.title + " (Copy)",
        description: original.description,
        status: original.status,
        access: original.access,
        questions: JSON.parse(JSON.stringify(original.questions)), 
        views: 0,
        submissions: 0,
        conversions: 0,
      },
    });

    return NextResponse.json(duplicate);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to duplicate form" }, { status: 500 });
  }
}