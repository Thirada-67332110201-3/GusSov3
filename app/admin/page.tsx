'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Ebook = {
  ebook_id: number
  title: string
  price: number
  is_active: boolean
  stock_status: string
}

type Profile = {
  id: string
  email: string
  name?: string
  username?: string
  created_at: string
}

export default function AdminDashboard() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [ebooks, setEbooks] = useState<Ebook[]>([])
  const [users, setUsers] = useState<Profile[]>([])
  const [activeTab, setActiveTab] = useState<'ebooks' | 'users'>('ebooks')

  // ฟอร์มเพิ่มหนังสือใหม่
  const [newTitle, setNewTitle] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [newDesc, setNewDesc] = useState('')

  const checkUserAndFetchData = useCallback(async () => {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      router.push('/login')
      return
    }

    // ตรวจสอบว่าเป็นแอดมินตามอีเมลที่กำหนดหรือไม่
    if (session.user.email !== 'admin@gusso.com') {
      alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้ เฉพาะผู้ดูแลระบบเท่านั้น!')
      router.push('/')
      return
    }

    setIsAdmin(true)

    // ดึงข้อมูลหนังสือ
    const { data: ebookData } = await supabase.from('ebooks').select('*').order('ebook_id', { ascending: false })
    setEbooks(ebookData || [])

    // ดึงข้อมูลผู้ใช้งานจากตาราง auth ผ่าน view users
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
    setUsers(userData || [])

    setLoading(false)
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

  // ฟังก์ชันเพิ่มหนังสือใหม่จากหลังบ้าน
  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle || !newPrice) {
      alert('กรุณากรอกชื่อหนังสือและราคา')
      return
    }

    const { error } = await supabase.from('ebooks').insert([
      {
        title: newTitle,
        price: parseFloat(newPrice),
        description: newDesc,
        is_active: true,
        stock_status: 'Ready'
      }
    ])

    if (error) {
      alert('เพิ่มหนังสือไม่สำเร็จ: ' + error.message)
    } else {
      alert('เพิ่มหนังสือสำเร็จ!')
      setNewTitle('')
      setNewPrice('')
      setNewDesc('')
      checkUserAndFetchData()
    }
  }

  if (loading) {
    return <div className="text-center py-20 text-gray-600">กำลังตรวจสอบสิทธิ์ผู้ดูแลระบบ...</div>
  }

  if (!isAdmin) return null

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-md p-8">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">🛡️ Admin Dashboard (ระบบหลังบ้าน)</h1>
            <p className="text-sm text-gray-500">ยินดีต้อนรับผู้ดูแลระบบ: admin@gusso.com</p>
          </div>
          <a href="/" className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700 transition">
            กลับสู่หน้าร้านค้า
          </a>
        </div>

        {/* Tab Menu */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('ebooks')}
            className={`px-5 py-2 rounded-lg font-medium transition ${activeTab === 'ebooks' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            📚 จัดการหนังสือ ({ebooks.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-5 py-2 rounded-lg font-medium transition ${activeTab === 'users' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            👥 รายชื่อผู้ใช้งานในระบบ ({users.length})
          </button>
        </div>

        {/* TAB 1: จัดการหนังสือ */}
        {activeTab === 'ebooks' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* ฟอร์มเพิ่มหนังสือ */}
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 h-fit">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">➕ เพิ่มหนังสือใหม่</h2>
              <form onSubmit={handleAddBook} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อหนังสือ</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full border rounded-lg p-2 text-sm"
                    placeholder="ระบุชื่อหนังสือ..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ราคา (บาท)</label>
                  <input
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full border rounded-lg p-2 text-sm"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">เรื่องย่อ / รายละเอียด</label>
                  <textarea
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full border rounded-lg p-2 text-sm"
                    rows={3}
                    placeholder="รายละเอียดหนังสือ..."
                  />
                </div>
                <button type="submit" className="w-full bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 transition font-medium text-sm">
                  บันทึกหนังสือลงระบบ
                </button>
              </form>
            </div>

            {/* ตารางแสดงรายการหนังสือ */}
            <div className="md:col-span-2 overflow-x-auto">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">📦 รายการหนังสือทั้งหมด</h2>
              <table className="w-full border-collapse bg-white border text-sm rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-gray-100 text-left text-gray-600">
                    <th className="p-3">ชื่อหนังสือ</th>
                    <th className="p-3">ราคา</th>
                    <th className="p-3">สถานะ</th>
                    <th className="p-3 text-center">จัดการเปิด-ปิด</th>
                  </tr>
                </thead>
                <tbody>
                  {ebooks.map((book) => (
                    <tr key={book.ebook_id} className="border-t hover:bg-gray-50">
                      <td className="p-3 font-medium text-gray-800">{book.title}</td>
                      <td className="p-3 text-green-600 font-bold">฿{book.price}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${book.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {book.is_active ? 'เปิดแสดงผล' : 'ปิดการขาย'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => toggleStatus(book.ebook_id, book.is_active)}
                          className={`px-3 py-1 rounded text-xs text-white font-medium transition ${book.is_active ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
                        >
                          {book.is_active ? 'ปิดการแสดงผล' : 'เปิดการแสดงผล'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: รายชื่อผู้ใช้งาน */}
        {activeTab === 'users' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">👥 รายชื่อสมาชิกที่สมัครใช้งานเว็บไซต์</h2>
            <table className="w-full border-collapse bg-white border text-sm rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-gray-100 text-left text-gray-600">
                  <th className="p-3">ID ผู้ใช้</th>
                  <th className="p-3">ชื่อผู้ใช้</th>
                  <th className="p-3">อีเมล</th>
                  <th className="p-3">วันที่สมัคร</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-gray-400">ยังไม่มีข้อมูลผู้ใช้งานในตาราง users</td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="border-t hover:bg-gray-50">
                      <td className="p-3 text-gray-500 font-mono text-xs">{u.id}</td>
                      <td className="p-3 font-semibold text-indigo-700">{u.name || u.username || u.email.split('@')[0]}</td>
                      <td className="p-3 font-medium text-gray-800">{u.email}</td>
                      <td className="p-3 text-gray-500">{new Date(u.created_at).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}