import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    let timerState = await prisma.timerState.findUnique({
      where: { id: 'global' },
    });

    if (!timerState) {
      timerState = await prisma.timerState.create({
        data: {
          id: 'global',
          mode: 'work',
          isRunning: false,
          timeLeft: 25 * 60,
        },
      });
    }

    return NextResponse.json(timerState);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch timer state' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const timerState = await prisma.timerState.upsert({
      where: { id: 'global' },
      update: {
        mode: data.mode,
        isRunning: data.isRunning,
        timeLeft: data.timeLeft,
      },
      create: {
        id: 'global',
        mode: data.mode || 'work',
        isRunning: data.isRunning || false,
        timeLeft: data.timeLeft || 25 * 60,
      },
    });

    return NextResponse.json(timerState);
  } catch {
    return NextResponse.json({ error: 'Failed to update timer state' }, { status: 500 });
  }
}
