import { currentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json(null, { status: 404 });
  return NextResponse.json(user);
}
