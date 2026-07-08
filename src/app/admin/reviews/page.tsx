"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

type Review = {
  id: number
  property_id: number
  property_name?: string
  author_name: string
  author_email: string
  rating: number
  positive: string
  negative: string
  check_in_month: string
  purposes: string[]
  bed_type: string
  recommend_for: string[]
  photos?: string[]
  status: string
  rejection_reason?: string
  updated_at: string
}

function starStr(r: number) {
  return "★".repeat(r) + "☆".repeat(5 - r)
}

const SESSION_KEY = "staynote_admin_auth"

export default function AdminReviewsPage() {
  const [authed, setAuthed] = useState(false)
  const [emailInput, setEmailInput] = useState("")
  const [pwInput, setPwInput] = useState("")
  const [pwError, setPwError] = useState("")
  const [tab, setTab] = useState<"pending" | "approved" | "rejected">("pending")
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(false)
  const [rejectId, setRejectId] = useState<number | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [acting, setActing] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === "1") setAuthed(true)
  }, [])

  async function handleLogin() {
    setPwError("")
    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailInput.trim(), password: pwInput }),
    })
    if (res.ok) {
      sessionStorage.setItem(SESSION_KEY, "1")
      setAuthed(true)
    } else {
      setPwError("密碼錯誤")
    }
  }

  async function load(s: string) {
    setLoading(true)
    const res = await fetch(`/api/admin/reviews?status=${s}`, {
      headers: { "x-admin-auth": sessionStorage.getItem(SESSION_KEY) ?? "" },
    })
    const data = await res.json()
    setReviews(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { if (authed) load(tab) }, [authed, tab])

  async function act(id: number, action: "approve" | "reject", reason?: string) {
    setActing(true)
    await fetch(`/api/admin/reviews/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-admin-auth": sessionStorage.getItem(SESSION_KEY) ?? "",
      },
      body: JSON.stringify({ action, rejection_reason: reason }),
    })
    setActing(false)
    setRejectId(null)
    setRejectReason("")
    load(tab)
  }

  // --- Password gate ---
  if (!authed) {
    return (
      <div style={{ minHeight: "100vh", background: "#F5F5F5", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 20px" }}>
        <div style={{ background: "white", borderRadius: "16px", border: "1px solid #EBEBEB", padding: "40px 32px", maxWidth: "360px", width: "100%" }}>
          <p style={{ fontSize: "20px", fontWeight: 700, color: "#111", marginBottom: "6px" }}>StayNote 後台</p>
          <p style={{ fontSize: "13px", color: "#AAA", marginBottom: "24px" }}>請輸入管理員帳號</p>
          <input
            type="email"
            value={emailInput}
            onChange={e => setEmailInput(e.target.value)}
            placeholder="Email"
            autoFocus
            style={{ width: "100%", border: "1px solid #E0E0E0", borderRadius: "10px", padding: "10px 14px", fontSize: "14px", outline: "none", marginBottom: "10px", boxSizing: "border-box" }}
          />
          <input
            type="password"
            value={pwInput}
            onChange={e => setPwInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            placeholder="密碼"
            style={{ width: "100%", border: "1px solid #E0E0E0", borderRadius: "10px", padding: "10px 14px", fontSize: "14px", outline: "none", marginBottom: "12px", boxSizing: "border-box" }}
          />
          {pwError && <p style={{ fontSize: "12px", color: "#E74C3C", marginBottom: "10px" }}>{pwError}</p>}
          <button onClick={handleLogin}
            style={{ width: "100%", background: "#111", color: "white", border: "none", borderRadius: "10px", padding: "12px 0", fontSize: "14px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            登入
          </button>
        </div>
      </div>
    )
  }

  const TAB_LABELS = { pending: "待審核", approved: "已通過", rejected: "已退回" }
  const TAB_COLORS: Record<string, string> = { pending: "#F5A623", approved: "#27AE60", rejected: "#E74C3C" }

  return (
    <div style={{ background: "#F5F5F5", minHeight: "100vh" }}>
      <nav style={{ background: "white", borderBottom: "1px solid #EBEBEB", padding: "0 24px", height: "52px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
        <Link href="/" style={{ fontSize: "17px", fontWeight: 700, color: "#111", textDecoration: "none" }}>StayNote</Link>
        <span style={{ fontSize: "12px", color: "#AAA" }}>管理後台 · 評論審核</span>
      </nav>

      <main style={{ maxWidth: "800px", margin: "0 auto", padding: "24px 20px 60px" }}>
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
          {(["pending", "approved", "rejected"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: "8px 18px", borderRadius: "20px", fontSize: "13px", fontWeight: 600, border: "none", cursor: "pointer", fontFamily: "inherit", background: tab === t ? "#111" : "white", color: tab === t ? "white" : "#666", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>

        {loading && <p style={{ color: "#AAA", fontSize: "13px" }}>載入中…</p>}

        {!loading && reviews.length === 0 && (
          <div style={{ background: "white", borderRadius: "16px", padding: "40px", textAlign: "center" }}>
            <p style={{ color: "#AAA", fontSize: "14px" }}>目前沒有{TAB_LABELS[tab]}的評論</p>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {reviews.map((r) => (
            <div key={r.id} style={{ background: "white", borderRadius: "16px", border: "1px solid #EBEBEB", padding: "20px 24px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px" }}>
                <div>
                  <p style={{ fontSize: "15px", fontWeight: 700, color: "#111", marginBottom: "3px" }}>
                    {r.property_name ?? `Property #${r.property_id}`}
                  </p>
                  <p style={{ fontSize: "12px", color: "#AAA" }}>
                    {r.author_name} · {r.author_email} · {r.check_in_month} · {r.bed_type}
                  </p>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "4px" }}>
                    {(r.purposes ?? []).map(p => (
                      <span key={p} style={{ fontSize: "10px", color: "#666", background: "#F5F5F5", borderRadius: "8px", padding: "2px 7px" }}>{p}</span>
                    ))}
                    {(r.recommend_for ?? []).map(p => (
                      <span key={p} style={{ fontSize: "10px", color: "#4B7BF5", background: "#EEF2FF", borderRadius: "8px", padding: "2px 7px" }}>{p}</span>
                    ))}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <span style={{ color: "#F5A623", fontSize: "16px" }}>{starStr(r.rating)}</span>
                  <p style={{ fontSize: "10px", marginTop: "2px" }}>
                    <span style={{ color: TAB_COLORS[r.status], fontWeight: 600 }}>
                      {TAB_LABELS[r.status as keyof typeof TAB_LABELS] ?? r.status}
                    </span>
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                <span style={{ fontSize: "11px", color: "#27AE60", fontWeight: 500, flexShrink: 0, marginTop: "2px" }}>✓ 滿意</span>
                <p style={{ fontSize: "13px", color: "#333", lineHeight: 1.7 }}>{r.positive}</p>
              </div>
              {r.negative && (
                <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                  <span style={{ fontSize: "11px", color: "#AAA", flexShrink: 0, marginTop: "2px" }}>△ 待改善</span>
                  <p style={{ fontSize: "13px", color: "#888", lineHeight: 1.7 }}>{r.negative}</p>
                </div>
              )}

              {r.photos && r.photos.length > 0 && (
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px" }}>
                  {r.photos.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                      <img src={url} alt="" style={{ width: "72px", height: "72px", objectFit: "cover", borderRadius: "8px", border: "1px solid #EBEBEB" }} />
                    </a>
                  ))}
                </div>
              )}
              {r.rejection_reason && (
                <div style={{ background: "#FFF5F5", border: "1px solid #FECACA", borderRadius: "8px", padding: "10px 12px", marginBottom: "10px" }}>
                  <p style={{ fontSize: "12px", color: "#DC2626" }}>退回原因：{r.rejection_reason}</p>
                </div>
              )}

              <p style={{ fontSize: "10px", color: "#CCC", marginBottom: "12px" }}>
                更新：{new Date(r.updated_at).toLocaleString("zh-TW")}
              </p>

              {tab === "pending" && (
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <button onClick={() => act(r.id, "approve")} disabled={acting}
                    style={{ flex: 1, background: "#27AE60", color: "white", border: "none", borderRadius: "10px", padding: "9px 0", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                    ✓ 核准
                  </button>
                  <button onClick={() => setRejectId(r.id)} disabled={acting}
                    style={{ flex: 1, background: "white", color: "#E74C3C", border: "1.5px solid #FECACA", borderRadius: "10px", padding: "9px 0", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                    × 退回
                  </button>
                </div>
              )}

              {rejectId === r.id && (
                <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                    placeholder="請填寫退回原因，將顯示給用戶" rows={2}
                    style={{ border: "1px solid #E0E0E0", borderRadius: "8px", padding: "8px 12px", fontSize: "13px", resize: "none", fontFamily: "inherit", outline: "none" }} />
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => act(r.id, "reject", rejectReason)} disabled={acting || !rejectReason.trim()}
                      style={{ flex: 1, background: "#E74C3C", color: "white", border: "none", borderRadius: "8px", padding: "8px 0", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", opacity: rejectReason.trim() ? 1 : 0.4 }}>
                      確認退回
                    </button>
                    <button onClick={() => { setRejectId(null); setRejectReason("") }}
                      style={{ background: "white", border: "1px solid #E0E0E0", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", cursor: "pointer", color: "#666", fontFamily: "inherit" }}>
                      取消
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
