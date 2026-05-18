import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// POST /api/auth/admin-login - Login Admin only
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email dan password wajib diisi" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: user, error } = await supabase
      .from("users")
      .select("id, name, email, role")
      .eq("email", email)
      .eq("password", password)
      .eq("role", "admin")
      .single();

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Akun admin tidak ditemukan." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      data: user,
      message: "Login admin berhasil",
    });

    response.cookies.set("pos_session", JSON.stringify(user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
