import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/config - Get store + QRIS config
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: store } = await supabase
      .from("store_config")
      .select("*")
      .limit(1)
      .single();

    const { data: qris } = await supabase
      .from("qris_config")
      .select("*")
      .limit(1)
      .single();

    return NextResponse.json({
      success: true,
      data: { store, qris },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// PUT /api/config - Update store and/or QRIS config
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = await createClient();

    if (body.store) {
      const { data: existing } = await supabase
        .from("store_config")
        .select("id")
        .limit(1)
        .single();

      if (existing) {
        await supabase
          .from("store_config")
          .update(body.store)
          .eq("id", existing.id);
      }
    }

    if (body.qris) {
      const { data: existing } = await supabase
        .from("qris_config")
        .select("id")
        .limit(1)
        .single();

      if (existing) {
        await supabase
          .from("qris_config")
          .update(body.qris)
          .eq("id", existing.id);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Konfigurasi berhasil diupdate",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
