import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "bottari",
    domain: "bottari.moru.my",
    timestamp: new Date().toISOString(),
  });
}
