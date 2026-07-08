import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

function checkAdmin(req: NextRequest) {
  // 支援兩種驗證方式：x-admin-auth header 或 Authorization Bearer
  const token = req.headers.get("x-admin-auth") ?? req.headers.get("authorization")?.replace("Bearer ", "")
  return token === "1" && !!process.env.ADMIN_PASSWORD
}

export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: "無權限" }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status") ?? "pending"

  const { data: reviews, error } = await supabase
    .from("reviews")
    .select("id, property_id, author_name, author_email, rating, positive, negative, check_in_month, purposes, bed_type, recommend_for, status, rejection_reason, created_at, updated_at")
    .eq("status", status)
    .order("updated_at", { ascending: true })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const propIds = [...new Set((reviews ?? []).map(r => r.property_id))]
  const { data: properties } = propIds.length > 0
    ? await supabase.from("properties").select("id, name_en").in("id", propIds)
    : { data: [] }
  const nameMap = new Map((properties ?? []).map(p => [p.id, p.name_en]))

  return NextResponse.json((reviews ?? []).map(r => ({ ...r, property_name: nameMap.get(r.property_id) })))
}
