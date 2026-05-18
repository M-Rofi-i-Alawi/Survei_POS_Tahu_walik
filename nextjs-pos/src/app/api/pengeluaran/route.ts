import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/pengeluaran - List expenses
export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("pengeluaran")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// POST /api/pengeluaran - Add expense
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("pengeluaran")
      .insert({
        description: body.description,
        amount: body.amount,
        date: body.date || new Date().toISOString().slice(0, 10),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(
      { success: true, data, message: "Pengeluaran berhasil ditambahkan" },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
