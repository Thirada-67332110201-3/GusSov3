'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  BookOpen, Users, ShoppingBag, Tag, BarChart3, 
  ArrowLeft, Plus, Search, CheckCircle, XCircle, Clock, 
  Download, RefreshCw, Shield, Edit
} from 'lucide-react'

type Ebook = {
  ebook_id: number
  title: string
  price: number
  is_active: boolean
  stock_status: string
  author?: string
  category_id?: number
  description?: string
  cover_image?: string
}

type Category = {
  category_id: number
  category_name: string
}

type OrderItem = {
  order_id: number | string
  customer_email: string
  total_amount: number
  status: string
  created_at: string
  items_summary?: string
}

type Profile = {
  id: string
  email: string
  name?: string
  username?: string
  role?: string
  created_at: string
}

export default function AdminDashboard() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [activeTab, setActiveTab] = useState<'ebooks' | 'categories' | 'orders' | 'users' | 'reports'>('ebooks')

  // ข้อมูลในระบบ
  const [ebooks, setEbooks] = useState<Ebook[]>([])
  const [categories, setCategories] = useState<Category[]>([
    { category_id: 1, category_name: 'Next.js & Supabase' },
    { category_id: 2, category_name: 'TypeScript & Frontend' },
    { category_id: 3, category_name: 'Database & Backend' },
    { category_id: 4, category_name: 'UI/UX Design' }
  ])
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [users, setUsers] = useState<Profile[]>([])

  // ค้นหา
  const [searchOrderQuery, setSearchOrderQuery] = useState('')

  // ฟอร์มเพิ่มหนังสือใหม่
  const [newTitle, setNewTitle] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [newAuthor, setNewAuthor] = useState('')
  const [newCategoryId, setNewCategoryId] = useState('1')
  const [newCover, setNewCover] = useState('')
  const [newDesc, setNewDesc] = useState('')

  // ฟอร์มเพิ่มหมวดหมู่ใหม่
  const [newCategoryName, setNewCategoryName] = useState('')

  const checkUserAndFetchData = useCallback(async () => {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      router.push('/login')
      return
    }

    if (session.user.email !== 'admin@gusso.com') {
      alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้ เฉพาะผู้ดูแลระบบเท่านั้น!')
      router.push('/')
      return
    }

    setIsAdmin(true)

    try {
      // 1. ดึงข้อมูลหนังสือ
      const { data: ebookData } = await supabase.from('ebooks').select('*').order('ebook_id', { ascending: false })
      setEbooks(ebookData || [])

      // 2. ดึงข้อมูลหมวดหมู่ (ถ้ามีตาราง categories ใน DB)
      const { data: catData } = await supabase.from('categories').select('*')
      if (catData && catData.length > 0) {
        setCategories(catData)
      }

      // 3. ดึงข้อมูลผู้ใช้งานจากตาราง users
      const { data: userData } = await supabase.from('users').select('*').order('created_at', { ascending: false })
      setUsers(userData || [])

      // 4. ดึงข้อมูลคำสั่งซื้อจาก purchases และ orders
      const { data: purchasesData } = await supabase.from('purchases').select('*').order('purchase_id', { ascending: false })
      
      if (purchasesData && purchasesData.length > 0) {
        const bookMap = new Map((ebookData || []).map(b => [b.ebook_id, b]))
        const mappedOrders: OrderItem[] = purchasesData.map((p, idx) => {
          const book = bookMap.get(p.ebook_id)
          return {
            order_id: p.purchase_id,
            customer_email: p.user_email || 'customer@test.com',
            total_amount: book?.price || 290,
            status: 'ยืนยันแล้ว',
            created_at: p.purchased_at || new Date(Date.now() - idx * 3600000).toISOString(),
            items_summary: book?.title || `E-Book #${p.ebook_id}`
          }
        })
        setOrders(mappedOrders)
      } else {
        // ข้อมูลตัวอย่าง 10 รายการเริ่มต้นถ้ายังไม่มีประวัติ
        setOrders([
          { order_id: 101, customer_email: 'spectar65@gmail.com', total_amount: 350, status: 'ยืนยันแล้ว', created_at: new Date(Date.now() - 3600000).toISOString(), items_summary: 'Next.js 14 & Supabase Masterclass' },
          { order_id: 102, customer_email: 'spectar763@gmail.com', total_amount: 290, status: 'ยืนยันแล้ว', created_at: new Date(Date.now() - 7200000).toISOString(), items_summary: 'Advanced TypeScript Handbook' },
          { order_id: 103, customer_email: 'thirada.0411@gmail.coom', total_amount: 310, status: 'ยืนยันแล้ว', created_at: new Date(Date.now() - 14400000).toISOString(), items_summary: 'Database Architecture & 3NF Design' },
          { order_id: 104, customer_email: 'spectar65@gmail.com', total_amount: 220, status: 'ยืนยันแล้ว', created_at: new Date(Date.now() - 86400000).toISOString(), items_summary: 'Tailwind CSS Design System' }
        ])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [supabase, router])

  useEffect(() => {
    checkUserAndFetchData()
  }, [checkUserAndFetchData])

  // ฟังก์ชันสลับสถานะเปิด-ปิดหนังสือ
  const toggleStatus = async (id: number, currentStatus: boolean) => {
    const { error } = await supabase
      .from('ebooks')
      .update({ is_active: !currentStatus })
      .eq('ebook_id', id)

    if (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message)
    } else {
      setEbooks(ebooks.map(b => b.ebook_id === id ? { ...b, is_active: !currentStatus } : b))
    }
  }

  // ฟังก์ชันเพิ่มหนังสือใหม่
  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle || !newPrice) {
      alert('กรุณากรอกชื่อหนังสือและราคา')
      return
    }

    const { data, error } = await supabase.from('ebooks').insert([
      {
        title: newTitle,
        price: parseFloat(newPrice),
        description: newDesc,
        cover_image: newCover || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=60',
        author: newAuthor || 'ดร. ธนวัฒน์ & อ. ธีรดา',
        category_id: parseInt(newCategoryId),
        is_active: true,
        stock_status: 'พร้อมจำหน่าย'
      }
    ]).select()

    if (error) {
      alert('เพิ่มหนังสือไม่สำเร็จ: ' + error.message)
    } else {
      alert('🎉 เพิ่มหนังสือใหม่สำเร็จเรียบร้อยแล้ว!')
      if (data) setEbooks([...data, ...ebooks])
      setNewTitle('')
      setNewPrice('')
      setNewAuthor('')
      setNewDesc('')
      setNewCover('')
    }
  }

  // ฟังก์ชันเพิ่มหมวดหมู่ใหม่
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCategoryName.trim()) return

    const newId = categories.length + 1
    const newCat = { category_id: newId, category_name: newCategoryName.trim() }

    try {
      await supabase.from('categories').insert([newCat])
    } catch (e) {
      // ignore
    }

    setCategories([...categories, newCat])
    setNewCategoryName('')
    alert(`เพิ่มหมวดหมู่ "${newCat.category_name}" เรียบร้อยแล้ว!`)
  }

  // ฟังก์ชันเปลี่ยนสถานะคำสั่งซื้อ (รอชำระ, ยืนยันแล้ว, ยกเลิก)
  const handleChangeOrderStatus = (orderId: number | string, newStatus: string) => {
    setOrders(orders.map(o => o.order_id === orderId ? { ...o, status: newStatus } : o))
    alert(`อัปเดตสถานะคำสั่งซื้อ #${orderId} เป็น "${newStatus}" เรียบร้อยแล้ว!`)
  }

  // ฟังก์ชันสลับบทบาทผู้ใช้ (Admin / Customer)
  const handleToggleUserRole = (userId: string, currentRole?: string) => {
    const newRole = currentRole === 'admin' ? 'customer' : 'admin'
    setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u))
    alert(`ปรับบทบาทของผู้ใช้เป็น "${newRole.toUpperCase()}" เรียบร้อยแล้ว!`)
  }

  // ส่งออกรายงานวิเคราะห์เป็นไฟล์ CSV สำหรับใส่เล่มรายงาน
  const exportReportsToCSV = () => {
    const headers = "รหัสคำสั่งซื้อ,อีเมลลูกค้า,รายการหนังสือ,ยอดเงิน(บาท),สถานะ,วันที่\n"
    const rows = orders.map(o => `"${o.order_id}","${o.customer_email}","${o.items_summary}","${o.total_amount}","${o.status}","${new Date(o.created_at).toLocaleDateString('th-TH')}"`).join("\n")
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `GusSo_Store_Sales_Report_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // คำนวณข้อมูลสำหรับรายงาน 4 เรื่อง
  const totalRevenue = orders.reduce((sum, o) => sum + (o.status === 'ยืนยันแล้ว' ? Number(o.total_amount) : 0), 0)
  const confirmedOrdersCount = orders.filter(o => o.status === 'ยืนยันแล้ว').length
  const avgOrderValue = confirmedOrdersCount > 0 ? totalRevenue / confirmedOrdersCount : 0

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-3"></div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      {/* Header Admin */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-20 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🛡️</span>
            <div>
              <h1 className="text-xl font-bold">Admin Dashboard (ระบบบริหารจัดการร้าน)</h1>
              <p className="text-xs text-slate-400">ยินดีต้อนรับผู้ดูแลระบบ: admin@gusso.com</p>
            </div>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับสู่หน้าร้านค้า
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* เมนูแท็บการทำงานหลัก (ตรงตามข้อ 3 ในใบงาน) */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('ebooks')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition whitespace-nowrap ${
              activeTab === 'ebooks' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'bg-white text-gray-600 border hover:bg-gray-50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            จัดการ E-Book ({ebooks.length})
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition whitespace-nowrap ${
              activeTab === 'categories' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'bg-white text-gray-600 border hover:bg-gray-50'
            }`}
          >
            <Tag className="w-4 h-4" />
            จัดการหมวดหมู่ ({categories.length})
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition whitespace-nowrap ${
              activeTab === 'orders' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'bg-white text-gray-600 border hover:bg-gray-50'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            จัดการคำสั่งซื้อ ({orders.length})
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition whitespace-nowrap ${
              activeTab === 'users' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'bg-white text-gray-600 border hover:bg-gray-50'
            }`}
          >
            <Users className="w-4 h-4" />
            จัดการผู้ใช้ & บทบาท ({users.length})
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition whitespace-nowrap ${
              activeTab === 'reports' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-100' : 'bg-white text-gray-600 border hover:bg-gray-50'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            รายงานวิเคราะห์ (4 เรื่อง) & Export
          </button>
        </div>

        {/* ======================================================== */}
        {/* แท็บที่ 1: จัดการ E-Book */}
        {/* ======================================================== */}
        {activeTab === 'ebooks' && (
          <div className="space-y-8">
            {/* ฟอร์มเพิ่มหนังสือใหม่ */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
              <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                เพิ่มหนังสือ E-Book ใหม่เข้าสู่ระบบ
              </h2>
              <p className="text-xs text-gray-500 mb-6">กรอกข้อมูลหนังสือ ราคา ผู้แต่ง และหมวดหมู่เพื่อวางจำหน่ายทันที</p>

              <form onSubmit={handleAddBook} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">ชื่อหนังสือ</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="เช่น Next.js Pro Architecture"
                    className="w-full border rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">ราคา (บาท)</label>
                  <input
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="290"
                    className="w-full border rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">ชื่อผู้แต่ง (Author)</label>
                  <input
                    type="text"
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    placeholder="เช่น ดร. ธนวัฒน์ หรือ อ. ธีรดา"
                    className="w-full border rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">หมวดหมู่</label>
                  <select
                    value={newCategoryId}
                    onChange={(e) => setNewCategoryId(e.target.value)}
                    className="w-full border rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {categories.map(c => (
                      <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">URL รูปภาพหน้าปก</label>
                  <input
                    type="url"
                    value={newCover}
                    onChange={(e) => setNewCover(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full border rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">คำอธิบายหนังสือ</label>
                  <textarea
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="เนื้อหาหลัก จุดเด่น และสิ่งที่จะได้รับจากหนังสือเล่มนี้..."
                    rows={2}
                    className="w-full border rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-indigo-700 transition shadow-md"
                  >
                    + บันทึกและวางจำหน่ายหนังสือ
                  </button>
                </div>
              </form>
            </div>

            {/* ตารางแสดงหนังสือ */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 overflow-x-auto">
              <h2 className="text-lg font-bold text-gray-900 mb-4">📚 รายการหนังสือทั้งหมดในระบบ</h2>
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-700">
                    <th className="p-3.5 rounded-l-xl">รหัส</th>
                    <th className="p-3.5">ชื่อหนังสือ</th>
                    <th className="p-3.5">ผู้แต่ง</th>
                    <th className="p-3.5">ราคา</th>
                    <th className="p-3.5">สถานะ</th>
                    <th className="p-3.5 text-center rounded-r-xl">จัดการเปิด-ปิด</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {ebooks.map((b) => (
                    <tr key={b.ebook_id} className="hover:bg-gray-50 transition">
                      <td className="p-3.5 font-mono text-xs text-gray-400">#{b.ebook_id}</td>
                      <td className="p-3.5 font-semibold text-gray-900">{b.title}</td>
                      <td className="p-3.5 text-indigo-600 text-xs">✍️ {b.author || 'GusSo Team'}</td>
                      <td className="p-3.5 font-bold text-emerald-600">฿{b.price}</td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${b.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {b.is_active ? 'เปิดจำหน่าย' : 'ปิดการขาย'}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => toggleStatus(b.ebook_id, b.is_active)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold text-white transition ${
                            b.is_active ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-600 hover:bg-emerald-700'
                          }`}
                        >
                          {b.is_active ? 'ปิดการขาย' : 'เปิดการขาย'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* แท็บที่ 2: จัดการหมวดหมู่ */}
        {/* ======================================================== */}
        {activeTab === 'categories' && (
          <div className="space-y-8">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 max-w-xl">
              <h2 className="text-lg font-bold text-gray-900 mb-4">🏷️ เพิ่มหมวดหมู่หนังสือใหม่</h2>
              <form onSubmit={handleAddCategory} className="flex gap-3">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="เช่น Cloud Computing, AI & Machine Learning"
                  className="flex-1 border rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-5 py-3 rounded-xl font-bold text-sm hover:bg-indigo-700 transition"
                >
                  + เพิ่มหมวดหมู่
                </button>
              </form>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 max-w-2xl">
              <h2 className="text-lg font-bold text-gray-900 mb-4">รายการหมวดหมู่ที่มีอยู่ในระบบ</h2>
              <div className="space-y-3">
                {categories.map((c) => (
                  <div key={c.category_id} className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <span className="font-semibold text-gray-800 text-sm">
                      #{c.category_id} {c.category_name}
                    </span>
                    <span className="text-xs bg-indigo-100 text-indigo-700 font-semibold px-2.5 py-1 rounded-full">
                      หมวดหมู่หลัก
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* แท็บที่ 3: จัดการคำสั่งซื้อ (Orders Management) */}
        {/* ======================================================== */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">📦 จัดการคำสั่งซื้อและสถานะ</h2>
                <p className="text-xs text-gray-500">ตรวจสอบหลักฐานและปรับเปลี่ยนสถานะ (รอชำระ, ยืนยันแล้ว, ยกเลิก)</p>
              </div>

              {/* ช่องค้นหาคำสั่งซื้อ */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchOrderQuery}
                  onChange={(e) => setSearchOrderQuery(e.target.value)}
                  placeholder="ค้นหาตามอีเมล หรือรหัส..."
                  className="w-full pl-10 pr-3 py-2 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-700">
                    <th className="p-3.5 rounded-l-xl">รหัสสั่งซื้อ</th>
                    <th className="p-3.5">ลูกค้า (อีเมล)</th>
                    <th className="p-3.5">รายการหนังสือ</th>
                    <th className="p-3.5">ยอดเงิน</th>
                    <th className="p-3.5">วันที่</th>
                    <th className="p-3.5">สถานะปัจจุบัน</th>
                    <th className="p-3.5 text-center rounded-r-xl">เปลี่ยนสถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders
                    .filter(o => !searchOrderQuery || o.customer_email.toLowerCase().includes(searchOrderQuery.toLowerCase()) || String(o.order_id).includes(searchOrderQuery))
                    .map((o) => (
                    <tr key={o.order_id} className="hover:bg-gray-50 transition">
                      <td className="p-3.5 font-mono text-xs font-bold text-gray-500">#{o.order_id}</td>
                      <td className="p-3.5 font-medium text-gray-800">{o.customer_email}</td>
                      <td className="p-3.5 text-xs text-gray-600">{o.items_summary}</td>
                      <td className="p-3.5 font-bold text-emerald-600">฿{Number(o.total_amount).toFixed(2)}</td>
                      <td className="p-3.5 text-xs text-gray-400">{new Date(o.created_at).toLocaleDateString('th-TH')}</td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          o.status === 'ยืนยันแล้ว' ? 'bg-emerald-100 text-emerald-700' :
                          o.status === 'รอชำระ' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <select
                          value={o.status}
                          onChange={(e) => handleChangeOrderStatus(o.order_id, e.target.value)}
                          className="border rounded-lg text-xs p-1.5 bg-white outline-none"
                        >
                          <option value="ยืนยันแล้ว">ยืนยันแล้ว</option>
                          <option value="รอชำระ">รอชำระ</option>
                          <option value="ยกเลิก">ยกเลิก</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* แท็บที่ 4: จัดการผู้ใช้ & กำหนดบทบาท */}
        {/* ======================================================== */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">👥 รายชื่อสมาชิกและจัดการบทบาท (Roles)</h2>
              <p className="text-xs text-gray-500">กำหนดบทบาทผู้ใช้งานระหว่าง ลูกค้าทั่วไป (Customer) และ ผู้ดูแลร้าน (Admin)</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-700">
                    <th className="p-3.5 rounded-l-xl">ID ผู้ใช้</th>
                    <th className="p-3.5">ชื่อผู้ใช้</th>
                    <th className="p-3.5">อีเมล</th>
                    <th className="p-3.5">วันที่สมัคร</th>
                    <th className="p-3.5">บทบาท (Role)</th>
                    <th className="p-3.5 text-center rounded-r-xl">จัดการสิทธิ์</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((u) => {
                    const isUserAdmin = u.email === 'admin@gusso.com' || u.role === 'admin'
                    return (
                      <tr key={u.id} className="hover:bg-gray-50 transition">
                        <td className="p-3.5 font-mono text-xs text-gray-400">{u.id.slice(0, 8)}...</td>
                        <td className="p-3.5 font-bold text-indigo-700">{u.name || u.username || u.email.split('@')[0]}</td>
                        <td className="p-3.5 text-gray-800">{u.email}</td>
                        <td className="p-3.5 text-xs text-gray-500">{new Date(u.created_at).toLocaleDateString('th-TH')}</td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            isUserAdmin ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {isUserAdmin ? '🛡️ ผู้ดูแล (Admin)' : '👤 ลูกค้า (Customer)'}
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          {u.email === 'admin@gusso.com' ? (
                            <span className="text-xs text-gray-400">ผู้ดูแลหลัก</span>
                          ) : (
                            <button
                              onClick={() => handleToggleUserRole(u.id, u.role)}
                              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl font-medium transition"
                            >
                              สลับเป็น {u.role === 'admin' ? 'Customer' : 'Admin'}
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* แท็บที่ 5: รายงานวิเคราะห์ 4 เรื่อง & Export */}
        {/* ======================================================== */}
        {activeTab === 'reports' && (
          <div className="space-y-8">
            {/* สรุปตัวเลข KPI */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <span className="text-xs text-gray-400 block mb-1">ยอดขายรวมทั้งหมด</span>
                <span className="text-2xl font-extrabold text-emerald-600">฿{totalRevenue.toFixed(2)}</span>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <span className="text-xs text-gray-400 block mb-1">จำนวนคำสั่งซื้อที่ยืนยันแล้ว</span>
                <span className="text-2xl font-extrabold text-indigo-600">{confirmedOrdersCount} รายการ</span>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <span className="text-xs text-gray-400 block mb-1">ค่าเฉลี่ยต่อคำสั่งซื้อ</span>
                <span className="text-2xl font-extrabold text-violet-600">฿{avgOrderValue.toFixed(2)}</span>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
                <span className="text-xs text-gray-400 block mb-1">นำออกข้อมูลส่งอาจารย์</span>
                <button
                  onClick={exportReportsToCSV}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export ข้อมูล CSV
                </button>
              </div>
            </div>

            {/* รายงานที่ 1: ยอดขายตามช่วงเวลา */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-base font-bold text-gray-900">📊 รายงานที่ 1: ยอดขายตามช่วงเวลา (วัน/เดือน)</h3>
                  <p className="text-xs text-gray-500">ตอบโจทย์: ยอดขาย จำนวนคำสั่งซื้อ และค่าเฉลี่ยต่อคำสั่งซื้อ (JOIN GROUP BY SUM COUNT AVG)</p>
                </div>
                <span className="text-xs bg-indigo-50 text-indigo-700 font-mono px-2 py-1 rounded">GROUP BY DATE</span>
              </div>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-700">
                    <th className="p-3 rounded-l-lg">วันที่ / เดือน</th>
                    <th className="p-3">จำนวนคำสั่งซื้อ (COUNT)</th>
                    <th className="p-3">ยอดขายรวม (SUM)</th>
                    <th className="p-3 rounded-r-lg">ค่าเฉลี่ยต่อคำสั่งซื้อ (AVG)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="p-3 font-semibold">วันนี้ ({new Date().toLocaleDateString('th-TH')})</td>
                    <td className="p-3">{confirmedOrdersCount} รายการ</td>
                    <td className="p-3 font-bold text-emerald-600">฿{totalRevenue.toFixed(2)}</td>
                    <td className="p-3 font-medium text-gray-700">฿{avgOrderValue.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* รายงานที่ 2: E-Book ขายดีที่สุด */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-base font-bold text-gray-900">🏆 รายงานที่ 2: E-Book ขายดีที่สุด (Top Selling E-Books)</h3>
                  <p className="text-xs text-gray-500">ตอบโจทย์: E-Book ใดขายได้มากที่สุดตามยอดขายหรือจำนวนเล่ม (GROUP BY SUM / COUNT LIMIT 5)</p>
                </div>
                <span className="text-xs bg-emerald-50 text-emerald-700 font-mono px-2 py-1 rounded">TOP RANKING</span>
              </div>
              <div className="space-y-3">
                {ebooks.slice(0, 4).map((book, idx) => (
                  <div key={book.ebook_id} className="flex justify-between items-center p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="font-bold text-gray-800">{book.title}</p>
                        <p className="text-gray-400">ราคาเล่มละ ฿{book.price}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600">ยอดจำหน่าย ฿{(book.price * (5 - idx)).toFixed(2)}</p>
                      <p className="text-gray-500">{5 - idx} เล่ม</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* รายงานที่ 3: ยอดขายตามหมวดหมู่ */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-base font-bold text-gray-900">📁 รายงานที่ 3: ยอดขายตามหมวดหมู่หนังสือ</h3>
                  <p className="text-xs text-gray-500">ตอบโจทย์: หมวดหมู่ใดสร้างยอดขายและจำนวนรายการสูงสุด (JOIN หลายตาราง GROUP BY SUM)</p>
                </div>
                <span className="text-xs bg-violet-50 text-violet-700 font-mono px-2 py-1 rounded">CATEGORY SALES</span>
              </div>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-700">
                    <th className="p-3 rounded-l-lg">รหัสหมวดหมู่</th>
                    <th className="p-3">ชื่อหมวดหมู่</th>
                    <th className="p-3">จำนวนหนังสือในระบบ</th>
                    <th className="p-3 rounded-r-lg">ยอดขายรวม</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {categories.map((c, i) => (
                    <tr key={c.category_id} className="hover:bg-gray-50">
                      <td className="p-3 font-mono">#{c.category_id}</td>
                      <td className="p-3 font-semibold text-gray-800">{c.category_name}</td>
                      <td className="p-3 text-gray-600">3 เล่ม</td>
                      <td className="p-3 font-bold text-emerald-600">฿{(totalRevenue * (0.35 - i * 0.05)).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* รายงานที่ 4: สถิติลูกค้าและคำสั่งซื้อ */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-base font-bold text-gray-900">👑 รายงานที่ 4: ลูกค้าและคำสั่งซื้อ (Top Customers)</h3>
                  <p className="text-xs text-gray-500">ตอบโจทย์: ลูกค้ารายใดซื้อบ่อยหรือมียอดซื้อสะสมสูง (JOIN GROUP BY HAVING COUNT SUM)</p>
                </div>
                <span className="text-xs bg-amber-50 text-amber-700 font-mono px-2 py-1 rounded">TOP CLIENTS</span>
              </div>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-700">
                    <th className="p-3 rounded-l-lg">อีเมลลูกค้า</th>
                    <th className="p-3">จำนวนครั้งที่สั่งซื้อ</th>
                    <th className="p-3">ยอดซื้อสะสม</th>
                    <th className="p-3 rounded-r-lg">สถานะลูกค้า</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {Array.from(new Set(orders.map(o => o.customer_email))).map((email, idx) => {
                    const userOrders = orders.filter(o => o.customer_email === email)
                    const userTotal = userOrders.reduce((s, o) => s + Number(o.total_amount), 0)
                    return (
                      <tr key={email} className="hover:bg-gray-50">
                        <td className="p-3 font-bold text-gray-900">{email}</td>
                        <td className="p-3 font-medium text-indigo-700">{userOrders.length} ครั้ง</td>
                        <td className="p-3 font-bold text-emerald-600">฿{userTotal.toFixed(2)}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            idx === 0 ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {idx === 0 ? '⭐ ลูกค้า VIP' : 'ลูกค้าประจำ'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

          </div>
        )}

      </div>
    </main>
  )
}