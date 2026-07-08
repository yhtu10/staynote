import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

async function fetchPropertyImage(propId: number, name_en: string, prefecture: string | null) {
  // Step 1: HafH
  try {
    const res = await fetch(`https://www.hafh.com/zh-tw/properties/${propId}`, {
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36" },
      signal: AbortSignal.timeout(10000),
    })
    if (res.ok) {
      const html = await res.text()
      const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/)
      if (match) {
        const str = JSON.stringify(JSON.parse(match[1]))
        const imgs = [...str.matchAll(/hafh-prod-property_image[^"\\]*/g)].map(m => "https://storage.googleapis.com/" + m[0])
        if (imgs[0]) {
          await supabase.from("properties").update({ cover_image_url: imgs[0] }).eq("id", propId)
          return
        }
      }
    }
  } catch { /* ignore */ }

  // Step 2: DuckDuckGo 圖片搜尋
  try {
    const q = `${name_en} ${prefecture ?? ""} hotel`
    const r1 = await fetch("https://duckduckgo.com/?q=" + encodeURIComponent(q) + "&iax=images&ia=images", {
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" },
      signal: AbortSignal.timeout(10000),
    })
    const html = await r1.text()
    const vqd = html.match(/vqd=['"](\d[\d-]+)['"]/)
    if (vqd) {
      const r2 = await fetch(`https://duckduckgo.com/i.js?q=${encodeURIComponent(q)}&vqd=${vqd[1]}&o=json&p=1`, {
        headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://duckduckgo.com/" },
        signal: AbortSignal.timeout(8000),
      })
      const json = await r2.json()
      const url = json?.results?.[0]?.image
      if (url) { await supabase.from("properties").update({ cover_image_url: url }).eq("id", propId); return }
    }
  } catch { /* ignore */ }

  // Step 3: Google Custom Search 備援
  const key = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY
  const cx = process.env.GOOGLE_CUSTOM_SEARCH_CX
  if (!key || !cx) return
  try {
    const q = encodeURIComponent(`${name_en} ${prefecture ?? ""} hotel`)
    const gRes = await fetch(`https://www.googleapis.com/customsearch/v1?key=${key}&cx=${cx}&searchType=image&q=${q}&num=1`, {
      signal: AbortSignal.timeout(8000),
    })
    if (gRes.ok) {
      const json = await gRes.json()
      const url = json?.items?.[0]?.link
      if (url) await supabase.from("properties").update({ cover_image_url: url }).eq("id", propId)
    }
  } catch { /* ignore */ }
}

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

  const reviewId = parseInt(id)
  const { error, data: updatedReview } = await supabase.from("reviews").update({
    status: action === "approve" ? "approved" : "rejected",
    rejection_reason: action === "reject" ? rejection_reason : null,
    updated_at: new Date().toISOString(),
  }).eq("id", reviewId).select("property_id").single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 評論通過時：若旅宿仍是 pending，同步 approve 並觸發補圖
  if (action === "approve" && updatedReview?.property_id) {
    const propId = updatedReview.property_id
    const { data: prop } = await supabase
      .from("properties")
      .select("id, name_en, prefecture, cover_image_url, status")
      .eq("id", propId)
      .single()

    if (prop?.status === "pending") {
      await supabase.from("properties").update({ status: "approved" }).eq("id", propId)

      // 背景補圖（HafH → Google 備援）
      if (!prop.cover_image_url) {
        fetchPropertyImage(propId, prop.name_en, prop.prefecture).catch(() => {})
      }
    }
  }

  return NextResponse.json({ ok: true })
}
