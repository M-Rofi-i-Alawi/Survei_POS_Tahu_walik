import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/qris - Get QRIS config
export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("qris_config")
      .select("*")
      .limit(1)
      .single();

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

// POST /api/qris - Upload/update QRIS image
// Body: { image_data: string (base64), account_name?: string }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = await createClient();

    if (!body.image_data) {
      return NextResponse.json(
        { success: false, error: "image_data wajib diisi (base64 string)" },
        { status: 400 }
      );
    }

    // Cek apakah sudah ada row
    const { data: existing } = await supabase
      .from("qris_config")
      .select("id")
      .limit(1)
      .single();

    let data;
    let error;

    if (existing) {
      // Update existing
      ({ data, error } = await supabase
        .from("qris_config")
        .update({
          image_data: body.image_data,
          ...(body.account_name && { account_name: body.account_name }),
        })
        .eq("id", existing.id)
        .select()
        .single());
    } else {
      // Insert baru
      ({ data, error } = await supabase
        .from("qris_config")
        .insert({
          image_data: body.image_data,
          account_name: body.account_name || "Cemil.in - Ishaq",
        })
        .select()
        .single());
    }

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      message: "QRIS berhasil diupdate",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// PUT /api/qris - Update account name only
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = await createClient();

    const { data: existing } = await supabase
      .from("qris_config")
      .select("id")
      .limit(1)
      .single();

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Konfigurasi QRIS belum dibuat" },
        { status: 404 }
      );
    }

    const updates: Record<string, unknown> = {};
    if (body.account_name !== undefined) updates.account_name = body.account_name;
    if (body.image_data !== undefined) updates.image_data = body.image_data;

    const { data, error } = await supabase
      .from("qris_config")
      .update(updates)
      .eq("id", existing.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      message: "QRIS berhasil diupdate",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
