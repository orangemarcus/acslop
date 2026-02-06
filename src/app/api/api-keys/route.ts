import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// Generate a secure API key: acslop_<32 random hex chars>
function generateApiKey(): string {
  return `acslop_${crypto.randomBytes(24).toString('hex')}`;
}

// Hash key for storage (we only store hashed keys)
function hashKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

// GET /api/api-keys — list user's API keys
export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const keys = await prisma.apiKey.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      prefix: true,
      lastUsed: true,
      requests: true,
      active: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ keys });
}

// POST /api/api-keys — create a new API key
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Limit to 5 keys per user
  const existingCount = await prisma.apiKey.count({ where: { userId } });
  if (existingCount >= 5) {
    return NextResponse.json({ error: 'Maximum 5 API keys allowed' }, { status: 400 });
  }

  const body = await request.json();
  const name = (typeof body.name === 'string' ? body.name.trim() : '').slice(0, 50) || 'Untitled';

  const rawKey = generateApiKey();
  const hashedKey = hashKey(rawKey);
  const prefix = rawKey.slice(0, 14) + '...';

  await prisma.apiKey.create({
    data: {
      userId,
      name,
      key: hashedKey,
      prefix,
    },
  });

  // Return the raw key ONCE — user must save it, we only store the hash
  return NextResponse.json({ key: rawKey, prefix, name });
}

// DELETE /api/api-keys — revoke an API key
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Key ID required' }, { status: 400 });
  }

  // Ensure the key belongs to this user
  const key = await prisma.apiKey.findFirst({ where: { id, userId } });
  if (!key) {
    return NextResponse.json({ error: 'Key not found' }, { status: 404 });
  }

  await prisma.apiKey.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
