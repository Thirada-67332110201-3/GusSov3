'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, Download, ShoppingBag, CheckCircle, BookOpen, 
  Lock, Clock, Layers, Calendar, DollarSign, PackageCheck
} from 'lucide-react'
import { UNIQUE_EBOOKS_METADATA } from '@/lib/books-data'

type OrderBookItem = {
  ebook_id: number
  title: string
  price: number
  cover_image?: string
  author?: string
}

type OrderRecord = {
  order_id: number | string
  created_at: string
  total_amount: number
  status: 'ยืนยันแล้ว' | 'รอชำระ' | 'ยกเลิก'
  items: OrderBookItem[]
}

export default function OrdersPage() {
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [orders, setOrders] = useState<OrderRecord[]>([])
  const [viewMode, setViewMode] = useState<'orders' | 'books'>('orders')

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

      // 2. ดึงข้อมูลจาก purchases
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

      const groupedOrders: OrderRecord[] = []

      // 3. จัดกลุ่มตามคำสั่งซื้อ (Group by Order)
      if (ordersData && ordersData.length > 0) {
        for (const ord of ordersData) {
          const ordStatus = (ord.status as any) || 'ยืนยันแล้ว'
          const items: OrderBookItem[] = (ord.order_items || []).map((it: any) => {
            const b = bookMap.get(it.ebook_id)
            const meta = UNIQUE_EBOOKS_METADATA[it.ebook_id]
            return {
              ebook_id: it.ebook_id,
              title: meta?.title || b?.title || `E-Book รหัส #${it.ebook_id}`,
              price: it.unit_price || meta?.price || b?.price || 290,
              cover_image: meta?.cover_image || b?.cover_image || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80',
              author: meta?.author || b?.author || 'ทีมวิชาการ GusSo'
            }
          })

          groupedOrders.push({
            order_id: ord.order_id,
            created_at: ord.created_at,
            total_amount: Number(ord.total_amount),
            status: ordStatus,
            items
          })
        }
      }

      // 4. กรณีมีรายการใน purchases แต่ยังไม่ถูกผูกกับ orders (นำมาสร้างเป็นรายการยืนยันแล้ว)
      if (purchaseData && purchaseData.length > 0) {
        const existingEbookIds = new Set<number>()
        groupedOrders.forEach(o => {
          if (o.status === 'ยืนยันแล้ว') {
            o.items.forEach(it => existingEbookIds.add(it.ebook_id))
          }
        })

        const standalonePurchases = purchaseData.filter(p => !existingEbookIds.has(p.ebook_id))
        if (standalonePurchases.length > 0) {
          for (const p of standalonePurchases) {
            const b = bookMap.get(p.ebook_id)
            const meta = UNIQUE_EBOOKS_METADATA[p.ebook_id]
            groupedOrders.push({
              order_id: p.purchase_id,
              created_at: p.purchased_at || new Date().toISOString(),
              total_amount: meta?.price || b?.price || 290,
              status: 'ยืนยันแล้ว',
              items: [{
                ebook_id: p.ebook_id,
                title: meta?.title || b?.title || `E-Book รหัส #${p.ebook_id}`,
                price: meta?.price || b?.price || 290,
                cover_image: meta?.cover_image || b?.cover_image || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80',
                author: meta?.author || b?.author || 'ทีมวิชาการ GusSo'
              }]
            })
          }
        }
      }

      setOrders(groupedOrders)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // คำนวณสรุปภาพรวม
  const totalOrdersCount = orders.length
  const totalBooksCount = orders.reduce((sum, o) => sum + o.items.length, 0)
  const totalSpent = orders
    .filter(o => o.status === 'ยืนยันแล้ว')
    .reduce((sum, o) => sum + Number(o.total_amount), 0)

  // รายการหนังสือทั้งหมด (สำหรับแท็บคลังหนังสือ)
  const allPurchasedBooks = orders
    .filter(o => o.status === 'ยืนยันแล้ว')
    .flatMap(o => o.items)
    .filter((b, idx, arr) => arr.findIndex(t => t.ebook_id === b.ebook_id) === idx)

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
      <header className="bg-white shadow-xs sticky top-0 z-10 px-6 py-4 border-b border-gray-100">
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
        {/* แถบสรุปตัวเลข 3 ตัวชี้วัด */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xl">
              📦
            </div>
            <div>
              <span className="text-xs text-gray-400 block font-medium">สั่งซื้อทั้งหมด</span>
              <span className="text-xl font-extrabold text-gray-900">{totalOrdersCount} ครั้ง</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xl">
              📚
            </div>
            <div>
              <span className="text-xs text-gray-400 block font-medium">จำนวนหนังสือที่ซื้อ</span>
              <span className="text-xl font-extrabold text-gray-900">{totalBooksCount} เล่ม</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xl">
              💰
            </div>
            <div>
              <span className="text-xs text-gray-400 block font-medium">ยอดชำระสำเร็จสะสม</span>
              <span className="text-xl font-extrabold text-emerald-600">฿{totalSpent.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* ปุ่มสลับมุมมอง */}
        <div className="flex items-center justify-between gap-3 mb-6 bg-white p-2 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('orders')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === 'orders' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <PackageCheck className="w-4 h-4" />
              <span>แยกตามคำสั่งซื้อ ({totalOrdersCount} ครั้ง)</span>
            </button>
            <button
              onClick={() => setViewMode('books')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === 'books' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>คลังหนังสือพร้อมอ่าน ({allPurchasedBooks.length} เล่ม)</span>
            </button>
          </div>
        </div>

        {orders.length === 0 ? (
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
        ) : viewMode === 'orders' ? (
          /* ======================================================== */
          /* มุมมองที่ 1: จัดกลุ่มตามคำสั่งซื้อ (Orders History) */
          /* ======================================================== */
          <div className="space-y-5">
            {orders.map((ord) => (
              <div 
                key={ord.order_id} 
                className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition"
              >
                {/* Header ของแต่ละคำสั่งซื้อ */}
                <div className="p-5 bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-sm font-black text-indigo-700 bg-indigo-100/70 px-3 py-1 rounded-xl">
                      คำสั่งซื้อ #{ord.order_id}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(ord.created_at).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                    <span className="text-xs text-gray-400">• {ord.items.length} รายการ</span>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-right">
                      <span className="text-[11px] text-gray-400 block">ยอดรวมทั้งบิล</span>
                      <span className="text-base font-extrabold text-emerald-600">
                        ฿{ord.total_amount.toFixed(2)}
                      </span>
                    </div>

                    {ord.status === 'ยืนยันแล้ว' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full shadow-2xs">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        ยืนยันแล้ว
                      </span>
                    ) : ord.status === 'รอชำระ' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 px-3 py-1 rounded-full shadow-2xs">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        รอชำระเงิน
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-100 px-3 py-1 rounded-full shadow-2xs">
                        ✕ ยกเลิก
                      </span>
                    )}
                  </div>
                </div>

                {/* รายการหนังสือในคำสั่งซื้อนี้ */}
                <div className="divide-y divide-gray-50 p-5 space-y-4">
                  {ord.items.map((item) => (
                    <div 
                      key={`${ord.order_id}-${item.ebook_id}`} 
                      className="pt-4 first:pt-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-18 bg-gray-100 rounded-xl overflow-hidden shrink-0 shadow-xs border">
                          <img
                            src={item.cover_image}
                            alt={item.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80'
                            }}
                          />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm sm:text-base line-clamp-1 mb-1">
                            {item.title}
                          </h4>
                          <p className="text-xs text-indigo-600 font-medium">
                            ✍️ {item.author}
                          </p>
                          <span className="text-xs text-gray-500 font-bold block mt-1">
                            ฿{Number(item.price).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between gap-2 pt-2 sm:pt-0">
                        {ord.status === 'ยืนยันแล้ว' ? (
                          <Link
                            href={`/download?ebook_id=${item.ebook_id}`}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition hover:scale-105 active:scale-95 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            ดาวน์โหลด E-Book
                          </Link>
                        ) : ord.status === 'รอชำระ' ? (
                          <div className="text-right">
                            <button
                              disabled
                              className="inline-flex items-center gap-1.5 bg-gray-100 border border-gray-200 text-gray-400 px-3.5 py-2 rounded-xl text-xs font-bold cursor-not-allowed shadow-none"
                              title="คำสั่งซื้อที่ยังไม่ยืนยันไม่สามารถเปิดลิงก์ดาวน์โหลดได้"
                            >
                              <Lock className="w-3.5 h-3.5 text-amber-500" />
                              <span>🔒 รอแอดมินยืนยัน</span>
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
            ))}
          </div>
        ) : (
          /* ======================================================== */
          /* มุมมองที่ 2: คลังหนังสือทั้งหมด (My Library) */
          /* ======================================================== */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {allPurchasedBooks.map((book) => (
              <div 
                key={book.ebook_id}
                className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition"
              >
                <div>
                  <div className="h-44 rounded-2xl overflow-hidden bg-gray-100 mb-4 border">
                    <img
                      src={book.cover_image}
                      alt={book.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80'
                      }}
                    />
                  </div>
                  <h4 className="font-bold text-gray-900 text-sm line-clamp-1 mb-1">{book.title}</h4>
                  <p className="text-xs text-indigo-600 mb-3">✍️ {book.author}</p>
                </div>

                <Link
                  href={`/download?ebook_id=${book.ebook_id}`}
                  className="w-full inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-2.5 rounded-xl text-xs font-bold shadow-sm transition hover:scale-105 active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  อ่าน / ดาวน์โหลด E-Book
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
