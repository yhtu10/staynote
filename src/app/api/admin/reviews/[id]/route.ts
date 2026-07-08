import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

function checkAdmin(req: NextRequest) {
  const token = req.headers.get("x-admin-auth") ?? req.headers.get("authorization")?.replace("Bearer ", "")
  return token === "1" && !!process.env.ADMIN_PASSWORD
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!checkAdmin(req)) return NextResponse.json({ error: "無權限" }, { status: 403 })

  const { id } = await params
  const body = await req.json()
  const { action, rejection_reason } = body

  if (!["approve", "reject"].includes(action)) return NextResponse.json({ error: "無效操作" }, { status: 400 })
  if (action === "reject" && !rejection_reason) return NextResponse.json({ error: "請填寫退回原因" }, { status: 400 })

  const { error } = await supabase.from("reviews").update({
    status: action === "approve" ? "approved" : "rejected",
    rejection_reason: action === "reject" ? rejection_reason : null,
    updated_at: new Date().toISOString(),
  }).eq("id", parseInt(id))

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
