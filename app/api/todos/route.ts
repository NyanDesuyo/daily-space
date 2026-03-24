import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

const VALID_STATUSES = ["todo", "in-progress", "complete"] as const;
const MAX_TEXT_LENGTH = 1000;

export async function GET(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const { success, remaining } = rateLimit(ip);
  
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": "60", "X-RateLimit-Remaining": String(remaining) } }
    );
  }

  try {
    const todos = await prisma.todo.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json(todos, {
      headers: { "X-RateLimit-Remaining": String(remaining) },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch todos" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const { success, remaining } = rateLimit(ip);
  
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": "60", "X-RateLimit-Remaining": String(remaining) } }
    );
  }

  try {
    const body = await request.json();
    const { text, status } = body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      );
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { error: `Text must be ${MAX_TEXT_LENGTH} characters or less` },
        { status: 400 }
      );
    }

    const todo = await prisma.todo.create({
      data: {
        text: text.trim(),
        status: VALID_STATUSES.includes(status) ? status : "todo",
      },
    });

    return NextResponse.json(todo, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create todo" },
      { status: 500 }
    );
  }
}