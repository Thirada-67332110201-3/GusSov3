'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'

type Ebook = {
  ebook_id: number
  title: string
  description: string
  cover_image: string
}

function DownloadContent() {
  const supabase = createClient()
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

    const email = session.user.email || ''
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
        .eq('user_email', email)
        .eq('ebook_id', ebookId)

      if (purchaseData && purchaseData.length > 0) {
        setAuthorized(true)
      }
    }

    setLoading(false)
  }, [supabase, ebookId])

  useEffect(() => {
    verifyAccess()
  }, [verifyAccess])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">กำลังตรวจสอบสิทธิ์การดาวน์โหลด...</div>
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 border border-gray-100 text-center">
        
        {!userEmail ? (
          <div>
            <h1 className="text-xl font-bold text-red-600 mb-2">⚠️ กรุณาเข้าสู่ระบบก่อน</h1>
            <p className="text-sm text-gray-600 mb-6">คุณต้องเข้าสู่ระบบด้วยอีเมลที่ใช้สั่งซื้อเพื่อดาวน์โหลดหนังสือ</p>
            <a href="/login" className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium text-sm hover:bg-indigo-700 transition">
              ไปยังหน้าเข้าสู่ระบบ
            </a>
          </div>
        ) : !authorized ? (
          <div>
            <h1 className="text-xl font-bold text-red-600 mb-2">🚫 ไม่มีสิทธิ์เข้าถึงหนังสือเล่มนี้</h1>
            <p className="text-sm text-gray-600 mb-2">บัญชีของคุณ (<span className="font-semibold text-gray-800">{userEmail}</span>) ไม่พบประวัติการซื้อหนังสือเล่มนี้</p>
            <a href="/" className="inline-block bg-gray-600 text-white px-6 py-3 rounded-xl font-medium text-sm hover:bg-gray-700 transition">
              กลับสู่หน้าร้านค้า
            </a>
          </div>
        ) : (
          <div>
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
              ✓
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-1">ยืนยันสิทธิ์สำเร็จ!</h1>
            <p className="text-xs text-gray-500 mb-6">คุณเป็นเจ้าของสิทธิ์หนังสือเล่มนี้</p>

            {ebook && (
              <div className="bg-gray-50 p-4 rounded-xl border mb-6 text-left">
                <h2 className="font-semibold text-gray-800 text-base mb-1">{ebook.title}</h2>
                <p className="text-xs text-gray-500 line-clamp-2">{ebook.description}</p>
              </div>
            )}

            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                alert('เริ่มดาวน์โหลดไฟล์ E-Book (PDF) ลงเครื่องของคุณแล้ว!')
              }}
              className="w-full block bg-emerald-600 text-white py-3 rounded-xl hover:bg-emerald-700 transition font-medium text-sm shadow-md mb-3"
            >
              📥 ดาวน์โหลดไฟล์ E-Book (PDF)
            </a>

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