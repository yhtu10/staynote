'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'
import Link from 'next/link'

type Review = {
  id: number
  property_id: number
  rating: number
  positive: string
  negative: string
  check_in_month: number | null
  purposes: string[] | null
  created_at: string
  property_name?: string
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const [reviews, setReviews] = useState<Review[]>([])
  const [displayName, setDisplayName] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [nameError, setNameError] = useState('')

  useEffect(() => {
    if (!session?.user) return

    // Fetch current display_name
    fetch('/api/users/me')
      .then(r => r.json())
      .then(data => {
        if (data.display_name) {
          setDisplayName(data.display_name)
          setNameInput(data.display_name)
        } else {
          const fallback = session.user?.name ?? '旅人'
          setDisplayName(fallback)
          setNameInput(fallback)
        }
      })
      .catch(() => {
        const fallback = session.user?.name ?? '旅人'
        setDisplayName(fallback)
        setNameInput(fallback)
      })

    // Fetch my reviews
    fetch('/api/users/reviews')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setReviews(data) })
      .catch(() => {})
  }, [session])

  const handleSaveName = async () => {
    if (!nameInput.trim()) { setNameError('暱稱不能為空'); return }
    setSavingName(true)
    setNameError('')
    try {
      const res = await fetch('/api/users/update-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: nameInput.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setNameError(data.error ?? '儲存失敗'); return }
      setDisplayName(nameInput.trim())
      setEditingName(false)
    } finally {
      setSavingName(false)
    }
  }

  if (status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', background: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: '14px', color: '#AAA' }}>載入中…</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div style={{ minHeight: '100vh', background: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }}>
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #EBEBEB', padding: '40px 24px', maxWidth: '360px', width: '100%', textAlign: 'center' }}>
          <div style={{ width: '56px', height: '56px', background: '#F5F5F5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto 20px' }}>👤</div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#111', marginBottom: '8px' }}>查看個人頁面</h1>
          <p style={{ fontSize: '13px', color: '#AAA', marginBottom: '24px' }}>請先登入以查看你的評論紀錄。</p>
          <button
            onClick={() => signIn('line')}
            style={{ width: '100%', background: '#06C755', color: 'white', fontSize: '14px', fontWeight: 600, padding: '12px', borderRadius: '20px', border: 'none', cursor: 'pointer' }}
          >
            💬 使用 LINE 登入
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F5' }}>
      <nav style={{ background: 'white', borderBottom: '1px solid #EBEBEB', padding: '0 24px', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <Link href="/" style={{ fontSize: '17px', fontWeight: 700, color: '#111', textDecoration: 'none' }}>StayNote</Link>
        <Link href="/write" style={{ fontSize: '13px', color: '#4B7BF5', textDecoration: 'none', fontWeight: 500 }}>+ 寫評論</Link>
      </nav>

      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 20px 60px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Profile card */}
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #EBEBEB', padding: '24px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
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
                  <input
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    placeholder="輸入暱稱"
                    maxLength={20}
                    style={{ fontSize: '15px', fontWeight: 600, color: '#111', border: '1px solid #4B7BF5', borderRadius: '8px', padding: '6px 10px', outline: 'none', width: '100%', marginBottom: '8px' }}
                  />
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
          <p style={{ fontSize: '12px', color: '#BBB' }}>{reviews.length} 則評論</p>
        </div>

        {/* Reviews */}
        <div>
          <p style={{ fontSize: '11px', color: '#AAA', letterSpacing: '0.08em', marginBottom: '12px' }}>我的評論</p>

          {reviews.length === 0 ? (
            <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #EBEBEB', padding: '40px 20px', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', color: '#AAA', marginBottom: '16px' }}>還沒有寫過評論</p>
              <Link href="/write" style={{ fontSize: '13px', color: '#4B7BF5', fontWeight: 600, textDecoration: 'none', background: '#EEF2FF', padding: '10px 20px', borderRadius: '20px' }}>
                寫第一則評論
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {reviews.map(r => (
                <Link key={r.id} href={`/hotel/${r.property_id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #EBEBEB', padding: '18px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#111', marginBottom: '2px' }}>
                          {r.property_name ?? `飯店 #${r.property_id}`}
                        </p>
                        <p style={{ fontSize: '11px', color: '#CCC' }}>
                          {r.check_in_month ? `${new Date(r.created_at).getFullYear()} 年 ${r.check_in_month} 月入住` : new Date(r.created_at).getFullYear() + ' 年'}
                        </p>
                      </div>
                      <span style={{ color: '#F5A623', fontSize: '13px' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#555', lineHeight: 1.7 }}>
                      {r.positive.length > 100 ? r.positive.slice(0, 100) + '…' : r.positive}
                    </p>
                    {r.purposes && r.purposes.length > 0 && (
                      <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
                        {r.purposes.map(p => (
                          <span key={p} style={{ fontSize: '11px', color: '#888', background: '#F5F5F5', borderRadius: '12px', padding: '3px 10px' }}>{p}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
              <Link href="/write" style={{ textDecoration: 'none', display: 'block', border: '1px dashed #DDD', borderRadius: '16px', padding: '16px', textAlign: 'center', fontSize: '13px', color: '#AAA' }}>
                + 再寫一則評論
              </Link>
            </div>
          )}
        </div>

      </main>
    </div>
  )
}
