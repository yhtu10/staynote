'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
)

// --- Web Speech API types ---
interface ISpeechRecognition extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start(): void
  stop(): void
  onstart: (() => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
  onresult: ((e: ISpeechRecognitionEvent) => void) | null
}
interface ISpeechRecognitionEvent {
  results: ISpeechRecognitionResultList
}
interface ISpeechRecognitionResultList {
  length: number
  [index: number]: ISpeechRecognitionResult
}
interface ISpeechRecognitionResult {
  isFinal: boolean
  [index: number]: { transcript: string }
}
declare global {
  interface Window {
    SpeechRecognition: new () => ISpeechRecognition
    webkitSpeechRecognition: new () => ISpeechRecognition
  }
}

// --- Types ---
type TravelPurpose = '商務' | '情侶' | '家庭' | '獨旅休閒' | '朋友同遊'
type BedType = '一大床' | '兩小床' | '單人床' | '其他'
type KidsAge = '0–2 歲' | '3–6 歲' | '7–12 歲' | '13 歲以上'
type GuestType = '獨旅' | '情侶' | '家庭（含幼兒）' | '商務出差' | '銀髮旅遊' | '預算旅行' | '奢華享受'

interface ParsedInfo {
  checkInMonth?: string
  guestCount?: string
  purpose?: TravelPurpose[]
  bedType?: BedType
  hasKids?: boolean
  kidsAges?: KidsAge[]
}

// --- Constants ---
const PURPOSES: TravelPurpose[] = ['商務', '情侶', '家庭', '獨旅休閒', '朋友同遊']
const BED_TYPES: BedType[] = ['一大床', '兩小床', '單人床', '其他']
const KIDS_AGES: KidsAge[] = ['0–2 歲', '3–6 歲', '7–12 歲', '13 歲以上']
const GUEST_TYPES: GuestType[] = ['獨旅', '情侶', '家庭（含幼兒）', '商務出差', '銀髮旅遊', '預算旅行', '奢華享受']


// --- Voice parser (keyword-based, no API needed) ---
function parseTranscript(text: string): ParsedInfo {
  const result: ParsedInfo = {}

  // Month
  const lastMonthMatch = text.match(/上個月/)
  const thisMonthMatch = text.match(/這個月|本月/)
  const monthMatch = text.match(/(\d{1,2})\s*月/)
  const now = new Date()
  if (lastMonthMatch) {
    const m = now.getMonth() === 0 ? 12 : now.getMonth()
    const y = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
    result.checkInMonth = `${y}/${String(m).padStart(2, '0')}`
  } else if (thisMonthMatch) {
    result.checkInMonth = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`
  } else if (monthMatch) {
    result.checkInMonth = `${now.getFullYear()}/${String(parseInt(monthMatch[1])).padStart(2, '0')}`
  }

  // Purpose (先偵測，影響人數推導)
  const purposes: TravelPurpose[] = []
  const hasPartner = !!text.match(/老婆|老公|太太|先生|伴侶|情侶|蜜月/)
  const hasKidsKeyword = !!text.match(/小孩|小朋友|孩子|兒子|女兒|寶寶|嬰兒/)
  if (hasPartner) purposes.push('情侶')
  if (text.match(/家人|家庭/) || hasKidsKeyword) purposes.push('家庭')
  if (text.match(/商務|出差|工作/)) purposes.push('商務')
  if (text.match(/朋友|好友|同學/) && !hasPartner) purposes.push('朋友同遊')
  if (text.match(/獨旅|一個人|自己/) && !hasPartner) purposes.push('獨旅休閒')
  if (purposes.length > 0) result.purpose = purposes

  // Guest count
  const countMatch = text.match(/(\d+)\s*人|([一兩三四五六七八九十])\s*個人/)
  const countMap: Record<string, string> = { 一: '1', 兩: '2', 三: '3', 四: '4', 五: '5' }
  if (countMatch) {
    result.guestCount = countMatch[1] || countMap[countMatch[2]] || '2'
  } else if (text.includes('獨旅') || text.includes('一個人')) {
    result.guestCount = '1'
  } else if (hasPartner && hasKidsKeyword) {
    result.guestCount = '3'
  } else if (hasPartner) {
    result.guestCount = '2'
  }

  // Bed type
  if (text.match(/大床|雙人床|king|queen/i)) result.bedType = '一大床'
  else if (text.match(/兩張|雙床|twin|兩小床/i)) result.bedType = '兩小床'
  else if (text.match(/單人床|single/i)) result.bedType = '單人床'

  // Kids
  if (text.match(/小孩|小朋友|孩子|兒子|女兒|寶寶|嬰兒/)) {
    result.hasKids = true
    const ages: KidsAge[] = []
    if (text.match(/嬰兒|寶寶|[01]\s*歲/)) ages.push('0–2 歲')
    if (text.match(/[3456]\s*歲|幼兒|幼稚園/)) ages.push('3–6 歲')
    if (text.match(/[789]\s*歲|1[012]\s*歲|小學|學齡/)) ages.push('7–12 歲')
    if (text.match(/1[3456789]\s*歲|青少年|國中|高中/)) ages.push('13 歲以上')
    if (ages.length > 0) result.kidsAges = ages
  }

  return result
}

// --- Sub-components ---
function Chip({
  label, selected, onClick,
}: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${
        selected
          ? 'bg-neutral-900 text-white border-neutral-900'
          : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400'
      }`}
    >
      {label}
    </button>
  )
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="text-3xl leading-none transition-colors"
          style={{ color: star <= (hover || value) ? '#f59e0b' : '#e5e7eb' }}
        >
          ★
        </button>
      ))}
    </div>
  )
}

