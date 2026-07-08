import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map(e => e.trim()).filter(Boolean)

function isAdmin(email: string) {
  return ADMIN_EMAILS.includes(email)
}

// GET /api/admin/reviews?status=pending
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email || !isAdmin(session.user.email)) {
    return NextResponse.json({ error: "無權限" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status") ?? "pending"

  const { data: reviews, error } = await supabase
    .from("reviews")
    .select("id, property_id, author_name, author_email, rating, positive, negative, check_in_month, purposes, bed_type, recommend_for, status, rejection_reason, created_at, updated_at")
    .eq("status", status)
    .order("updated_at", { ascending: true })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Attach property names
  const propIds = [...new Set((reviews ?? []).map(r => r.property_id))]
  const { data: properties } = propIds.length > 0
    ? await supabase.from("properties").select("id, name_en").in("id", propIds)
    : { data: [] }
  const nameMap = new Map((properties ?? []).map(p => [p.id, p.name_en]))

  return NextResponse.json((reviews ?? []).map(r => ({ ...r, property_name: nameMap.get(r.property_id) })))
}
