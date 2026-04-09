import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const records = await prisma.dailyRecord.findMany({
      orderBy: { date: 'asc' }
    });
    return NextResponse.json(records);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { mode, seconds } = await request.json();

    // YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];

    const updateData: { workTime?: { increment: number }, shortBreakTime?: { increment: number }, longBreakTime?: { increment: number } } = {};
    if (mode === 'work') {
      updateData.workTime = { increment: seconds };
    } else if (mode === 'shortBreak') {
      updateData.shortBreakTime = { increment: seconds };
    } else if (mode === 'longBreak') {
      updateData.longBreakTime = { increment: seconds };
    }

    const record = await prisma.dailyRecord.upsert({
      where: { date: today },
      update: updateData,
      create: {
        date: today,
        workTime: mode === 'work' ? seconds : 0,
        shortBreakTime: mode === 'shortBreak' ? seconds : 0,
        longBreakTime: mode === 'longBreak' ? seconds : 0,
      },
    });

    return NextResponse.json(record);
  } catch {
    return NextResponse.json({ error: 'Failed to update daily record' }, { status: 500 });
  }
}