type HotelSuggestion = { id: number; name_en: string; prefecture: string; country: string }

// --- Main page ---
export default function WritePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [editId, setEditId] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search)
      setEditId(p.get('edit'))
    }
  }, [])

  // Hotel search
  const [hotelQuery, setHotelQuery] = useState('')
  const [selectedHotel, setSelectedHotel] = useState<{ id: number; name: string } | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [hotelSuggestions, setHotelSuggestions] = useState<HotelSuggestion[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [savedDraftId, setSavedDraftId] = useState<number | null>(null)
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [loadingDraft, setLoadingDraft] = useState(false)

  // Input mode
  const [inputMode, setInputMode] = useState<'choose' | 'voice' | 'manual'>('choose')

  // Voice
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [parsedInfo, setParsedInfo] = useState<ParsedInfo | null>(null)
  const recognitionRef = useRef<ISpeechRecognition | null>(null)

  // Basic info fields
  const [checkInMonth, setCheckInMonth] = useState('')
  const [guestCount, setGuestCount] = useState('')
  const [purposes, setPurposes] = useState<TravelPurpose[]>([])
  const [bedType, setBedType] = useState<BedType | ''>('')
  const [hasKids, setHasKids] = useState(false)
  const [kidsAges, setKidsAges] = useState<KidsAge[]>([])
  const [roomDetail, setRoomDetail] = useState('')
  const [showRoomDetail, setShowRoomDetail] = useState(false)

  // Review
  const [positive, setPositive] = useState('')
  const [negative, setNegative] = useState('')
  const [noNegative, setNoNegative] = useState(false)

  // Rating
  const [rating, setRating] = useState(0)
  const [recommendFor, setRecommendFor] = useState<GuestType[]>([])

  // Photos
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([])
  const [uploadingPhotos, setUploadingPhotos] = useState(false)

  useEffect(() => {
    if (hotelQuery.length < 2) { setHotelSuggestions([]); return }
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/hotels/search?q=${encodeURIComponent(hotelQuery)}`)
      const data = await res.json()
      setHotelSuggestions(data)
    }, 300)
    return () => clearTimeout(timer)
  }, [hotelQuery])

  // 若 URL 有 ?edit=id，載入既有評論資料
  useEffect(() => {
    if (!editId || !session) return
    setLoadingDraft(true)
    fetch(`/api/reviews/${editId}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) return
        setSavedDraftId(data.id)
        setRating(data.rating ?? 0)
        setPositive(data.positive ?? '')
        setNegative(data.negative ?? '')
        setCheckInMonth(data.check_in_month ?? '')
        setPurposes(data.purposes ?? [])
        setBedType(data.bed_type ?? '')
        setHasKids(data.has_kids ?? false)
        setRecommendFor(data.recommend_for ?? [])
        if (data.property_id) {
          // 查飯店名稱
          fetch(`/api/hotels/search?id=${data.property_id}`)
            .then(r => r.json())
            .then(props => {
              const p = Array.isArray(props) ? props[0] : props
              if (p) setSelectedHotel({ id: p.id, name: p.name_en })
            })
        }
        if (data.status === 'rejected') {
          setSubmitError(`上次送審被退回：${data.rejection_reason ?? '請修改後重新送出'}`)
        }
      })
      .finally(() => setLoadingDraft(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId, session])

  const applyParsed = useCallback((parsed: ParsedInfo) => {
    if (parsed.checkInMonth) setCheckInMonth(parsed.checkInMonth)
    if (parsed.guestCount) setGuestCount(parsed.guestCount)
    if (parsed.purpose) setPurposes(parsed.purpose)
    if (parsed.bedType) setBedType(parsed.bedType)
    if (parsed.hasKids !== undefined) setHasKids(parsed.hasKids)
    if (parsed.kidsAges) setKidsAges(parsed.kidsAges)
  }, [])

  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { alert('你的瀏覽器不支援語音辨識，請使用 Chrome 或 Safari。'); return }

    const recognition = new SR()
    recognition.lang = 'zh-TW'
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    let latestText = ''

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => {
      setIsListening(false)
      if (latestText) {
        setTranscript(latestText)
        setParsedInfo(parseTranscript(latestText))
      }
    }
    recognition.onresult = (e: ISpeechRecognitionEvent) => {
      let combined = ''
      for (let i = 0; i < e.results.length; i++) {
        combined += e.results[i][0].transcript
      }
      latestText = combined
      setTranscript(combined)
    }
    recognition.onerror = () => setIsListening(false)

    recognitionRef.current = recognition
    recognition.start()
  }, [])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
  }, [])

  const confirmParsed = useCallback(() => {
    if (parsedInfo) applyParsed(parsedInfo)
    setInputMode('manual')
    setParsedInfo(null)
  }, [parsedInfo, applyParsed])

  const togglePurpose = (p: TravelPurpose) =>
    setPurposes((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p])

  const toggleKidsAge = (a: KidsAge) =>
    setKidsAges((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a])

  const toggleRecommend = (g: GuestType) =>
    setRecommendFor((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g])

  const addPhotos = (files: FileList | null) => {
    if (!files) return
    const newPhotos = Array.from(files).slice(0, 5 - photos.length).map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }))
    setPhotos(prev => [...prev, ...newPhotos].slice(0, 5))
  }

  const removePhoto = (index: number) => {
    setPhotos(prev => {
      URL.revokeObjectURL(prev[index].preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  const uploadPhotos = async (): Promise<string[]> => {
    if (photos.length === 0) return []
    setUploadingPhotos(true)
    const urls: string[] = []
    for (const p of photos) {
      const ext = p.file.name.split('.').pop() ?? 'jpg'
      const path = `reviews/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabaseClient.storage.from('review-photos').upload(path, p.file, { upsert: false })
      if (!error) {
        const { data } = supabaseClient.storage.from('review-photos').getPublicUrl(path)
        urls.push(data.publicUrl)
      }
    }
    setUploadingPhotos(false)
    return urls
  }

  const buildPayload = (action: 'draft' | 'submit', photoUrls: string[] = []) => ({
    property_id: selectedHotel?.id,
    rating: rating || null,
    positive,
    negative: noNegative ? '' : negative,
    check_in_month: checkInMonth || null,
    purposes,
    bed_type: bedType || null,
    has_kids: hasKids,
    recommend_for: recommendFor,
    photos: photoUrls,
    action,
  })

  const saveDraft = async () => {
    if (!selectedHotel) { setSubmitError('請先選擇飯店'); return }
    setSubmitting(true)
    setSubmitError('')
    try {
      const photoUrls = await uploadPhotos()
      const currentId = savedDraftId
      const url = currentId ? `/api/reviews/${currentId}` : '/api/reviews'
      const method = currentId ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload('draft', photoUrls)),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      if (!currentId && d.id) setSavedDraftId(d.id)
      setLastSaved(new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }))
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : '儲存失敗，請再試一次')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = async () => {
    if (!selectedHotel || !rating || positive.length < 50) return
    setSubmitting(true)
    setSubmitError('')
    try {
      const photoUrls = await uploadPhotos()
      const currentId = savedDraftId
      const url = currentId ? `/api/reviews/${currentId}` : '/api/reviews'
      const method = currentId ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload('submit', photoUrls)),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      router.push(`/profile?submitted=1`)
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : '發生錯誤，請再試一次')
    } finally {
      setSubmitting(false)
    }
  }

  const monthOptions = Array.from({ length: 18 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    return { value: `${y}/${m}`, label: `${y} 年 ${d.getMonth() + 1} 月` }
  })

  // --- Login gate ---
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-neutral-400 text-sm">載入中…</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-5">
        <div className="bg-white border border-neutral-200 rounded-2xl p-8 max-w-sm w-full text-center">
          <div className="w-14 h-14 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-5 text-2xl">
            ✍️
          </div>
          <h1 className="text-xl font-semibold text-neutral-900 mb-2">分享你的住宿經驗</h1>
          <p className="text-sm text-neutral-500 mb-6 leading-relaxed">
            登入後才能發佈評論，<br />並賺取訂房點數。
          </p>
          <button
            onClick={() => signIn('line')}
            className="w-full bg-[#06C755] text-white text-sm font-medium py-3 rounded-full hover:bg-[#05b34c] transition-colors flex items-center justify-center gap-2"
          >
            <span className="text-base">💬</span>
            使用 LINE 登入
          </button>
          <p className="text-xs text-neutral-400 mt-4">
            登入即代表同意我們的服務條款與隱私政策
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <nav className="border-b border-neutral-200 bg-white sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-5 h-14 flex items-center justify-between">
          <a href="/" className="font-semibold text-neutral-900 tracking-tight">StayNote</a>
          <span className="text-sm text-neutral-400">分享住宿評論</span>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-5 py-8 flex flex-col gap-8">

        {/* Step 1: Hotel search */}
        <section className="bg-white border border-neutral-200 rounded-2xl p-6">
          <p className="text-xs text-neutral-400 uppercase tracking-widest mb-4">第 1 步・找飯店</p>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            你住的是哪間飯店？
          </label>
          <div className="relative">
            <input
              type="text"
              value={hotelQuery}
              onChange={(e) => { setHotelQuery(e.target.value); setSelectedHotel(null); setShowSuggestions(true) }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="輸入飯店名稱搜尋…"
              className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400"
            />
            {showSuggestions && hotelSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-xl shadow-sm z-10 overflow-hidden">
                {hotelSuggestions.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onMouseDown={() => { setHotelQuery(h.name_en); setSelectedHotel({ id: h.id, name: h.name_en }); setShowSuggestions(false) }}
                    className="w-full text-left px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 border-b border-neutral-100 last:border-0"
                  >
                    <span>{h.name_en}</span>
                    <span className="text-xs text-neutral-400 ml-2">{h.prefecture}, {h.country}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {selectedHotel && (
            <p className="text-sm text-emerald-600 mt-2">✓ 已選擇：{selectedHotel.name}</p>
          )}
        </section>

        {/* Step 2: Basic info */}
        <section className="bg-white border border-neutral-200 rounded-2xl p-6">
          <p className="text-xs text-neutral-400 uppercase tracking-widest mb-4">第 2 步・基本資訊</p>

          {/* Input mode chooser */}
          {inputMode === 'choose' && (
            <div>
              <p className="text-sm font-medium text-neutral-700 mb-3">選擇填寫方式</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setInputMode('voice')}
                  className="border-2 border-neutral-900 rounded-xl p-4 text-center hover:bg-neutral-50 transition-colors"
                >
                  <div className="text-2xl mb-2">🎙️</div>
                  <p className="text-sm font-medium text-neutral-900">語音快速填寫</p>
                  <p className="text-xs text-neutral-400 mt-1">說一句話，自動填好</p>
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('manual')}
                  className="border border-neutral-200 rounded-xl p-4 text-center hover:bg-neutral-50 transition-colors"
                >
                  <div className="text-2xl mb-2">✏️</div>
                  <p className="text-sm font-medium text-neutral-700">手動填寫</p>
                  <p className="text-xs text-neutral-400 mt-1">逐欄選擇</p>
                </button>
              </div>
            </div>
          )}

          {/* Voice mode */}
          {inputMode === 'voice' && !parsedInfo && (
            <div>
              <button
                type="button"
                onClick={() => setInputMode('choose')}
                className="text-xs text-neutral-400 mb-4 hover:text-neutral-600 flex items-center gap-1"
              >
                ← 返回
              </button>
              <div className="text-center py-4">
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors ${
                    isListening
                      ? 'bg-red-100 border-2 border-red-400 animate-pulse'
                      : 'bg-neutral-100 border-2 border-neutral-300 hover:border-neutral-500'
                  }`}
                >
                  <span className="text-3xl">{isListening ? '⏹️' : '🎙️'}</span>
                </button>
                <p className="text-sm text-neutral-600 mb-1">
                  {isListening ? '正在聆聽，說完後點停止…' : '點麥克風開始說'}
                </p>
                <p className="text-xs text-neutral-400 leading-relaxed max-w-xs mx-auto">
                  說完後點麥克風停止。提示：「上個月跟老婆去台北，住了一晚大床房，有帶一個四歲的小孩」
                </p>
                {transcript && (
                  <div className="mt-4 bg-neutral-50 rounded-xl p-3 text-sm text-neutral-600 text-left border-l-2 border-neutral-300">
                    {transcript}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Parsed result confirmation */}
          {inputMode === 'voice' && parsedInfo && (
            <div>
              <p className="text-sm font-medium text-neutral-700 mb-1">AI 解析結果，請確認</p>
              <div className="bg-neutral-50 rounded-xl p-3 text-sm text-neutral-600 mb-4 border-l-2 border-blue-300 italic">
                「{transcript}」
              </div>
              <div className="divide-y divide-neutral-100 mb-4">
                {[
                  { label: '入住年月', value: parsedInfo.checkInMonth },
                  { label: '同行人數', value: parsedInfo.guestCount ? `${parsedInfo.guestCount} 人` : undefined },
                  { label: '入住目的', value: parsedInfo.purpose?.join('・') },
                  { label: '床型', value: parsedInfo.bedType },
                  { label: '有小孩同住', value: parsedInfo.hasKids ? '是' : undefined },
                  { label: '小孩年齡', value: parsedInfo.kidsAges?.join('・') },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center py-2.5">
                    <span className="text-neutral-400 text-sm">{label}</span>
                    {value ? (
                      <span className="text-neutral-900 text-sm font-medium flex items-center gap-2">
                        {value}
                        <span className="text-xs bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full">AI 填入</span>
                      </span>
                    ) : (
                      <span className="text-neutral-300 text-sm">— 未偵測到</span>
                    )}
                  </div>
                ))}
              </div>
              <div className="bg-amber-50 rounded-xl p-3 text-xs text-amber-700 mb-4">
                ✏️ 有誤？確認後可直接在下方欄位修改。
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={confirmParsed}
                  className="flex-1 bg-neutral-900 text-white text-sm font-medium py-2.5 rounded-full hover:bg-neutral-700 transition-colors"
                >
                  確認，繼續填寫
                </button>
                <button
                  type="button"
                  onClick={() => { setTranscript(''); setParsedInfo(null) }}
                  className="border border-neutral-200 text-neutral-600 text-sm px-4 py-2.5 rounded-full hover:border-neutral-400 transition-colors whitespace-nowrap"
                >
                  重新說一次
                </button>
              </div>
            </div>
          )}

          {/* Manual form */}
          {inputMode === 'manual' && (
            <div className="flex flex-col gap-5">
              {inputMode === 'manual' && parsedInfo === null && (
                <button
                  type="button"
                  onClick={() => setInputMode('choose')}
                  className="text-xs text-neutral-400 hover:text-neutral-600 flex items-center gap-1 -mb-2"
                >
                  ← 返回選擇方式
                </button>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">入住年月 <span className="text-red-400">*</span></label>
                  <select
                    value={checkInMonth}
                    onChange={(e) => setCheckInMonth(e.target.value)}
                    className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm text-neutral-900 focus:outline-none focus:border-neutral-400"
                  >
                    <option value="">選擇月份</option>
                    {monthOptions.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">同行總人數 <span className="text-red-400">*</span></label>
                  <select
                    value={guestCount}
                    onChange={(e) => setGuestCount(e.target.value)}
                    className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm text-neutral-900 focus:outline-none focus:border-neutral-400"
                  >
                    <option value="">選擇人數</option>
                    <option value="1">1 人（獨旅）</option>
                    <option value="2">2 人</option>
                    <option value="3">3 人</option>
                    <option value="4">4 人以上</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">入住目的 <span className="text-red-400">*</span></label>
                <div className="flex flex-wrap gap-2">
                  {PURPOSES.map((p) => (
                    <Chip key={p} label={p} selected={purposes.includes(p)} onClick={() => togglePurpose(p)} />
                  ))}
                </div>
              </div>

              <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-100">
                <p className="text-sm font-medium text-neutral-700 mb-3">床型配置 <span className="text-red-400">*</span></p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {BED_TYPES.map((b) => (
                    <Chip key={b} label={b} selected={bedType === b} onClick={() => setBedType(b)} />
                  ))}
                </div>

                <label className="flex items-center gap-2 text-sm text-neutral-600 cursor-pointer mb-3">
                  <input
                    type="checkbox"
                    checked={hasKids}
                    onChange={(e) => { setHasKids(e.target.checked); if (!e.target.checked) setKidsAges([]) }}
                    className="w-4 h-4 rounded"
                  />
                  有小孩同住
                </label>

                {hasKids && (
                  <div className="pt-3 border-t border-neutral-200">
                    <p className="text-xs text-neutral-400 mb-2">小孩年齡（可多選）</p>
                    <div className="flex flex-wrap gap-2">
                      {KIDS_AGES.map((a) => (
                        <Chip key={a} label={a} selected={kidsAges.includes(a)} onClick={() => toggleKidsAge(a)} />
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-3 pt-3 border-t border-neutral-200">
                  <button
                    type="button"
                    onClick={() => setShowRoomDetail((v) => !v)}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    {showRoomDetail ? '▾' : '▸'} 補充房型細節
                    <span className="text-xs text-neutral-400 border border-neutral-200 rounded px-1.5 py-0.5 ml-1">選填・給進階旅人</span>
                  </button>
                  {showRoomDetail && (
                    <input
                      type="text"
                      value={roomDetail}
                      onChange={(e) => setRoomDetail(e.target.value)}
                      placeholder="例：好萊塢房型、行政樓層、角落房、連通房…"
                      className="mt-2 w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400"
                    />
                  )}
                </div>
              </div>

              {/* Photo upload */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  入住照片
                  <span className="text-xs text-neutral-400 border border-neutral-200 rounded px-1.5 py-0.5 ml-2 font-normal">選填</span>
                </label>
                {photos.length < 5 && (
                  <label
                    className="block border-2 border-dashed border-neutral-200 rounded-xl p-6 text-center hover:border-neutral-400 transition-colors cursor-pointer"
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); addPhotos(e.dataTransfer.files) }}
                  >
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      className="hidden"
                      onChange={e => addPhotos(e.target.files)}
                    />
                    <div className="text-2xl mb-2">📷</div>
                    <p className="text-sm text-neutral-600">點擊或拖曳上傳（最多 5 張，已選 {photos.length} 張）</p>
                    <p className="text-xs text-neutral-400 mt-1">支援 JPG、PNG，單檔上限 10MB</p>
                  </label>
                )}
                {photos.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {photos.map((p, i) => (
                      <div key={i} className="relative aspect-square">
                        <img src={p.preview} alt="" className="w-full h-full object-cover rounded-xl" />
                        <button
                          type="button"
                          onClick={() => removePhoto(i)}
                          className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs leading-none"
                        >×</button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-2 bg-emerald-50 rounded-xl p-3 text-xs text-emerald-700 flex items-start gap-2">
                  <span className="mt-0.5">🛡️</span>
                  <span>附上入住照片可提高評論可信度，讓其他旅人更放心參考你的經驗。<strong>同時獲得額外 +5 積分。</strong></span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Step 3: Core review */}
        <section className="bg-white border border-neutral-200 rounded-2xl p-6">
          <p className="text-xs text-neutral-400 uppercase tracking-widest mb-4">第 3 步・評論內容</p>

          <div className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                最讓你滿意的一件事？<span className="text-red-400">*</span>
              </label>
              <p className="text-xs text-neutral-400 mb-2">寫下最難忘的細節，讓其他旅人感受你的住宿體驗</p>
              <textarea
                value={positive}
                onChange={(e) => setPositive(e.target.value)}
                placeholder="例：check-in 的時候服務人員記得我們是蜜月，偷偷準備了一瓶氣泡酒…"
                rows={4}
                className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 resize-none"
              />
              <div className="flex justify-between mt-1">
                <span className={`text-xs ${positive.length >= 50 ? 'text-emerald-600' : 'text-neutral-400'}`}>
                  {positive.length >= 50 ? '✓ 達到最低字數' : `還需要 ${Math.max(0, 50 - positive.length)} 字`}
                </span>
                <span className="text-xs text-neutral-300">{positive.length} 字</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                最讓你失望的一件事？<span className="text-red-400">*</span>
              </label>
              <p className="text-xs text-neutral-400 mb-2">沒有缺點也可以勾選下方選項</p>
              <textarea
                value={noNegative ? '' : negative}
                onChange={(e) => setNegative(e.target.value)}
                disabled={noNegative}
                placeholder="例：隔音較差，樓上有走路聲音…"
                rows={3}
                className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 resize-none disabled:bg-neutral-50 disabled:text-neutral-400"
              />
              <div className="flex items-center justify-between mt-2">
                <label className="flex items-center gap-2 text-sm text-neutral-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={noNegative}
                    onChange={(e) => { setNoNegative(e.target.checked); if (e.target.checked) setNegative('') }}
                    className="w-4 h-4 rounded"
                  />
                  無明顯缺點
                </label>
                {!noNegative && negative.length > 0 && (
                  <span className="text-xs text-neutral-400">{negative.length} 字</span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Step 4: Rating + Submit */}
        <section className="bg-white border border-neutral-200 rounded-2xl p-6">
          <p className="text-xs text-neutral-400 uppercase tracking-widest mb-4">第 4 步・評分與推薦</p>

          <div className="flex flex-col gap-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-3">整體評分 <span className="text-red-400">*</span></label>
              <StarPicker value={rating} onChange={setRating} />
              {rating > 0 && (
                <p className="text-sm text-neutral-500 mt-2">
                  {['', '非常不滿意', '不太滿意', '普通', '蠻推薦的', '非常推薦！'][rating]}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                適合推薦給哪種旅客？
                <span className="text-xs text-neutral-400 border border-neutral-200 rounded px-1.5 py-0.5 ml-2 font-normal">可多選</span>
              </label>
              <p className="text-xs text-neutral-400 mb-3">幫助其他旅人判斷這間飯店是否符合自己的需求</p>
              <div className="flex flex-wrap gap-2">
                {GUEST_TYPES.map((g) => (
                  <Chip key={g} label={g} selected={recommendFor.includes(g)} onClick={() => toggleRecommend(g)} />
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-neutral-100">
              <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700 mb-4 flex items-start gap-2">
                <span>🎁</span>
                <span>
                  審核通過後獲得 <strong>50 點</strong>旅人積分，附照片再 <strong>+5 點</strong>，可折抵 KBK exchange 訂房。
                </span>
              </div>
              {submitError && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-3">
                  <p className="text-sm text-red-600">{submitError}</p>
                </div>
              )}
              {lastSaved && (
                <p className="text-xs text-neutral-400 text-center mb-2">✓ 草稿已儲存於 {lastSaved}</p>
              )}
              {loadingDraft && (
                <p className="text-xs text-neutral-400 text-center mb-2">載入草稿中…</p>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={saveDraft}
                  disabled={submitting || !selectedHotel}
                  className="flex-1 bg-white border border-neutral-200 text-neutral-700 text-sm font-medium py-3.5 rounded-full hover:bg-neutral-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {uploadingPhotos ? '上傳照片中…' : submitting ? '儲存中…' : '儲存草稿'}
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting || uploadingPhotos || !selectedHotel || !rating || positive.length < 50}
                  className="flex-[2] bg-neutral-900 text-white text-sm font-medium py-3.5 rounded-full hover:bg-neutral-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {uploadingPhotos ? '上傳照片中…' : submitting ? '送出中…' : '送出審核'}
                </button>
              </div>
              <p className="text-xs text-neutral-400 text-center mt-3">
                送出後會經過人工審核，通常 24 小時內完成
              </p>
            </div>
          </div>
        </section>

      </main>
    </div>
  )
}
