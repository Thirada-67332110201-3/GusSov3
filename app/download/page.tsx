'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle2, Download, AlertTriangle, ArrowLeft, RefreshCw, BookOpen, Lock } from 'lucide-react'

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
  const [accessDenialReason, setAccessDenialReason] = useState<'pending' | 'cancelled' | 'not_found' | null>(null)
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
      setAccessDenialReason(null)
    } else {
      let hasConfirmed = false
      let hasPending = false
      let hasCancelled = false

      // 1. ตรวจสอบตาราง orders และ order_items ว่าสถานะเป็น 'ยืนยันแล้ว' หรือ 'รอชำระ'
      try {
        const { data: userOrders } = await supabase
          .from('orders')
          .select(`
            order_id,
            status,
            customer_email,
            order_items (
              ebook_id
            )
          `)
          .ilike('customer_email', email)

        if (userOrders && userOrders.length > 0) {
          for (const ord of userOrders) {
            const hasThisBook = (ord.order_items || []).some((item: any) => String(item.ebook_id) === String(ebookId))
            if (hasThisBook) {
              if (ord.status === 'ยืนยันแล้ว') hasConfirmed = true
              else if (ord.status === 'รอชำระ') hasPending = true
              else if (ord.status === 'ยกเลิก') hasCancelled = true
            }
          }
        }
      } catch (e) {
        // fallback
      }

      // 2. ตรวจสอบจาก purchases
      const { data: purchaseData } = await supabase
        .from('purchases')
        .select('*')
        .ilike('user_email', email)
        .eq('ebook_id', ebookId)

      if (hasConfirmed || (purchaseData && purchaseData.length > 0)) {
        setAuthorized(true)
        setAccessDenialReason(null)
      } else if (hasPending) {
        setAuthorized(false)
        setAccessDenialReason('pending')
      } else if (hasCancelled) {
        setAuthorized(false)
        setAccessDenialReason('cancelled')
      } else {
        setAuthorized(false)
        setAccessDenialReason('not_found')
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
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-400 border-t-transparent mb-4"></div>
        <p className="font-medium text-base text-gray-200">กำลังตรวจสอบสิทธิ์การดาวน์โหลดหนังสือ...</p>
      </div>
    )
  }

  // ==========================================
  // กรณีถูกต้อง: หน้าสีเขียวสวยๆ พร้อมดาวน์โหลด
  // ==========================================
  if (authorized && userEmail) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-emerald-600 via-teal-700 to-green-800 flex items-center justify-center p-4 relative overflow-hidden">
        {/* แสงเอฟเฟกต์ตกแต่งพื้นหลัง */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-teal-300/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-lg w-full bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 border border-emerald-200 text-center relative z-10 transition-all">
          
          {/* ไอคอนความสำเร็จสีเขียว */}
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
            <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
          </div>

          {/* ข้อความหลักตามที่ต้องการ */}
          <span className="inline-block bg-emerald-100 text-emerald-800 text-xs font-semibold px-3 py-1 rounded-full mb-3">
            ✓ ตรวจสอบสิทธิ์เรียบร้อย
          </span>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-emerald-900 mb-2">
            ยินดีต้อนรับ
          </h1>
          <p className="text-base sm:text-lg font-bold text-emerald-700 mb-4">
            พร้อมสำหรับการดาวน์โหลดแล้ว!
          </p>

          <p className="text-xs text-gray-500 mb-6 bg-emerald-50/70 border border-emerald-100 py-2 px-3 rounded-lg">
            เข้าสู่ระบบด้วย: <span className="font-semibold text-emerald-900">{userEmail}</span>
          </p>

          {/* กล่องแสดงรายละเอียดหนังสือ */}
          {ebook && (
            <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-2xl p-4 mb-6 text-left flex gap-4 items-center shadow-sm">
              {ebook.cover_image ? (
                <img
                  src={ebook.cover_image}
                  alt={ebook.title}
                  className="w-16 h-20 object-cover rounded-lg shadow-sm border border-emerald-200 flex-shrink-0"
                />
              ) : (
                <div className="w-16 h-20 bg-emerald-200 rounded-lg flex items-center justify-center text-emerald-700 flex-shrink-0">
                  <BookOpen className="w-8 h-8" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-gray-800 text-sm sm:text-base line-clamp-1 mb-1">{ebook.title}</h2>
                <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{ebook.description}</p>
              </div>
            </div>
          )}

          {/* ปุ่มดาวน์โหลดสีเขียว */}
          <button
            type="button"
            onClick={() => {
              alert(`📥 เริ่มดาวน์โหลดหนังสือ "${ebook?.title || 'E-Book'}" (PDF) ลงเครื่องของคุณแล้ว!`)
            }}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-3.5 px-6 rounded-2xl font-bold text-base shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 mb-4 cursor-pointer"
          >
            <Download className="w-5 h-5" />
            ดาวน์โหลดหนังสือ (PDF)
          </button>

          {/* ปุ่มกลับหน้าร้าน */}
          <a
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-emerald-800 font-medium hover:text-emerald-950 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            กลับสู่หน้าร้านค้า GusSo Store
          </a>
        </div>
      </main>
    )
  }

  // ==========================================
  // กรณีผิดพลาด: หน้าสีแดง เตือนให้ใส่อีเมลที่ถูกต้อง
  // ==========================================
  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-600 via-red-700 to-red-800 flex items-center justify-center p-4 relative overflow-hidden">
      {/* แสงเอฟเฟกต์ตกแต่งพื้นหลังสีแดง */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-rose-400/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-red-400/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-lg w-full bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 border border-red-200 text-center relative z-10 transition-all">
        
        {/* ไอคอนแจ้งเตือนสีแดง */}
        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
          <AlertTriangle className="w-12 h-12 stroke-[2.5]" />
        </div>

        {/* ข้อความหลักตามสถานะ */}
        <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full mb-3 ${
          accessDenialReason === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
        }`}>
          {accessDenialReason === 'pending' ? '🔒 คำสั่งซื้อยังไม่ยืนยัน' :
           accessDenialReason === 'cancelled' ? '❌ คำสั่งซื้อถูกยกเลิก' :
           '✕ ตรวจสอบสิทธิ์ไม่ผ่าน'}
        </span>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-red-700 mb-3">
          {accessDenialReason === 'pending' ? 'คำสั่งซื้อยังไม่ยืนยัน ไม่สามารถดาวน์โหลดได้' :
           accessDenialReason === 'cancelled' ? 'คำสั่งซื้อถูกยกเลิกแล้ว' :
           'กรุณาใส่เมล์ที่ถูกต้องก่อนการดาวน์โหลด'}
        </h1>

        {userEmail ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 text-left">
            <p className="text-xs text-red-800 mb-1">
              อีเมลที่คุณเข้าสู่ระบบอยู่ตอนนี้:
            </p>
            <p className="text-sm font-bold text-red-900 mb-2">
              {userEmail}
            </p>
            <p className="text-xs text-red-700 leading-relaxed">
              {accessDenialReason === 'pending' ? (
                <span>⚠️ <strong>คำสั่งซื้อยังไม่ยืนยัน (สถานะ: รอชำระ):</strong> ตามข้อกำหนดระบบ คำสั่งซื้อที่ยังไม่ยืนยันจะไม่สามารถเปิดลิงก์ดาวน์โหลดได้ กรุณาชำระเงินและรอผู้ดูแลร้าน (Admin) ตรวจสอบและกดยืนยันคำสั่งซื้อเพื่อปลดล็อคสิทธิ์ดาวน์โหลด</span>
              ) : accessDenialReason === 'cancelled' ? (
                <span>❌ <strong>คำสั่งซื้อถูกยกเลิก:</strong> รายการคำสั่งซื้อหนังสือเล่มนี้ถูกยกเลิกแล้ว จึงไม่สามารถเข้าถึงไฟล์ดาวน์โหลดได้</span>
              ) : (
                <span>❌ ไม่พบประวัติการสั่งซื้อหนังสือเล่มนี้ด้วยอีเมลนี้ กรุณาสลับไปเข้าสู่ระบบด้วยอีเมลที่คุณใช้ตอนสั่งซื้อ</span>
              )}
            </p>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 text-left">
            <p className="text-xs text-red-800 leading-relaxed">
              ⚠️ คุณยังไม่ได้เข้าสู่ระบบ กรุณาเข้าสู่ระบบด้วยอีเมลที่ใช้สั่งซื้อหนังสือเล่มนี้เพื่อดาวน์โหลด
            </p>
          </div>
        )}

        {/* ปุ่มสลับบัญชี / เข้าสู่ระบบ */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleSwitchAccount}
            className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white py-3.5 px-6 rounded-2xl font-bold text-sm sm:text-base shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            เข้าสู่ระบบด้วยอีเมลที่ถูกต้อง
          </button>

          <a
            href="/"
            className="w-full inline-flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-2xl font-medium text-sm transition"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับสู่หน้าร้านค้า
          </a>
        </div>
      </div>
    </main>
  )
}

export default function DownloadPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        กำลังโหลด...
      </div>
    }>
      <DownloadContent />
    </Suspense>
  )
}