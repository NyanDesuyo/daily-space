import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    let settings = await prisma.settings.findUnique({
      where: { id: 'global' },
    });

    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          id: 'global',
          work: 25,
          shortBreak: 5,
          longBreak: 15,
        },
      });
    }

    return NextResponse.json(settings);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();

    const settings = await prisma.settings.upsert({
      where: { id: 'global' },
      update: {
        work: data.work,
        shortBreak: data.shortBreak,
        longBreak: data.longBreak,
      },
      create: {
        id: 'global',
        work: data.work || 25,
        shortBreak: data.shortBreak || 5,
        longBreak: data.longBreak || 15,
      },
    });

    return NextResponse.json(settings);
  } catch {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
