import { NextRequest, NextResponse } from "next/server";

// GET /api/auth/me - Get current logged-in user
export async function GET(request: NextRequest) {
  try {
    const session = request.cookies.get("pos_session")?.value;

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Belum login" },
        { status: 401 }
      );
    }

    const user = JSON.parse(session);

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Session tidak valid" },
      { status: 401 }
    );
  }
}
