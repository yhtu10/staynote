'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

type Review = {
  id: number
  property_id: number
  rating: number | null
  positive: string
  negative: string
  check_in_month: string | null
  purposes: string[] | null
  status: string
  rejection_reason?: string | null
  updated_at: string
  created_at: string
  property_name?: string
}

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  draft:    { label: "草稿",   color: "#888",    bg: "#F5F5F5" },
  pending:  { label: "審核中", color: "#F5A623", bg: "#FFFBF0" },
  approved: { label: "已發佈", color: "#27AE60", bg: "#F0FFF4" },
  rejected: { label: "已退回", color: "#E74C3C", bg: "#FFF5F5" },
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const searchParams = useSearchParams()
  const submitted = searchParams.get('submitted')

  const [reviews, setReviews] = useState<Review[]>([])
  const [displayName, setDisplayName] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [nameError, setNameError] = useState('')
  const [deleting, setDeleting] = useState<number | null>(null)

  useEffect(() => {
    if (!session?.user) return
    fetch('/api/users/me')
      .then(r => r.json())
      .then(data => {
        const name = data.display_name || session.user?.name || '旅人'
        setDisplayName(name)
        setNameInput(name)
      })
      .catch(() => {
        const fallback = session.user?.name ?? '旅人'
        setDisplayName(fallback)
        setNameInput(fallback)
      })
    loadReviews()
  }, [session])

  function loadReviews() {
    fetch('/api/users/reviews')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setReviews(data) })
      .catch(() => {})
  }

  async function handleSaveName() {
    if (!nameInput.trim()) { setNameError('暱稱不能為空'); return }
    setSavingName(true); setNameError('')
    try {
      const res = await fetch('/api/users/update-name', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: nameInput.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setNameError(data.error ?? '儲存失敗'); return }
      setDisplayName(nameInput.trim()); setEditingName(false)
    } finally { setSavingName(false) }
  }

  async function handleDelete(id: number) {
    if (!confirm('確定要刪除這則評論草稿嗎？')) return
    setDeleting(id)
    await fetch(`/api/reviews/${id}`, { method: 'DELETE' })
    setDeleting(null)
    loadReviews()
  }

  if (status === 'loading') {
    return <div style={{ minHeight: '100vh', background: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontSize: '14px', color: '#AAA' }}>載入中…</p>
    </div>
  }

  if (!session) {
    return <div style={{ minHeight: '100vh', background: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }}>
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #EBEBEB', padding: '40px 24px', maxWidth: '360px', width: '100%', textAlign: 'center' }}>
        <div style={{ width: '56px', height: '56px', background: '#F5F5F5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto 20px' }}>👤</div>
        <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#111', marginBottom: '8px' }}>查看個人頁面</h1>
        <p style={{ fontSize: '13px', color: '#AAA', marginBottom: '24px' }}>請先登入以查看你的評論紀錄。</p>
        <button onClick={() => signIn('line')}
          style={{ width: '100%', background: '#06C755', color: 'white', fontSize: '14px', fontWeight: 600, padding: '12px', borderRadius: '20px', border: 'none', cursor: 'pointer' }}>
          💬 使用 LINE 登入
        </button>
      </div>
    </div>
  }

  const grouped = {
    pending:  reviews.filter(r => r.status === 'pending'),
    draft:    reviews.filter(r => r.status === 'draft'),
    approved: reviews.filter(r => r.status === 'approved'),
    rejected: reviews.filter(r => r.status === 'rejected'),
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F5' }}>
      <nav style={{ background: 'white', borderBottom: '1px solid #EBEBEB', padding: '0 24px', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <Link href="/" style={{ fontSize: '17px', fontWeight: 700, color: '#111', textDecoration: 'none' }}>StayNote</Link>
        <Link href="/write" style={{ fontSize: '13px', color: '#4B7BF5', textDecoration: 'none', fontWeight: 500 }}>+ 寫評論</Link>
      </nav>

      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 20px 60px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {submitted && (
          <div style={{ background: '#F0FFF4', border: '1px solid #BBF7D0', borderRadius: '12px', padding: '14px 16px' }}>
            <p style={{ fontSize: '13px', color: '#15803D', fontWeight: 600 }}>✓ 評論已送出審核，通常 24 小時內完成！</p>
          </div>
        )}

        {/* Profile card */}
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #EBEBEB', padding: '24px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '14px' }}>
            {session.user?.image ? (
              <img src={session.user.image} alt="頭像" style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 700, color: '#4B7BF5' }}>
                {displayName[0]?.toUpperCase()}
              </div>
            )}
            <div style={{ flex: 1 }}>
              {editingName ? (
                <div>
                  <input value={nameInput} onChange={e => setNameInput(e.target.value)} placeholder="輸入暱稱" maxLength={20}
                    style={{ fontSize: '15px', fontWeight: 600, color: '#111', border: '1px solid #4B7BF5', borderRadius: '8px', padding: '6px 10px', outline: 'none', width: '100%', marginBottom: '8px' }} />
                  {nameError && <p style={{ fontSize: '11px', color: '#E55', marginBottom: '6px' }}>{nameError}</p>}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={handleSaveName} disabled={savingName}
                      style={{ fontSize: '12px', fontWeight: 600, color: 'white', background: '#111', border: 'none', borderRadius: '12px', padding: '6px 14px', cursor: 'pointer' }}>
                      {savingName ? '儲存中…' : '儲存'}
                    </button>
                    <button onClick={() => { setEditingName(false); setNameInput(displayName); setNameError('') }}
                      style={{ fontSize: '12px', color: '#888', background: '#F5F5F5', border: 'none', borderRadius: '12px', padding: '6px 14px', cursor: 'pointer' }}>
                      取消
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: '16px', fontWeight: 700, color: '#111', marginBottom: '2px' }}>{displayName}</p>
                  <button onClick={() => setEditingName(true)}
                    style={{ fontSize: '11px', color: '#4B7BF5', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                    修改暱稱
                  </button>
                </div>
              )}
            </div>
            <button onClick={() => signOut({ callbackUrl: '/' })}
              style={{ fontSize: '11px', color: '#AAA', background: 'none', border: '1px solid #E8E8E8', borderRadius: '12px', padding: '6px 12px', cursor: 'pointer' }}>
              登出
            </button>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span style={{ fontSize: '12px', color: '#BBB' }}>{grouped.approved.length} 則已發佈</span>
            {grouped.pending.length > 0 && <span style={{ fontSize: '12px', color: '#F5A623' }}>{grouped.pending.length} 則審核中</span>}
            {grouped.draft.length > 0 && <span style={{ fontSize: '12px', color: '#AAA' }}>{grouped.draft.length} 則草稿</span>}
            {grouped.rejected.length > 0 && <span style={{ fontSize: '12px', color: '#E74C3C' }}>{grouped.rejected.length} 則被退回</span>}
          </div>
        </div>

        {/* Reviews by section */}
        {reviews.length === 0 ? (
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #EBEBEB', padding: '40px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: '14px', color: '#AAA', marginBottom: '16px' }}>還沒有寫過評論</p>
            <Link href="/write" style={{ fontSize: '13px', color: '#4B7BF5', fontWeight: 600, textDecoration: 'none', background: '#EEF2FF', padding: '10px 20px', borderRadius: '20px' }}>
              寫第一則評論
            </Link>
          </div>
        ) : (
          <>
            {(['rejected', 'pending', 'draft', 'approved'] as const).map(s => {
              const list = grouped[s]
              if (list.length === 0) return null
              const badge = STATUS_LABEL[s]
              return (
                <div key={s}>
                  <p style={{ fontSize: '11px', color: '#AAA', letterSpacing: '0.08em', marginBottom: '10px' }}>
                    {badge.label}（{list.length} 則）
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {list.map(r => (
                      <div key={r.id} style={{ background: 'white', borderRadius: '16px', border: `1px solid ${s === 'rejected' ? '#FECACA' : '#EBEBEB'}`, padding: '16px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: '14px', fontWeight: 600, color: '#111', marginBottom: '2px' }}>
                              {r.property_name ?? `飯店 #${r.property_id}`}
                            </p>
                            <p style={{ fontSize: '11px', color: '#CCC' }}>
                              {r.check_in_month ?? ''} {r.updated_at ? `· 更新 ${new Date(r.updated_at).toLocaleDateString('zh-TW')}` : ''}
                            </p>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                            <span style={{ fontSize: '11px', fontWeight: 600, color: badge.color, background: badge.bg, borderRadius: '8px', padding: '3px 8px' }}>
                              {badge.label}
                            </span>
                            {r.rating && <span style={{ color: '#F5A623', fontSize: '12px' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>}
                          </div>
                        </div>

                        {/* 退回原因 */}
                        {s === 'rejected' && r.rejection_reason && (
                          <div style={{ background: '#FFF5F5', border: '1px solid #FECACA', borderRadius: '8px', padding: '8px 12px', marginBottom: '10px' }}>
                            <p style={{ fontSize: '12px', color: '#DC2626' }}>退回原因：{r.rejection_reason}</p>
                          </div>
                        )}

                        <p style={{ fontSize: '13px', color: '#555', lineHeight: 1.7, marginBottom: '12px' }}>
                          {(r.positive || '（尚無內容）').slice(0, 100)}{r.positive?.length > 100 ? '…' : ''}
                        </p>

                        {/* Actions */}
                        {(s === 'draft' || s === 'rejected') && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <Link href={`/write?edit=${r.id}`}
                              style={{ fontSize: '12px', fontWeight: 600, color: '#4B7BF5', background: '#EEF2FF', borderRadius: '10px', padding: '7px 14px', textDecoration: 'none' }}>
                              {s === 'rejected' ? '修改並重新送審' : '繼續編輯'}
                            </Link>
                            <button onClick={() => handleDelete(r.id)} disabled={deleting === r.id}
                              style={{ fontSize: '12px', color: '#AAA', background: 'white', border: '1px solid #E8E8E8', borderRadius: '10px', padding: '7px 14px', cursor: 'pointer', fontFamily: 'inherit' }}>
                              {deleting === r.id ? '刪除中…' : '刪除'}
                            </button>
                          </div>
                        )}
                        {s === 'pending' && (
                          <p style={{ fontSize: '11px', color: '#F5A623' }}>⏳ 審核中，通常 24 小時內完成</p>
                        )}
                        {s === 'approved' && (
                          <Link href={`/hotel/${r.property_id}`} style={{ fontSize: '12px', color: '#27AE60', textDecoration: 'none' }}>
                            → 查看已發佈的評論
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
            <Link href="/write" style={{ textDecoration: 'none', display: 'block', border: '1px dashed #DDD', borderRadius: '16px', padding: '16px', textAlign: 'center', fontSize: '13px', color: '#AAA' }}>
              + 再寫一則評論
            </Link>
          </>
        )}

      </main>
    </div>
  )
}
