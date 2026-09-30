'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Download, ShoppingBag, CheckCircle, BookOpen, Lock, Clock } from 'lucide-react'

type PurchaseItem = {
  purchase_id: number | string
  ebook_id: number
  purchased_at: string
  title?: string
  price?: number
  cover_image?: string
  author?: string
  status: 'ยืนยันแล้ว' | 'รอชำระ' | 'ยกเลิก'
}

export default function OrdersPage() {
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [purchases, setPurchases] = useState<PurchaseItem[]>([])

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      setLoading(false)
      return
    }

    const email = (session.user.email || '').trim().toLowerCase()
    setUserEmail(email)

    try {
      // 1. ดึงข้อมูลคำสั่งซื้อจาก orders พร้อม order_items
      const { data: ordersData } = await supabase
        .from('orders')
        .select(`
          order_id,
          total_amount,
          status,
          created_at,
          order_items (
            ebook_id,
            unit_price
          )
        `)
        .ilike('customer_email', email)
        .order('created_at', { ascending: false })

      // 2. ดึงข้อมูลจาก purchases (ที่เคยซื้อสำเร็จ)
      const { data: purchaseData } = await supabase
        .from('purchases')
        .select('*')
        .ilike('user_email', email)
        .order('purchase_id', { ascending: false })

      // รวบรวม ebook_id ทั้งหมดเพื่อดึงรายละเอียดหนังสือ
      const allEbookIds = new Set<number>()
      ;(ordersData || []).forEach(o => {
        (o.order_items || []).forEach((item: any) => allEbookIds.add(Number(item.ebook_id)))
      })
      ;(purchaseData || []).forEach(p => allEbookIds.add(Number(p.ebook_id)))

      const { data: booksData } = await supabase
        .from('ebooks')
        .select('*')
        .in('ebook_id', Array.from(allEbookIds))

      const bookMap = new Map((booksData || []).map(b => [b.ebook_id, b]))

      const mergedList: PurchaseItem[] = []
      const processedKeys = new Set<string>()

      // นำเข้ารายการจาก orders ก่อน (เพื่อรักษาสถานะ 'ยืนยันแล้ว', 'รอชำระ', 'ยกเลิก')
      if (ordersData && ordersData.length > 0) {
        for (const ord of ordersData) {
          const ordStatus = (ord.status as any) || 'ยืนยันแล้ว'
          for (const it of (ord.order_items || [])) {
            const b = bookMap.get(it.ebook_id)
            const key = `${ord.order_id}-${it.ebook_id}`
            processedKeys.add(key)
            mergedList.push({
              purchase_id: ord.order_id,
              ebook_id: it.ebook_id,
              purchased_at: ord.created_at,
              title: b?.title || `E-Book รหัส #${it.ebook_id}`,
              price: it.unit_price || b?.price || 290,
              cover_image: b?.cover_image,
              author: b?.author || 'ทีมวิชาการ GusSo',
              status: ordStatus
            })
          }
        }
      }

      // นำเข้ารายการจาก purchases (ที่ยังไม่ซ้ำ)
      if (purchaseData && purchaseData.length > 0) {
        for (const p of purchaseData) {
          const hasAlready = mergedList.some(m => m.ebook_id === p.ebook_id && m.status === 'ยืนยันแล้ว')
          if (!hasAlready) {
            const b = bookMap.get(p.ebook_id)
            mergedList.push({
              purchase_id: p.purchase_id,
              ebook_id: p.ebook_id,
              purchased_at: p.purchased_at || new Date().toISOString(),
              title: b?.title || `E-Book รหัส #${p.ebook_id}`,
              price: b?.price || 290,
              cover_image: b?.cover_image,
              author: b?.author || 'ทีมวิชาการ GusSo',
              status: 'ยืนยันแล้ว'
            })
          }
        }
      }

      setPurchases(mergedList)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-3"></div>
        <p className="text-gray-500 font-medium text-sm">กำลังโหลดประวัติคำสั่งซื้อ...</p>
      </main>
    )
  }

  // กรณีไม่ได้เข้าสู่ระบบ
  if (!userEmail) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-gray-100 text-center">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
            🛍️
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">กรุณาเข้าสู่ระบบก่อน</h1>
          <p className="text-sm text-gray-600 mb-6">คุณต้องเข้าสู่ระบบเพื่อดูประวัติคำสั่งซื้อและดาวน์โหลดหนังสือของคุณ</p>
          <div className="space-y-3">
            <Link
              href="/login"
              className="w-full block bg-indigo-600 text-white py-3 rounded-xl font-medium text-sm hover:bg-indigo-700 transition"
            >
              🔐 ไปยังหน้าเข้าสู่ระบบ
            </Link>
            <Link
              href="/"
              className="w-full block bg-gray-100 text-gray-600 py-3 rounded-xl font-medium text-sm hover:bg-gray-200 transition"
            >
              ← กลับสู่หน้าร้านค้า
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10 px-6 py-4 border-b border-gray-100">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition"
              title="กลับหน้าร้าน"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-indigo-600" />
              ประวัติคำสั่งซื้อของฉัน
            </h1>
          </div>
          <p className="text-xs text-gray-500 hidden sm:block">
            บัญชี: <span className="font-semibold text-gray-800">{userEmail}</span>
          </p>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {purchases.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
              📭
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">ยังไม่มีประวัติการสั่งซื้อหนังสือ</h3>
            <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
              คุณยังไม่เคยสั่งซื้อ E-Book เล่มใดในระบบ สามารถเลือกชมหนังสือคุณภาพในหน้าร้านค้าได้ทันที
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition shadow-sm"
            >
              🛒 ไปยังหน้าร้านเพื่อเลือกซื้อหนังสือ
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm font-medium text-gray-600">
                รายการหนังสือที่สั่งซื้อแล้วทั้งหมด ({purchases.length} รายการ)
              </p>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                สถานะ: ยืนยันการสั่งซื้อแล้ว
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {purchases.map((item) => (
                <div
                  key={item.purchase_id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:shadow-md transition"
                >
                  <div className="flex items-center gap-4">
                    {item.cover_image ? (
                      <img
                        src={item.cover_image}
                        alt={item.title}
                        className="w-16 h-20 object-cover rounded-xl shadow-sm border flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-20 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 border border-indigo-100">
                        <BookOpen className="w-8 h-8" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-mono text-gray-400">
                          รหัสการซื้อ #{item.purchase_id} • วันที่ {new Date(item.purchased_at).toLocaleDateString('th-TH')}
                        </span>
                        {item.status === 'ยืนยันแล้ว' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <CheckCircle className="w-3 h-3 text-emerald-600" /> ยืนยันแล้ว
                          </span>
                        ) : item.status === 'รอชำระ' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                            <Clock className="w-3 h-3 text-amber-600" /> รอชำระเงิน
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                            ✕ ยกเลิก
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-gray-900 text-base mb-1">
                        {item.title}
                      </h3>
                      <p className="text-xs text-indigo-600 font-medium">
                        ✍️ {item.author}
                      </p>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 pt-3 sm:pt-0 border-t sm:border-0 border-gray-100">
                    <span className="text-lg font-extrabold text-emerald-600">
                      ฿{Number(item.price).toFixed(2)}
                    </span>
                    {item.status === 'ยืนยันแล้ว' ? (
                      <Link
                        href={`/download?ebook_id=${item.ebook_id}`}
                        className="inline-flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition hover:scale-105 active:scale-95"
                      >
                        <Download className="w-3.5 h-3.5" />
                        ดาวน์โหลด E-Book
                      </Link>
                    ) : item.status === 'รอชำระ' ? (
                      <div className="text-right">
                        <button
                          disabled
                          className="inline-flex items-center gap-1.5 bg-gray-100 border border-gray-200 text-gray-500 px-3.5 py-2 rounded-xl text-xs font-bold cursor-not-allowed shadow-none"
                          title="คำสั่งซื้อที่ยังไม่ยืนยันไม่สามารถเปิดลิงก์ดาวน์โหลดได้"
                        >
                          <Lock className="w-3.5 h-3.5 text-amber-500" />
                          <span>🔒 รอแอดมินยืนยัน (ล็อค)</span>
                        </button>
                        <span className="block text-[10px] text-amber-600 mt-1">ยังไม่สามารถดาวน์โหลดได้</span>
                      </div>
                    ) : (
                      <button
                        disabled
                        className="inline-flex items-center gap-1.5 bg-gray-100 border border-gray-200 text-gray-400 px-3.5 py-2 rounded-xl text-xs font-bold cursor-not-allowed shadow-none"
                      >
                        <span>🚫 ยกเลิกคำสั่งซื้อ</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
