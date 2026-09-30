'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams, useRouter } from 'next/navigation'

type Ebook = {
  ebook_id: number
  title: string
  description: string
  cover_image: string
}

function DownloadContent() {
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const ebookId = searchParams.get('ebook_id')

  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [ebook, setEbook] = useState<Ebook | null>(null)

  const verifyAccess = useCallback(async () => {
    if (!ebookId) {
      setLoading(false)
      return
    }

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setLoading(false)
      return
    }

    const email = (session.user.email || '').trim().toLowerCase()
    setUserEmail(email)

    const { data: bookData } = await supabase
      .from('ebooks')
      .select('*')
      .eq('ebook_id', ebookId)
      .single()

    if (bookData) {
      setEbook(bookData)
    }

    if (email === 'admin@gusso.com') {
      setAuthorized(true)
    } else {
      const { data: purchaseData } = await supabase
        .from('purchases')
        .select('*')
        .ilike('user_email', email)
        .eq('ebook_id', ebookId)

      if (purchaseData && purchaseData.length > 0) {
        setAuthorized(true)
      } else {
        setAuthorized(false)
      }
    }

    setLoading(false)
  }, [supabase, ebookId])

  useEffect(() => {
    verifyAccess()
  }, [verifyAccess])

  const handleSwitchAccount = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-gray-500 font-medium text-sm">กำลังตรวจสอบสิทธิ์การดาวน์โหลดหนังสือ...</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center">
        
        {/* กรณีที่ยังไม่ได้เข้าสู่ระบบ */}
        {!userEmail ? (
          <div>
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
              🔒
            </div>
            <h1 className="text-xl font-bold text-gray-800 mb-2">กรุณาเข้าสู่ระบบก่อน</h1>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              คุณต้องเข้าสู่ระบบด้วยอีเมลที่ใช้สั่งซื้อ ถึงจะสามารถตรวจสอบสิทธิ์และดาวน์โหลดหนังสือได้
            </p>
            <div className="space-y-3">
              <a
                href="/login"
                className="w-full block bg-indigo-600 text-white py-3 rounded-xl font-medium text-sm hover:bg-indigo-700 transition shadow-sm"
              >
                🔐 ไปยังหน้าเข้าสู่ระบบ
              </a>
              <a
                href="/"
                className="w-full block bg-gray-100 text-gray-600 py-3 rounded-xl font-medium text-sm hover:bg-gray-200 transition"
              >
                ← กลับสู่หน้าร้านค้า
              </a>
            </div>
          </div>
        ) : !authorized ? (
          /* กรณีเข้าสู่ระบบแล้ว แต่อีเมลไม่ตรงกับคนซื้อ */
          <div>
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
              🚫
            </div>
            <h1 className="text-xl font-bold text-red-600 mb-2">ไม่มีสิทธิ์ดาวน์โหลดหนังสือเล่มนี้</h1>
            
            <div className="bg-red-50 border border-red-100 rounded-xl p-3.5 mb-4 text-left">
              <p className="text-xs text-red-700 mb-1">
                คุณกำลังเข้าสู่ระบบด้วย: <span className="font-semibold text-gray-900">{userEmail}</span>
              </p>
              <p className="text-xs text-red-600">
                ❌ ไม่พบประวัติการสั่งซื้อหนังสือเล่มนี้ในบัญชีของคุณ
              </p>
            </div>

            <p className="text-sm text-gray-700 font-medium mb-6 leading-relaxed">
              ⚠️ ต้องเข้าสู่ระบบด้วยบัญชีที่ถูกต้อง (อีเมลที่ใช้สั่งซื้อ) ถึงจะสามารถดาวน์โหลดหนังสือได้
            </p>

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleSwitchAccount}
                className="w-full block bg-indigo-600 text-white py-3 rounded-xl font-medium text-sm hover:bg-indigo-700 transition shadow-sm"
              >
                🔄 สลับบัญชี / เข้าสู่ระบบด้วยอีเมลที่ถูกต้อง
              </button>
              <a
                href="/"
                className="w-full block bg-gray-100 text-gray-600 py-3 rounded-xl font-medium text-sm hover:bg-gray-200 transition"
              >
                ← กลับสู่หน้าร้านค้า
              </a>
            </div>
          </div>
        ) : (
          /* กรณียืนยันสิทธิ์สำเร็จ */
          <div>
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
              ✓
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-1">ยืนยันสิทธิ์สำเร็จ!</h1>
            <p className="text-xs text-emerald-600 font-medium mb-4">
              สิทธิ์ถูกต้องสำหรับ: <span className="font-semibold">{userEmail}</span>
            </p>

            {ebook && (
              <div className="bg-gray-50 p-4 rounded-xl border mb-6 text-left">
                <h2 className="font-semibold text-gray-800 text-base mb-1">{ebook.title}</h2>
                <p className="text-xs text-gray-500 line-clamp-2">{ebook.description}</p>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                alert(`📥 เริ่มดาวน์โหลดหนังสือ "${ebook?.title || 'E-Book'}" (PDF) ลงเครื่องของคุณแล้ว!`)
              }}
              className="w-full block bg-emerald-600 text-white py-3 rounded-xl hover:bg-emerald-700 transition font-medium text-sm shadow-md mb-3"
            >
              📥 ดาวน์โหลดไฟล์ E-Book (PDF)
            </button>

            <a href="/" className="text-xs text-gray-500 hover:underline">
              ← กลับสู่หน้าร้านหลัก
            </a>
          </div>
        )}

      </div>
    </main>
  )
}

export default function DownloadPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-500">กำลังโหลด...</div>}>
      <DownloadContent />
    </Suspense>
  )
}