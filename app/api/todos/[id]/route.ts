import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

const VALID_STATUSES = ["todo", "in-progress", "complete"] as const;
const MAX_TEXT_LENGTH = 1000;

function getClientIP(request: Request): string {
  return request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = getClientIP(request);
  const { success, remaining } = rateLimit(ip);
  
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  try {
    const { id } = await params;

    if (!id || typeof id !== "string" || id.length < 1) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const todo = await prisma.todo.findUnique({
      where: { id },
    });

    if (!todo) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 });
    }

    return NextResponse.json(todo);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch todo" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = getClientIP(request);
  const { success, remaining } = rateLimit(ip);
  
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  try {
    const { id } = await params;

    if (!id || typeof id !== "string" || id.length < 1) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = await request.json();
    const { text, status } = body;

    const updateData: { text?: string; status?: string } = {};

    if (text !== undefined) {
      if (typeof text !== "string" || text.trim().length === 0) {
        return NextResponse.json({ error: "Text cannot be empty" }, { status: 400 });
      }
      if (text.length > MAX_TEXT_LENGTH) {
        return NextResponse.json(
          { error: `Text must be ${MAX_TEXT_LENGTH} characters or less` },
          { status: 400 }
        );
      }
      updateData.text = text.trim();
    }

    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
          { status: 400 }
        );
      }
      updateData.status = status;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const todo = await prisma.todo.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(todo);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update todo" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = getClientIP(request);
  const { success, remaining } = rateLimit(ip);
  
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  try {
    const { id } = await params;

    if (!id || typeof id !== "string" || id.length < 1) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    await prisma.todo.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete todo" },
      { status: 500 }
    );
  }
}