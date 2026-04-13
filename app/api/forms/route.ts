import {NextResponse} from "next/server";
import db from "../../../lib/prisma";

export async function GET() {
  const forms = await db.form.findMany({
    include: {
      _count: {
        select: { submissionsList: true },
      },
    },
  });

  const mappedForms = forms.map(f => ({
  ...f,
  submissions: f._count.submissionsList,
  conversions: f._count.submissionsList,
 }));

  return NextResponse.json(mappedForms);
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
      audiences:
        body.access === "verified" && body.audienceIds?.length
          ? {
              connect: body.audienceIds.map((id: string) => ({ id })),
            }
          : undefined,
    },
  });
  return NextResponse.json(form, { status: 201 });
}