import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string })?.id ?? ""
  if (!userId) return NextResponse.json({ error: "未登入" }, { status: 401 })

  const formData = await req.formData()
  const files = formData.getAll("files") as File[]
  if (!files.length) return NextResponse.json({ urls: [] })

  const urls: string[] = []
  for (const file of files.slice(0, 5)) {
    const ext = file.name.split(".").pop() ?? "jpg"
    const path = `reviews/${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())
    const { error } = await supabase.storage
      .from("review-photos")
      .upload(path, buffer, { contentType: file.type, upsert: false })
    if (!error) {
      const { data } = supabase.storage.from("review-photos").getPublicUrl(path)
      urls.push(data.publicUrl)
    }
  }

  return NextResponse.json({ urls })
}
