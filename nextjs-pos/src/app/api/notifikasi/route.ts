import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/notifikasi - Get notifications
export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("notifikasi")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(50);

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

// PATCH /api/notifikasi - Mark notification as read
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = await createClient();

    if (body.action === "mark_read" && body.id) {
      await supabase
        .from("notifikasi")
        .update({ read: true })
        .eq("id", body.id);
    }

    if (body.action === "clear_all") {
      await supabase.from("notifikasi").delete().neq("id", "none");
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
