import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// POST /api/auth/restore - Restore session from localStorage user ID
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID diperlukan" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify user still exists in database
    const { data: user, error } = await supabase
      .from("users")
      .select("id, name, email, role")
      .eq("id", userId)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: "User tidak ditemukan" },
        { status: 401 }
      );
    }

    // Re-set the session cookie
    const response = NextResponse.json({
      success: true,
      data: user,
      message: "Session restored",
    });

    response.cookies.set("pos_session", JSON.stringify(user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json(
      { success: false, error: "Gagal restore session" },
      { status: 500 }
    );
  }
}
