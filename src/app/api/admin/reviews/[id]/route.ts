import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map(e => e.trim()).filter(Boolean)

// PATCH /api/admin/reviews/[id] - 核准或退回
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
    return NextResponse.json({ error: "無權限" }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const { action, rejection_reason } = body // action: "approve" | "reject"

  if (!["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "無效操作" }, { status: 400 })
  }
  if (action === "reject" && !rejection_reason) {
    return NextResponse.json({ error: "請填寫退回原因" }, { status: 400 })
  }

  const status = action === "approve" ? "approved" : "rejected"

  const { error } = await supabase.from("reviews").update({
    status,
    rejection_reason: action === "reject" ? rejection_reason : null,
    updated_at: new Date().toISOString(),
  }).eq("id", parseInt(id))

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, status })
}
