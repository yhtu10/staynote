'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'
import Link from 'next/link'

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
  photos?: string[] | null
  updated_at: string
  created_at: string
  property_name?: string
}

type Favorite = {
  fav_id: number
  story_id: number
  property_id: number | null
  prefecture: string | null
  country: string | null
  created_at: string
  story: {
    id: number
    zh_tw_title: string | null
    title: string | null
    zh_tw_description: string | null
    description: string | null
    stay_description: string | null
    cover_image_url: string | null
    properties: { name_en: string; name_zh?: string | null; prefecture?: string; country?: string } | null
  } | null
}

type MyComment = {
  id: number
  content: string
  story_id: number | null
  review_id: number | null
  created_at: string
  context_type: 'story' | 'review'
  context_title: string | null
  context_property: string | null
  context_property_id: number | null
  link: string | null
}

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  draft:    { label: '草稿',   color: '#888',    bg: '#F5F5F5' },
  pending:  { label: '審核中', color: '#F5A623', bg: '#FFFBF0' },
  approved: { label: '已發佈', color: '#27AE60', bg: '#F0FFF4' },
  rejected: { label: '已退回', color: '#E74C3C', bg: '#FFF5F5' },
}

type Tab = 'reviews' | 'favorites' | 'comments'

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const [tab, setTab] = useState<Tab>('reviews')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search)
      if (p.get('submitted')) setSubmitted(true)
    }
  }, [])

  const [reviews, setReviews] = useState<Review[]>([])
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [myComments, setMyComments] = useState<MyComment[]>([])
  const [favPrefFilter, setFavPrefFilter] = useState<string | null>(null)

  const [displayName, setDisplayName] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [nameError, setNameError] = useState('')
  const [deleting, setDeleting] = useState<number | null>(null)
  const [copiedId, setCopiedId] = useState<number | null>(null)

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

  useEffect(() => {
    if (!session?.user) return
    if (tab === 'favorites' && favorites.length === 0) loadFavorites()
    if (tab === 'comments' && myComments.length === 0) loadComments()
  }, [tab, session])

  function loadReviews() {
    fetch('/api/users/reviews')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setReviews(data) })
      .catch(() => {})
  }

  function loadFavorites() {
    fetch('/api/users/favorites')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setFavorites(data) })
      .catch(() => {})
  }

  function loadComments() {
    fetch('/api/users/comments')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setMyComments(data) })
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

  function copyShareLink(propertyId: number, reviewId: number) {
    const url = `${window.location.origin}/hotel/${propertyId}`
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(reviewId)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  // 收藏篩選
  const allPrefs = [...new Set(favorites.map(f => f.prefecture || f.story?.properties?.prefecture).filter(Boolean))] as string[]
  const filteredFavs = favPrefFilter
    ? favorites.filter(f => (f.prefecture || f.story?.properties?.prefecture) === favPrefFilter)
    : favorites

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

  const TAB_DEFS: { key: Tab; label: string; count?: number }[] = [
    { key: 'reviews',   label: '我的評論', count: reviews.length },
    { key: 'favorites', label: '我的收藏', count: favorites.length || undefined },
    { key: 'comments',  label: '我的回應', count: myComments.length || undefined },
  ]

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

        {/* Tab bar */}
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #EBEBEB', overflow: 'hidden' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #F0F0F0' }}>
            {TAB_DEFS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  flex: 1, padding: '14px 8px', fontSize: '13px', fontWeight: tab === t.key ? 700 : 400,
                  color: tab === t.key ? '#111' : '#AAA',
                  background: 'none', border: 'none', borderBottom: tab === t.key ? '2px solid #111' : '2px solid transparent',
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                  marginBottom: '-1px',
                }}
              >
                {t.label}{t.count != null && t.count > 0 ? ` ${t.count}` : ''}
              </button>
            ))}
          </div>

          <div style={{ padding: '16px' }}>

            {/* === 評論 tab === */}
            {tab === 'reviews' && (
              reviews.length === 0 ? (
                <div style={{ padding: '24px 4px', textAlign: 'center' }}>
                  <p style={{ fontSize: '14px', color: '#AAA', marginBottom: '16px' }}>還沒有寫過評論</p>
                  <Link href="/write" style={{ fontSize: '13px', color: '#4B7BF5', fontWeight: 600, textDecoration: 'none', background: '#EEF2FF', padding: '10px 20px', borderRadius: '20px' }}>
                    寫第一則評論
                  </Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
                            <div key={r.id} style={{ background: '#FAFAFA', borderRadius: '12px', border: `1px solid ${s === 'rejected' ? '#FECACA' : '#EBEBEB'}`, padding: '14px 16px' }}>
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

                              {/* 滿意 */}
                              {r.positive && (
                                <div style={{ display: 'flex', gap: '6px', marginBottom: '4px' }}>
                                  <span style={{ fontSize: '11px', color: '#27AE60', flexShrink: 0, marginTop: '2px' }}>✓</span>
                                  <p style={{ fontSize: '13px', color: '#444', lineHeight: 1.7 }}>
                                    {s === 'approved' ? r.positive : (r.positive.slice(0, 120) + (r.positive.length > 120 ? '…' : ''))}
                                  </p>
                                </div>
                              )}

                              {/* 待改善（只在 approved 顯示完整） */}
                              {r.negative && s === 'approved' && (
                                <div style={{ display: 'flex', gap: '6px', marginBottom: '4px' }}>
                                  <span style={{ fontSize: '11px', color: '#AAA', flexShrink: 0, marginTop: '2px' }}>△</span>
                                  <p style={{ fontSize: '13px', color: '#888', lineHeight: 1.7 }}>{r.negative}</p>
                                </div>
                              )}

                              {r.photos && r.photos.length > 0 && (
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', margin: '8px 0' }}>
                                  {r.photos.map((url, i) => (
                                    <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                                      <img src={url} alt="" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #EBEBEB' }} />
                                    </a>
                                  ))}
                                </div>
                              )}

                              {/* Actions */}
                              <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                                {(s === 'draft' || s === 'rejected' || s === 'approved') && (
                                  <Link href={`/write?edit=${r.id}`}
                                    style={{ fontSize: '12px', fontWeight: 600, color: s === 'approved' ? '#555' : '#4B7BF5', background: s === 'approved' ? '#F5F5F5' : '#EEF2FF', borderRadius: '10px', padding: '7px 14px', textDecoration: 'none' }}>
                                    {s === 'approved' ? '✏️ 編輯（修改後需重新審核）' : s === 'rejected' ? '修改並重新送審' : '繼續編輯'}
                                  </Link>
                                )}
                                {s === 'approved' && (
                                  <>
                                    <Link href={`/hotel/${r.property_id}`}
                                      style={{ fontSize: '12px', color: '#27AE60', background: '#F0FFF4', borderRadius: '10px', padding: '7px 14px', textDecoration: 'none' }}>
                                      查看發佈頁
                                    </Link>
                                    <button
                                      onClick={() => copyShareLink(r.property_id, r.id)}
                                      style={{ fontSize: '12px', color: copiedId === r.id ? '#16A34A' : '#666', background: copiedId === r.id ? '#F0FFF4' : 'white', border: '1px solid #E8E8E8', borderRadius: '10px', padding: '7px 14px', cursor: 'pointer', fontFamily: 'inherit' }}>
                                      {copiedId === r.id ? '✓ 已複製' : '🔗 複製連結'}
                                    </button>
                                  </>
                                )}
                                {(s === 'draft' || s === 'rejected') && (
                                  <button onClick={() => handleDelete(r.id)} disabled={deleting === r.id}
                                    style={{ fontSize: '12px', color: '#AAA', background: 'white', border: '1px solid #E8E8E8', borderRadius: '10px', padding: '7px 14px', cursor: 'pointer', fontFamily: 'inherit' }}>
                                    {deleting === r.id ? '刪除中…' : '刪除'}
                                  </button>
                                )}
                              </div>

                              {s === 'pending' && (
                                <p style={{ fontSize: '11px', color: '#F5A623', marginTop: '10px' }}>⏳ 審核中，通常 24 小時內完成</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}

                  <Link href="/write" style={{ textDecoration: 'none', display: 'block', border: '1px dashed #DDD', borderRadius: '12px', padding: '14px', textAlign: 'center', fontSize: '13px', color: '#AAA' }}>
                    + 再寫一則評論
                  </Link>
                </div>
              )
            )}

            {/* === 收藏 tab === */}
            {tab === 'favorites' && (
              favorites.length === 0 ? (
                <div style={{ padding: '24px 4px', textAlign: 'center' }}>
                  <p style={{ fontSize: '14px', color: '#AAA', marginBottom: '8px' }}>還沒有收藏任何旅行故事</p>
                  <p style={{ fontSize: '12px', color: '#CCC' }}>在飯店頁面按下「👍 有幫助」即會加入收藏</p>
                </div>
              ) : (
                <div>
                  {/* 地區篩選 pills */}
                  {allPrefs.length > 1 && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                      <button
                        onClick={() => setFavPrefFilter(null)}
                        style={{
                          fontSize: '12px', padding: '5px 14px', borderRadius: '20px', cursor: 'pointer', fontFamily: 'inherit',
                          border: `1.5px solid ${favPrefFilter === null ? '#111' : '#DDD'}`,
                          background: favPrefFilter === null ? '#111' : 'transparent',
                          color: favPrefFilter === null ? 'white' : '#666',
                          fontWeight: favPrefFilter === null ? 600 : 400,
                        }}
                      >全部</button>
                      {allPrefs.map(p => (
                        <button
                          key={p}
                          onClick={() => setFavPrefFilter(favPrefFilter === p ? null : p)}
                          style={{
                            fontSize: '12px', padding: '5px 14px', borderRadius: '20px', cursor: 'pointer', fontFamily: 'inherit',
                            border: `1.5px solid ${favPrefFilter === p ? '#4B7BF5' : '#DDD'}`,
                            background: favPrefFilter === p ? '#EEF2FF' : 'transparent',
                            color: favPrefFilter === p ? '#4B7BF5' : '#666',
                            fontWeight: favPrefFilter === p ? 600 : 400,
                          }}
                        >{p}</button>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {filteredFavs.map(fav => {
                      const story = fav.story
                      const prop = story?.properties
                      const title = story?.zh_tw_title || story?.title
                      const desc = story?.zh_tw_description || story?.description || story?.stay_description || ''
                      const excerpt = desc.length > 80 ? desc.slice(0, 80) + '…' : desc
                      const propName = prop?.name_zh || prop?.name_en || ''
                      const prefecture = fav.prefecture || prop?.prefecture || ''

                      return (
                        <Link
                          key={fav.fav_id}
                          href={fav.property_id ? `/hotel/${fav.property_id}` : '#'}
                          style={{ display: 'flex', gap: '12px', background: '#FAFAFA', borderRadius: '12px', border: '1px solid #EBEBEB', padding: '12px 14px', textDecoration: 'none' }}
                        >
                          {story?.cover_image_url ? (
                            <img src={story.cover_image_url} alt="" style={{ width: '64px', height: '64px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
                          ) : (
                            <div style={{ width: '64px', height: '64px', borderRadius: '8px', background: '#EEF2FF', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>🏨</div>
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            {title && <p style={{ fontSize: '13px', fontWeight: 600, color: '#111', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</p>}
                            {propName && <p style={{ fontSize: '11px', color: '#888', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{propName}</p>}
                            {prefecture && <p style={{ fontSize: '10px', color: '#CCC', marginBottom: '4px' }}>{prefecture}</p>}
                            {excerpt && <p style={{ fontSize: '12px', color: '#666', lineHeight: 1.5 }}>{excerpt}</p>}
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )
            )}

            {/* === 回應 tab === */}
            {tab === 'comments' && (
              myComments.length === 0 ? (
                <div style={{ padding: '24px 4px', textAlign: 'center' }}>
                  <p style={{ fontSize: '14px', color: '#AAA', marginBottom: '8px' }}>還沒有留過任何回應</p>
                  <p style={{ fontSize: '12px', color: '#CCC' }}>在飯店頁面的評論或故事下方可以留下回應</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {myComments.map(c => (
                    <div key={c.id} style={{ background: '#FAFAFA', borderRadius: '12px', border: '1px solid #EBEBEB', padding: '12px 14px' }}>
                      {/* 回應的對象 */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '10px', color: '#AAA' }}>
                          {c.context_type === 'story' ? '回應了一則旅行故事' : '回應了一則評論'}
                        </span>
                        {c.context_property && c.link && (
                          <Link href={c.link} style={{ fontSize: '10px', color: '#4B7BF5', textDecoration: 'none', background: '#EEF2FF', borderRadius: '8px', padding: '1px 7px' }}>
                            {c.context_property}
                          </Link>
                        )}
                      </div>

                      {/* 被回應的內容摘要 */}
                      {c.context_title && (
                        <div style={{ background: '#F0F0F0', borderLeft: '2px solid #DDD', borderRadius: '0 6px 6px 0', padding: '5px 10px', marginBottom: '8px' }}>
                          <p style={{ fontSize: '11px', color: '#888' }}>{c.context_title}</p>
                        </div>
                      )}

                      {/* 我說的話 */}
                      <p style={{ fontSize: '13px', color: '#333', lineHeight: 1.65 }}>{c.content}</p>
                      <p style={{ fontSize: '10px', color: '#CCC', marginTop: '6px' }}>
                        {new Date(c.created_at).toLocaleDateString('zh-TW')}
                      </p>
                    </div>
                  ))}
                </div>
              )
            )}

          </div>
        </div>

      </main>
    </div>
  )
}
