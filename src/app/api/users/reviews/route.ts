import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: "未登入" }, { status: 401 })
  }

  const userId = (session.user as { id?: string }).id ?? ""
  const { data: reviews } = await supabase
    .from("reviews")
    .select("id, property_id, rating, positive, negative, check_in_month, purposes, status, rejection_reason, updated_at, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50)

  if (!reviews || reviews.length === 0) return NextResponse.json([])

  // Fetch property names
  const propIds = [...new Set(reviews.map(r => r.property_id))]
  const { data: properties } = await supabase
    .from("properties")
    .select("id, name_en")
    .in("id", propIds)

  const nameMap = new Map((properties ?? []).map(p => [p.id, p.name_en]))
  const result = reviews.map(r => ({ ...r, property_name: nameMap.get(r.property_id) ?? null }))

  return NextResponse.json(result)
}
