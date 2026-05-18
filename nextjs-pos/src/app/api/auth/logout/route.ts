import { NextResponse } from "next/server";

// POST /api/auth/logout
export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "Logout berhasil",
  });

  response.cookies.set("pos_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return response;
}
