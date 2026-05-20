import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  return NextResponse.json(
    { error: "Not implemented", route: `GET /api/trades/${id}` },
    { status: 501 }
  );
}

export async function PATCH(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  return NextResponse.json(
    { error: "Not implemented", route: `PATCH /api/trades/${id}` },
    { status: 501 }
  );
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  return NextResponse.json(
    { error: "Not implemented", route: `DELETE /api/trades/${id}` },
    { status: 501 }
  );
}
