import {NextResponse} from "next/server";
import db from "../../../lib/prisma";

export async function GET() {
  const forms = await db.form.findMany(); 
  return NextResponse.json(forms);
}

export async function POST(req: Request) {
  const body = await req.json();
  const form = await db.form.create({
    data: {
      title: body.title,
      description: body.description,
      status: body.status,
      access: body.access,
      questions: body.questions,
      views: 0,
      submissions: 0,
      conversions: 0,
    },
  });
  return NextResponse.json(form, { status: 201 });
}