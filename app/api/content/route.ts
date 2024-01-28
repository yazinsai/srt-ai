import { NextRequest, NextResponse } from "next/server";

import { headers } from 'next/headers'
import { kv } from '@vercel/kv';

export async function POST(request: NextRequest) {
  const { id } = await request.json()
  const { content } = await kv.get(id) as any;
  return new NextResponse(content);
}