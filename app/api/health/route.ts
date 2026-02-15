import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  return NextResponse.json({ status: "ok", message: "API is working" });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return NextResponse.json({ status: "ok", message: "POST is working" });
}
