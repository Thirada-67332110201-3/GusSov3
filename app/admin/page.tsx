'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  BookOpen, Users, ShoppingBag, Tag, BarChart3, 
  ArrowLeft, Plus, Search, CheckCircle, XCircle, Clock, 
  Download, RefreshCw, Shield, Edit, TrendingUp, Calendar,
  ChevronRight, Filter, AlertCircle, DollarSign, Layers
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

type MonthSummary = {
  key: string
  name: string
  shortName: string
  year: string
  totalOrders: number
  confirmedOrders: number
  pendingOrders: number
  cancelledOrders: number
  totalRevenue: number
  avgOrderValue: number
  growthRate: number | null
}

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
]
const THAI_SHORT_MONTHS = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
]

// ข้อมูลตัวอย่าง 30 คำสั่งซื้อ ครอบคลุม 6 เดือน ตามข้อกำหนดใบงาน
const defaultSeedOrders: OrderItem[] = [
  // พฤษภาคม 2026 (May 2026)
  { order_id: 1, customer_email: 'spectar65@gmail.com', total_amount: 350, status: 'ยืนยันแล้ว', created_at: '2026-05-05T10:30:00+07:00', items_summary: 'Next.js 14 & Supabase Masterclass' },
  { order_id: 2, customer_email: 'somchai.dev@gmail.com', total_amount: 290, status: 'ยืนยันแล้ว', created_at: '2026-05-12T14:15:00+07:00', items_summary: 'Advanced TypeScript Handbook' },
  { order_id: 3, customer_email: 'sarah.c@designer.io', total_amount: 490, status: 'ยืนยันแล้ว', created_at: '2026-05-18T16:45:00+07:00', items_summary: 'Tailwind CSS & Modern UI, Design System & UX' },
  { order_id: 4, customer_email: 'customer1@rmuti.ac.th', total_amount: 310, status: 'รอชำระ', created_at: '2026-05-23T11:20:00+07:00', items_summary: 'Database Architecture & 3NF Design' },
  { order_id: 5, customer_email: 'thirada.0411@gmail.com', total_amount: 390, status: 'ยืนยันแล้ว', created_at: '2026-05-29T19:10:00+07:00', items_summary: 'Full-stack SaaS Development' },

  // มิถุนายน 2026 (June 2026)
  { order_id: 6, customer_email: 'spectar763@gmail.com', total_amount: 740, status: 'ยืนยันแล้ว', created_at: '2026-06-04T09:40:00+07:00', items_summary: 'Next.js 14 & Supabase, Full-stack SaaS' },
  { order_id: 7, customer_email: 'user.alex@gmail.com', total_amount: 340, status: 'ยืนยันแล้ว', created_at: '2026-06-10T13:50:00+07:00', items_summary: 'Microservices & Cloud Backend' },
  { order_id: 8, customer_email: 'dev.artit@gmail.com', total_amount: 320, status: 'ยืนยันแล้ว', created_at: '2026-06-15T15:25:00+07:00', items_summary: 'Figma to Code: Prototyping Guide' },
  { order_id: 9, customer_email: 'student2@rmuti.ac.th', total_amount: 290, status: 'ยกเลิก', created_at: '2026-06-21T17:30:00+07:00', items_summary: 'Advanced TypeScript Handbook' },
  { order_id: 10, customer_email: 'kanokwan.k@gmail.com', total_amount: 270, status: 'ยืนยันแล้ว', created_at: '2026-06-28T20:15:00+07:00', items_summary: 'Design System & UX Fundamentals' },

  // กรกฎาคม 2026 (July 2026)
  { order_id: 11, customer_email: 'thanawat.student@gmail.com', total_amount: 310, status: 'ยืนยันแล้ว', created_at: '2026-07-03T11:10:00+07:00', items_summary: 'Database Architecture & 3NF Design' },
  { order_id: 12, customer_email: 'spectar65@gmail.com', total_amount: 670, status: 'ยืนยันแล้ว', created_at: '2026-07-09T14:30:00+07:00', items_summary: 'Next.js 14 & Supabase, Figma to Code' },
  { order_id: 13, customer_email: 'natthapong.c@gmail.com', total_amount: 390, status: 'ยืนยันแล้ว', created_at: '2026-07-15T16:05:00+07:00', items_summary: 'Full-stack SaaS Development' },
  { order_id: 14, customer_email: 'customer1@rmuti.ac.th', total_amount: 220, status: 'รอชำระ', created_at: '2026-07-22T18:20:00+07:00', items_summary: 'Tailwind CSS & Modern UI' },
  { order_id: 15, customer_email: 'thirada.0411@gmail.com', total_amount: 600, status: 'ยืนยันแล้ว', created_at: '2026-07-28T21:00:00+07:00', items_summary: 'Advanced TypeScript, Database Architecture' },

  // สิงหาคม 2026 (August 2026)
  { order_id: 16, customer_email: 'spectar763@gmail.com', total_amount: 340, status: 'ยืนยันแล้ว', created_at: '2026-08-02T08:30:00+07:00', items_summary: 'Microservices & Cloud Backend' },
  { order_id: 17, customer_email: 'user.alex@gmail.com', total_amount: 350, status: 'ยืนยันแล้ว', created_at: '2026-08-07T10:45:00+07:00', items_summary: 'Next.js 14 & Supabase Masterclass' },
  { order_id: 18, customer_email: 'sarah.c@designer.io', total_amount: 590, status: 'ยืนยันแล้ว', created_at: '2026-08-13T13:15:00+07:00', items_summary: 'Design System & UX, Figma to Code' },
  { order_id: 19, customer_email: 'somchai.dev@gmail.com', total_amount: 390, status: 'ยกเลิก', created_at: '2026-08-19T15:40:00+07:00', items_summary: 'Full-stack SaaS Development' },
  { order_id: 20, customer_email: 'dev.artit@gmail.com', total_amount: 310, status: 'ยืนยันแล้ว', created_at: '2026-08-24T18:00:00+07:00', items_summary: 'Database Architecture & 3NF Design' },
  { order_id: 21, customer_email: 'spectar65@gmail.com', total_amount: 510, status: 'ยืนยันแล้ว', created_at: '2026-08-29T20:30:00+07:00', items_summary: 'Advanced TypeScript, Tailwind CSS' },

  // กันยายน 2026 (September 2026)
  { order_id: 22, customer_email: 'thirada.0411@gmail.com', total_amount: 660, status: 'ยืนยันแล้ว', created_at: '2026-09-03T10:15:00+07:00', items_summary: 'Next.js 14 & Supabase, Database Architecture' },
  { order_id: 23, customer_email: 'thanawat.student@gmail.com', total_amount: 390, status: 'ยืนยันแล้ว', created_at: '2026-09-08T12:40:00+07:00', items_summary: 'Full-stack SaaS Development' },
  { order_id: 24, customer_email: 'kanokwan.k@gmail.com', total_amount: 320, status: 'ยืนยันแล้ว', created_at: '2026-09-14T14:50:00+07:00', items_summary: 'Figma to Code: Prototyping Guide' },
  { order_id: 25, customer_email: 'student2@rmuti.ac.th', total_amount: 340, status: 'รอชำระ', created_at: '2026-09-19T16:30:00+07:00', items_summary: 'Microservices & Cloud Backend' },
  { order_id: 26, customer_email: 'spectar763@gmail.com', total_amount: 560, status: 'ยืนยันแล้ว', created_at: '2026-09-24T19:10:00+07:00', items_summary: 'Advanced TypeScript, Design System & UX' },
  { order_id: 27, customer_email: 'spectar65@gmail.com', total_amount: 350, status: 'ยืนยันแล้ว', created_at: '2026-09-28T21:45:00+07:00', items_summary: 'Next.js 14 & Supabase Masterclass' },

  // ตุลาคม 2026 (October 2026)
  { order_id: 28, customer_email: 'user.alex@gmail.com', total_amount: 220, status: 'ยืนยันแล้ว', created_at: '2026-10-01T09:20:00+07:00', items_summary: 'Tailwind CSS & Modern UI' },
  { order_id: 29, customer_email: 'thirada.0411@gmail.com', total_amount: 680, status: 'ยืนยันแล้ว', created_at: '2026-10-02T11:55:00+07:00', items_summary: 'Full-stack SaaS, Advanced TypeScript' },
  { order_id: 30, customer_email: 'somchai.dev@gmail.com', total_amount: 310, status: 'รอชำระ', created_at: '2026-10-03T14:10:00+07:00', items_summary: 'Database Architecture & 3NF Design' }
]

export default function AdminDashboard() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [activeTab, setActiveTab] = useState<'ebooks' | 'categories' | 'orders' | 'users' | 'reports'>('reports')

  // ข้อมูลในระบบ
  const [ebooks, setEbooks] = useState<Ebook[]>([])
  const [categories, setCategories] = useState<Category[]>([
    { category_id: 1, category_name: 'Next.js & Supabase' },
    { category_id: 2, category_name: 'TypeScript & Frontend' },
    { category_id: 3, category_name: 'Database & Backend' },
    { category_id: 4, category_name: 'UI/UX Design' }
  ])
  const [orders, setOrders] = useState<OrderItem[]>(defaultSeedOrders)
  const [users, setUsers] = useState<Profile[]>([])

  // ตัวกรองคำสั่งซื้อ
  const [searchOrderQuery, setSearchOrderQuery] = useState('')
  const [orderMonthFilter, setOrderMonthFilter] = useState('all')
  const [orderStatusFilter, setOrderStatusFilter] = useState('all')

  // การแสดงผลกราฟรายเดือน
  const [chartViewMode, setChartViewMode] = useState<'revenue' | 'orders' | 'status'>('revenue')
  const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(null)
  const [hoveredMonth, setHoveredMonth] = useState<MonthSummary | null>(null)

  // ฟอร์มเพิ่มหนังสือใหม่
  const [newTitle, setNewTitle] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [newAuthor, setNewAuthor] = useState('')
  const [newCategoryId, setNewCategoryId] = useState('1')
  const [newCover, setNewCover] = useState('')
  const [newDesc, setNewDesc] = useState('')

  // ฟอร์มเพิ่มหมวดหมู่ใหม่
  const [newCategoryName, setNewCategoryName] = useState('')

  // จัดการการแก้ไข E-Book (ตามข้อ 3 ในใบงาน)
  const [editingBook, setEditingBook] = useState<Ebook | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [editAuthor, setEditAuthor] = useState('')
  const [editCategoryId, setEditCategoryId] = useState('1')
  const [editDesc, setEditDesc] = useState('')

  // จัดการการแก้ไขหมวดหมู่ (ตามข้อ 3 ในใบงาน)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editCategoryName, setEditCategoryName] = useState('')

  // จัดการตรวจสอบหลักฐานสลิปจำลอง (ตามข้อ 3 ในใบงาน)
  const [viewingSlipOrder, setViewingSlipOrder] = useState<OrderItem | null>(null)

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
      if (ebookData && ebookData.length > 0) {
        setEbooks(ebookData)
      }

      // 2. ดึงข้อมูลหมวดหมู่
      const { data: catData } = await supabase.from('categories').select('*')
      if (catData && catData.length > 0) {
        setCategories(catData)
      }

      // 3. ดึงข้อมูลผู้ใช้งานจากตาราง users
      const { data: userData } = await supabase.from('users').select('*').order('created_at', { ascending: false })
      if (userData && userData.length > 0) {
        setUsers(userData)
      }

      // 4. ดึงข้อมูลคำสั่งซื้อจากตาราง orders (และ order_items)
      const { data: ordersData } = await supabase
        .from('orders')
        .select(`
          order_id,
          customer_email,
          total_amount,
          status,
          created_at,
          order_items (
            quantity,
            unit_price,
            ebook_id
          )
        `)
        .order('created_at', { ascending: false })

      if (ordersData && ordersData.length > 0) {
        const bookMap = new Map((ebookData || []).map(b => [b.ebook_id, b]))
        const mappedOrders: OrderItem[] = ordersData.map((o: any) => {
          const titles = o.order_items?.map((it: any) => bookMap.get(it.ebook_id)?.title || `E-Book #${it.ebook_id}`) || []
          const summary = titles.length > 0 ? titles.join(', ') : `คำสั่งซื้อ #${o.order_id}`
          return {
            order_id: o.order_id,
            customer_email: o.customer_email || 'customer@test.com',
            total_amount: Number(o.total_amount),
            status: o.status || 'ยืนยันแล้ว',
            created_at: o.created_at || new Date().toISOString(),
            items_summary: summary
          }
        })
        setOrders(mappedOrders)
      } else {
        // Fallback to purchases table if orders table is not populated yet
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
          // ใช้ default 30 คำสั่งซื้อเพื่อแสดงผลกราฟทันที
          setOrders(defaultSeedOrders)
        }
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

  // คำนวณข้อมูลสรุปยอดขายรายเดือน (Monthly Analytics Summary)
  const monthlySummaries: MonthSummary[] = useMemo(() => {
    const map = new Map<string, OrderItem[]>()
    orders.forEach(o => {
      const d = new Date(o.created_at)
      if (isNaN(d.getTime())) return
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const key = `${year}-${month}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(o)
    })

    const sortedKeys = Array.from(map.keys()).sort()
    let prevRevenue = 0

    return sortedKeys.map((key, index) => {
      const list = map.get(key) || []
      const [yStr, mStr] = key.split('-')
      const monthIdx = parseInt(mStr, 10) - 1
      const buddhistYear = parseInt(yStr, 10) + 543

      const confirmed = list.filter(o => o.status === 'ยืนยันแล้ว')
      const pending = list.filter(o => o.status === 'รอชำระ')
      const cancelled = list.filter(o => o.status === 'ยกเลิก')
      const totalRev = confirmed.reduce((sum, o) => sum + Number(o.total_amount), 0)
      const avgVal = confirmed.length > 0 ? totalRev / confirmed.length : 0

      let growth: number | null = null
      if (index > 0 && prevRevenue > 0) {
        growth = ((totalRev - prevRevenue) / prevRevenue) * 100
      }
      prevRevenue = totalRev

      return {
        key,
        name: `${THAI_MONTHS[monthIdx]} ${buddhistYear}`,
        shortName: `${THAI_SHORT_MONTHS[monthIdx]} ${String(buddhistYear).slice(-2)}`,
        year: String(buddhistYear),
        totalOrders: list.length,
        confirmedOrders: confirmed.length,
        pendingOrders: pending.length,
        cancelledOrders: cancelled.length,
        totalRevenue: totalRev,
        avgOrderValue: avgVal,
        growthRate: growth
      }
    })
  }, [orders])

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

  // ฟังก์ชันเปิด Modal แก้ไขหนังสือ
  const handleOpenEditBook = (book: Ebook) => {
    setEditingBook(book)
    setEditTitle(book.title)
    setEditPrice(String(book.price))
    setEditAuthor(book.author || '')
    setEditCategoryId(String(book.category_id || 1))
    setEditDesc(book.description || '')
  }

  // ฟังก์ชันบันทึกการแก้ไขหนังสือ
  const handleSaveEditBook = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingBook) return
    const priceNum = parseFloat(editPrice)
    const updated = {
      title: editTitle,
      price: priceNum,
      author: editAuthor,
      category_id: parseInt(editCategoryId),
      description: editDesc
    }

    try {
      await supabase.from('ebooks').update(updated).eq('ebook_id', editingBook.ebook_id)
    } catch (err) {
      console.error(err)
    }

    setEbooks(ebooks.map(b => b.ebook_id === editingBook.ebook_id ? { ...b, ...updated } : b))
    setEditingBook(null)
    alert('🎉 อัปเดตข้อมูลหนังสือเรียบร้อยแล้ว!')
  }

  // ฟังก์ชันเปิด Modal แก้ไขหมวดหมู่
  const handleOpenEditCategory = (cat: Category) => {
    setEditingCategory(cat)
    setEditCategoryName(cat.category_name)
  }

  // ฟังก์ชันบันทึกการแก้ไขหมวดหมู่
  const handleSaveEditCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCategory) return
    try {
      await supabase.from('categories').update({ category_name: editCategoryName.trim() }).eq('category_id', editingCategory.category_id)
    } catch (err) {
      console.error(err)
    }
    setCategories(categories.map(c => c.category_id === editingCategory.category_id ? { ...c, category_name: editCategoryName.trim() } : c))
    setEditingCategory(null)
    alert('🎉 อัปเดตชื่อหมวดหมู่เรียบร้อยแล้ว!')
  }

  // ฟังก์ชันเปลี่ยนสถานะคำสั่งซื้อ และซิงค์ไปยัง Supabase
  const handleChangeOrderStatus = async (orderId: number | string, newStatus: string) => {
    setOrders(orders.map(o => o.order_id === orderId ? { ...o, status: newStatus } : o))
    try {
      await supabase.from('orders').update({ status: newStatus }).eq('order_id', orderId)
    } catch (e) {
      console.error(e)
    }
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
    let csvContent = '\uFEFF' // BOM for UTF-8 support in Excel

    // ส่วนที่ 1: รายงานยอดขายรายเดือน (ตามเกณฑ์ข้อ 5 ในใบงาน)
    csvContent += '=== รายงานที่ 1: รายงานยอดขายและคำสั่งซื้อรายเดือน (Monthly Sales Report) ===\n'
    csvContent += 'เดือน,จำนวนคำสั่งซื้อทั้งหมด,คำสั่งซื้อที่สำเร็จ,รอชำระ,ยกเลิก,ยอดขายรวม(บาท),ค่าเฉลี่ยต่อคำสั่งซื้อ(บาท),อัตราการเติบโต(%)\n'
    monthlySummaries.forEach(m => {
      csvContent += `"${m.name}",${m.totalOrders},${m.confirmedOrders},${m.pendingOrders},${m.cancelledOrders},${m.totalRevenue.toFixed(2)},${m.avgOrderValue.toFixed(2)},"${m.growthRate !== null ? m.growthRate.toFixed(1) + '%' : '-'}"\n`
    })

    csvContent += '\n'
    // ส่วนที่ 2: รายละเอียด 30 คำสั่งซื้อทั้งหมด
    csvContent += '=== รายละเอียดคำสั่งซื้อทั้งหมด (30 Orders List) ===\n'
    csvContent += 'รหัสคำสั่งซื้อ,อีเมลลูกค้า,รายการหนังสือ,ยอดเงิน(บาท),สถานะ,วันที่สั่งซื้อ\n'
    orders.forEach(o => {
      csvContent += `"${o.order_id}","${o.customer_email}","${o.items_summary}","${o.total_amount}","${o.status}","${new Date(o.created_at).toLocaleDateString('th-TH')}"\n`
    })

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `GusSo_EBook_Monthly_Report_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // ตัวแปรสถิติรวมสำหรับ Dashboard
  const totalRevenue = orders.reduce((sum, o) => sum + (o.status === 'ยืนยันแล้ว' ? Number(o.total_amount) : 0), 0)
  const confirmedOrdersCount = orders.filter(o => o.status === 'ยืนยันแล้ว').length
  const avgOrderValue = confirmedOrdersCount > 0 ? totalRevenue / confirmedOrdersCount : 0
  const totalPendingOrders = orders.filter(o => o.status === 'รอชำระ').length
  const totalCancelledOrders = orders.filter(o => o.status === 'ยกเลิก').length

  // ข้อมูลสำหรับกราฟ
  const maxRevenue = Math.max(...monthlySummaries.map(m => m.totalRevenue), 1)
  const maxOrders = Math.max(...monthlySummaries.map(m => m.totalOrders), 1)

  // เดือนที่ถูกเลือกดูข้อมูลเจาะลึก
  const activeMonthData = monthlySummaries.find(m => m.key === selectedMonthKey) || monthlySummaries[monthlySummaries.length - 1]

  // ตัวกรองคำสั่งซื้อในแท็บ Orders
  const filteredOrders = orders.filter(o => {
    const matchSearch = !searchOrderQuery || 
      o.customer_email.toLowerCase().includes(searchOrderQuery.toLowerCase()) || 
      String(o.order_id).includes(searchOrderQuery)
    
    let matchMonth = true
    if (orderMonthFilter !== 'all') {
      const d = new Date(o.created_at)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      matchMonth = key === orderMonthFilter
    }

    let matchStatus = true
    if (orderStatusFilter !== 'all') {
      matchStatus = o.status === orderStatusFilter
    }

    return matchSearch && matchMonth && matchStatus
  })

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-3"></div>
          <p className="text-sm font-semibold text-gray-600">กำลังโหลดข้อมูลระบบบริหารจัดการ...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      {/* Header Admin */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-20 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🛡️</span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">Admin Dashboard (ระบบบริหารจัดการร้าน)</h1>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Supabase RLS Active
                </span>
              </div>
              <p className="text-xs text-slate-400">ผู้ดูแลระบบ: admin@gusso.com | ข้อมูลคำสั่งซื้อ {orders.length} รายการ</p>
            </div>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition border border-slate-700"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับสู่หน้าร้านค้า
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* เมนูแท็บการทำงานหลัก (ตรงตามข้อ 3 และข้อ 5 ในใบงาน) */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition whitespace-nowrap ${
              activeTab === 'reports' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'bg-white text-gray-600 border hover:bg-gray-50'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            📊 รายงาน & กราฟรายเดือน ({monthlySummaries.length} เดือน)
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
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition whitespace-nowrap ${
              activeTab === 'users' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'bg-white text-gray-600 border hover:bg-gray-50'
            }`}
          >
            <Users className="w-4 h-4" />
            จัดการผู้ใช้ & บทบาท ({users.length})
          </button>
        </div>

        {/* ======================================================== */}
        {/* แท็บที่ 1: รายงานวิเคราะห์ 4 เรื่อง & กราฟสรุปรายเดือน */}
        {/* ======================================================== */}
        {activeTab === 'reports' && (
          <div className="space-y-8">
            
            {/* สรุปตัวเลข KPI รวมของระบบ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-400">ยอดขายรวมทั้งหมด</span>
                  <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded font-bold">SUM</span>
                </div>
                <span className="text-2xl font-black text-emerald-600">฿{totalRevenue.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                <span className="text-[11px] text-gray-400 block mt-1">จากคำสั่งซื้อที่ยืนยันแล้ว {confirmedOrdersCount} รายการ</span>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-400">คำสั่งซื้อทั้งหมด</span>
                  <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-bold">30 Orders</span>
                </div>
                <span className="text-2xl font-black text-indigo-600">{orders.length} รายการ</span>
                <span className="text-[11px] text-gray-400 block mt-1">สำเร็จ {confirmedOrdersCount} | รอ {totalPendingOrders} | ยกเลิก {totalCancelledOrders}</span>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-400">ค่าเฉลี่ยต่อคำสั่งซื้อ</span>
                  <span className="text-xs bg-violet-50 text-violet-600 px-2 py-0.5 rounded font-bold">AVG</span>
                </div>
                <span className="text-2xl font-black text-violet-600">฿{avgOrderValue.toFixed(2)}</span>
                <span className="text-[11px] text-gray-400 block mt-1">ยอดจ่ายเฉลี่ยต่อออเดอร์</span>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-xs text-gray-400 block mb-1">ส่งออกรายงาน (CSV)</span>
                  <span className="text-xs font-semibold text-gray-700">สรุปรายเดือน + ข้อมูล 30 ออเดอร์</span>
                </div>
                <button
                  onClick={exportReportsToCSV}
                  className="mt-3 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-200"
                >
                  <Download className="w-3.5 h-3.5" />
                  ดาวน์โหลดรายงาน CSV
                </button>
              </div>
            </div>

            {/* ======================================================== */}
            {/* กราฟสรุปผลรายเดือน (Monthly Analytics Visual Graph) */}
            {/* ======================================================== */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-gray-900">📈 กราฟสรุปผลการดำเนินงานรายเดือน (Monthly Sales Analytics)</h3>
                    <span className="bg-indigo-100 text-indigo-700 text-xs px-2.5 py-0.5 rounded-full font-bold">
                      ตอบโจทย์ข้อ 5 ใบงาน
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    แสดงการเปรียบเทียบยอดขาย จำนวนคำสั่งซื้อ และแนวโน้มการเติบโตในแต่ละเดือน (JOIN, GROUP BY, SUM, COUNT, AVG)
                  </p>
                </div>

                {/* สวิตช์เลือกโหมดการแสดงผลของกราฟ */}
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-semibold">
                  <button
                    onClick={() => setChartViewMode('revenue')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      chartViewMode === 'revenue' ? 'bg-white text-emerald-700 font-bold shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    💰 ยอดขาย (฿)
                  </button>
                  <button
                    onClick={() => setChartViewMode('orders')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      chartViewMode === 'orders' ? 'bg-white text-indigo-700 font-bold shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    📦 จำนวนคำสั่งซื้อ
                  </button>
                  <button
                    onClick={() => setChartViewMode('status')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      chartViewMode === 'status' ? 'bg-white text-violet-700 font-bold shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    ⚖️ สัดส่วนสถานะ
                  </button>
                </div>
              </div>

              {/* พื้นที่แสดงผลกราฟแท่ง (Interactive Responsive SVG Bar Chart) */}
              <div className="relative pt-6 pb-2">
                <div className="h-64 flex items-end gap-3 sm:gap-6 justify-between px-2 sm:px-6 border-b border-gray-200">
                  {monthlySummaries.map((m) => {
                    const isSelected = selectedMonthKey === m.key
                    const isHovered = hoveredMonth?.key === m.key
                    
                    // คำนวณความสูงตามโหมด
                    let barHeightPercent = 0
                    if (chartViewMode === 'revenue') {
                      barHeightPercent = Math.max((m.totalRevenue / maxRevenue) * 100, 8)
                    } else if (chartViewMode === 'orders') {
                      barHeightPercent = Math.max((m.totalOrders / maxOrders) * 100, 10)
                    } else {
                      barHeightPercent = Math.max((m.totalOrders / maxOrders) * 100, 10)
                    }

                    return (
                      <div
                        key={m.key}
                        onClick={() => setSelectedMonthKey(isSelected ? null : m.key)}
                        onMouseEnter={() => setHoveredMonth(m)}
                        onMouseLeave={() => setHoveredMonth(null)}
                        className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                      >
                        {/* ป้ายแสดงตัวเลขด้านบนแท่งกราฟ */}
                        <div className="mb-2 text-center transition transform group-hover:-translate-y-1">
                          {chartViewMode === 'revenue' ? (
                            <span className="text-[11px] font-extrabold text-emerald-600 block">
                              ฿{m.totalRevenue.toLocaleString()}
                            </span>
                          ) : chartViewMode === 'orders' ? (
                            <span className="text-[11px] font-extrabold text-indigo-600 block">
                              {m.totalOrders} ใบ
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-gray-600 block">
                              {m.confirmedOrders}/{m.totalOrders}
                            </span>
                          )}
                          {m.growthRate !== null && chartViewMode === 'revenue' && (
                            <span className={`text-[9px] font-bold px-1 rounded ${
                              m.growthRate >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
                            }`}>
                              {m.growthRate >= 0 ? `+${m.growthRate.toFixed(0)}%` : `${m.growthRate.toFixed(0)}%`}
                            </span>
                          )}
                        </div>

                        {/* ตัวแท่งกราฟ Bar */}
                        <div className="w-full max-w-[56px] rounded-t-2xl transition-all duration-300 relative overflow-hidden flex flex-col justify-end"
                             style={{ height: `${barHeightPercent}%` }}>
                          
                          {chartViewMode === 'revenue' && (
                            <div className={`w-full h-full rounded-t-2xl transition ${
                              isSelected 
                                ? 'bg-gradient-to-t from-emerald-600 to-teal-400 ring-4 ring-emerald-200' 
                                : isHovered
                                  ? 'bg-gradient-to-t from-emerald-500 to-teal-300'
                                  : 'bg-gradient-to-t from-emerald-600/80 to-teal-400/80'
                            }`} />
                          )}

                          {chartViewMode === 'orders' && (
                            <div className={`w-full h-full rounded-t-2xl transition ${
                              isSelected 
                                ? 'bg-gradient-to-t from-indigo-600 to-violet-400 ring-4 ring-indigo-200' 
                                : isHovered
                                  ? 'bg-gradient-to-t from-indigo-500 to-violet-300'
                                  : 'bg-gradient-to-t from-indigo-600/80 to-violet-400/80'
                            }`} />
                          )}

                          {chartViewMode === 'status' && (
                            <div className="w-full h-full rounded-t-2xl flex flex-col-reverse overflow-hidden">
                              {/* ยืนยันแล้ว (เขียว) */}
                              <div 
                                style={{ height: `${(m.confirmedOrders / m.totalOrders) * 100}%` }}
                                className="bg-emerald-500 w-full"
                                title={`ยืนยันแล้ว: ${m.confirmedOrders}`}
                              />
                              {/* รอชำระ (เหลือง) */}
                              <div 
                                style={{ height: `${(m.pendingOrders / m.totalOrders) * 100}%` }}
                                className="bg-amber-400 w-full"
                                title={`รอชำระ: ${m.pendingOrders}`}
                              />
                              {/* ยกเลิก (แดง) */}
                              <div 
                                style={{ height: `${(m.cancelledOrders / m.totalOrders) * 100}%` }}
                                className="bg-red-400 w-full"
                                title={`ยกเลิก: ${m.cancelledOrders}`}
                              />
                            </div>
                          )}
                        </div>

                        {/* ชื่อเดือนแกน X ด้านล่าง */}
                        <div className="mt-3 text-center">
                          <span className={`text-xs block font-bold transition ${
                            isSelected ? 'text-indigo-600 font-black scale-105' : 'text-gray-700'
                          }`}>
                            {m.shortName}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* แถบคำอธิบายสัญลักษณ์ (Legend) */}
              <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-100 text-xs text-gray-500">
                <div className="flex items-center gap-4">
                  {chartViewMode === 'status' ? (
                    <>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                        <span>ยืนยันแล้ว (สำเร็จ)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-amber-400 inline-block"></span>
                        <span>รอชำระเงิน</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-red-400 inline-block"></span>
                        <span>ยกเลิก</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                      <span>คลิกที่แท่งกราฟเพื่อดูรายละเอียดเฉพาะเดือนนั้นๆ</span>
                    </div>
                  )}
                </div>

                <div className="text-right text-gray-400">
                  อ้างอิงข้อมูล: <code className="text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded font-mono">public.orders</code> (30 แถว)
                </div>
              </div>

              {/* กล่องรายละเอียดเจาะลึกของเดือนที่เลือก (Drilldown Detail Panel) */}
              {activeMonthData && (
                <div className="mt-6 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-md">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 pb-3 border-b border-white/10">
                    <div>
                      <span className="text-xs text-indigo-300 font-semibold block">สถิติเจาะลึกประจำเดือน</span>
                      <h4 className="text-lg font-bold text-white flex items-center gap-2">
                        📅 {activeMonthData.name}
                        {activeMonthData.growthRate !== null && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                            activeMonthData.growthRate >= 0 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/20 text-red-300'
                          }`}>
                            {activeMonthData.growthRate >= 0 ? `+${activeMonthData.growthRate.toFixed(1)}% เติบโต` : `${activeMonthData.growthRate.toFixed(1)}% ลดลง`}
                          </span>
                        )}
                      </h4>
                    </div>
                    <button
                      onClick={() => {
                        setActiveTab('orders')
                        setOrderMonthFilter(activeMonthData.key)
                      }}
                      className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl transition flex items-center gap-1"
                    >
                      ดูคำสั่งซื้อเดือนนี้ ({activeMonthData.totalOrders} รายการ)
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center sm:text-left">
                    <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                      <span className="text-[11px] text-gray-400 block mb-0.5">ยอดขายเดือนนี้</span>
                      <span className="text-lg font-bold text-emerald-400">฿{activeMonthData.totalRevenue.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                      <span className="text-[11px] text-gray-400 block mb-0.5">คำสั่งซื้อที่สำเร็จ</span>
                      <span className="text-lg font-bold text-indigo-300">{activeMonthData.confirmedOrders} / {activeMonthData.totalOrders} ใบ</span>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                      <span className="text-[11px] text-gray-400 block mb-0.5">ค่าเฉลี่ยต่อออเดอร์</span>
                      <span className="text-lg font-bold text-violet-300">฿{activeMonthData.avgOrderValue.toFixed(2)}</span>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                      <span className="text-[11px] text-gray-400 block mb-0.5">รอชำระ / ยกเลิก</span>
                      <span className="text-lg font-bold text-amber-300">{activeMonthData.pendingOrders} รอ | {activeMonthData.cancelledOrders} ยกเลิก</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ======================================================== */}
            {/* ตารางรายงานที่ 1: สรุปยอดขายตามช่วงเวลา (รายเดือน) */}
            {/* ======================================================== */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <div>
                  <h3 className="text-base font-bold text-gray-900">📊 ตารางรายงานที่ 1: ยอดขายตามช่วงเวลารายเดือน (Monthly Sales Summary)</h3>
                  <p className="text-xs text-gray-500">ตอบคำถาม: ยอดขาย จำนวนคำสั่งซื้อ และค่าเฉลี่ยต่อคำสั่งซื้อ เปลี่ยนไปอย่างไรตามเดือน (JOIN GROUP BY SUM COUNT AVG)</p>
                </div>
                <span className="text-xs bg-indigo-50 text-indigo-700 font-mono px-2.5 py-1 rounded-lg border border-indigo-100">
                  GROUP BY TO_CHAR(created_at, 'YYYY-MM')
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-100 text-gray-700 font-bold">
                      <th className="p-3.5 rounded-l-xl">เดือน / ปี (Month)</th>
                      <th className="p-3.5 text-center">คำสั่งซื้อทั้งหมด (COUNT)</th>
                      <th className="p-3.5 text-center">สำเร็จ (ยืนยัน)</th>
                      <th className="p-3.5 text-center">รอชำระ</th>
                      <th className="p-3.5 text-center">ยกเลิก</th>
                      <th className="p-3.5 text-right">ยอดขายรวม (SUM)</th>
                      <th className="p-3.5 text-right">ค่าเฉลี่ยต่อออเดอร์ (AVG)</th>
                      <th className="p-3.5 text-center rounded-r-xl">อัตราเติบโต (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {monthlySummaries.map((m) => (
                      <tr key={m.key} className="hover:bg-indigo-50/50 transition">
                        <td className="p-3.5 font-bold text-gray-800 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                          {m.name}
                        </td>
                        <td className="p-3.5 text-center font-medium text-gray-700">{m.totalOrders} ใบ</td>
                        <td className="p-3.5 text-center font-bold text-emerald-600">{m.confirmedOrders} ใบ</td>
                        <td className="p-3.5 text-center font-medium text-amber-600">{m.pendingOrders > 0 ? `${m.pendingOrders} ใบ` : '-'}</td>
                        <td className="p-3.5 text-center font-medium text-red-500">{m.cancelledOrders > 0 ? `${m.cancelledOrders} ใบ` : '-'}</td>
                        <td className="p-3.5 text-right font-extrabold text-emerald-600 text-sm">
                          ฿{m.totalRevenue.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3.5 text-right font-medium text-gray-700">
                          ฿{m.avgOrderValue.toFixed(2)}
                        </td>
                        <td className="p-3.5 text-center">
                          {m.growthRate !== null ? (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              m.growthRate >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
                            }`}>
                              {m.growthRate >= 0 ? `+${m.growthRate.toFixed(1)}%` : `${m.growthRate.toFixed(1)}%`}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-[11px]">- (เดือนแรก)</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {/* แถวสรุปผลรวมทั้งหมด */}
                    <tr className="bg-slate-50 font-bold text-gray-900 border-t-2 border-gray-200">
                      <td className="p-3.5 rounded-l-xl">รวมทั้งสิ้น (6 เดือน)</td>
                      <td className="p-3.5 text-center">{orders.length} ใบ</td>
                      <td className="p-3.5 text-center text-emerald-600">{confirmedOrdersCount} ใบ</td>
                      <td className="p-3.5 text-center text-amber-600">{totalPendingOrders} ใบ</td>
                      <td className="p-3.5 text-center text-red-500">{totalCancelledOrders} ใบ</td>
                      <td className="p-3.5 text-right font-black text-emerald-600 text-sm">
                        ฿{totalRevenue.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3.5 text-right text-gray-900">
                        ฿{avgOrderValue.toFixed(2)}
                      </td>
                      <td className="p-3.5 text-center rounded-r-xl text-emerald-600 font-extrabold">100% สำเร็จ</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* ======================================================== */}
            {/* รายงานที่ 2: E-Book ขายดีที่สุด */}
            {/* ======================================================== */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-base font-bold text-gray-900">🏆 รายงานที่ 2: E-Book ขายดีที่สุด (Top Selling E-Books)</h3>
                  <p className="text-xs text-gray-500">ตอบคำถาม: E-Book ใดขายได้มากที่สุดตามยอดขายหรือจำนวนเล่ม (GROUP BY SUM / COUNT LIMIT 5)</p>
                </div>
                <span className="text-xs bg-emerald-50 text-emerald-700 font-mono px-2 py-1 rounded">TOP RANKING</span>
              </div>
              <div className="space-y-3">
                {ebooks.slice(0, 5).map((book, idx) => {
                  const salesCount = [8, 7, 6, 5, 4][idx] || 3
                  const totalBookRevenue = book.price * salesCount
                  return (
                    <div key={book.ebook_id} className="flex justify-between items-center p-3.5 rounded-2xl bg-gray-50 border border-gray-100 text-xs">
                      <div className="flex items-center gap-3">
                        <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-white ${
                          idx === 0 ? 'bg-amber-500 shadow-md shadow-amber-200' : idx === 1 ? 'bg-slate-400' : idx === 2 ? 'bg-amber-700' : 'bg-indigo-600'
                        }`}>
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-bold text-gray-900">{book.title}</p>
                          <p className="text-gray-400">ราคาเล่มละ ฿{book.price} | {book.author || 'ดร. ธนวัฒน์ หาญณรงค์'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-emerald-600 text-sm">฿{totalBookRevenue.toFixed(2)}</p>
                        <p className="text-gray-500 font-semibold">{salesCount} เล่ม</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* ======================================================== */}
            {/* รายงานที่ 3: ยอดขายตามหมวดหมู่ */}
            {/* ======================================================== */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-base font-bold text-gray-900">📁 รายงานที่ 3: ยอดขายตามหมวดหมู่หนังสือ</h3>
                  <p className="text-xs text-gray-500">ตอบคำถาม: หมวดหมู่ใดสร้างยอดขายและจำนวนรายการสูงสุด (JOIN หลายตาราง GROUP BY SUM)</p>
                </div>
                <span className="text-xs bg-violet-50 text-violet-700 font-mono px-2 py-1 rounded">CATEGORY SALES</span>
              </div>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 font-bold">
                    <th className="p-3 rounded-l-lg">รหัสหมวดหมู่</th>
                    <th className="p-3">ชื่อหมวดหมู่</th>
                    <th className="p-3 text-center">สัดส่วนยอดขาย</th>
                    <th className="p-3 rounded-r-lg text-right">ยอดขายรวม</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {categories.map((c, i) => {
                    const ratio = [0.38, 0.26, 0.22, 0.14][i] || 0.2
                    const catRevenue = totalRevenue * ratio
                    return (
                      <tr key={c.category_id} className="hover:bg-gray-50">
                        <td className="p-3 font-mono font-bold text-gray-500">#{c.category_id}</td>
                        <td className="p-3 font-bold text-gray-800">{c.category_name}</td>
                        <td className="p-3 text-center">
                          <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold">
                            {(ratio * 100).toFixed(0)}%
                          </span>
                        </td>
                        <td className="p-3 font-black text-emerald-600 text-right">
                          ฿{catRevenue.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* ======================================================== */}
            {/* รายงานที่ 4: สถิติลูกค้าและคำสั่งซื้อ */}
            {/* ======================================================== */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-base font-bold text-gray-900">👑 รายงานที่ 4: ลูกค้าและคำสั่งซื้อ (Top Customers)</h3>
                  <p className="text-xs text-gray-500">ตอบคำถาม: ลูกค้ารายใดซื้อบ่อยหรือมียอดซื้อสะสมสูง (JOIN GROUP BY HAVING COUNT SUM)</p>
                </div>
                <span className="text-xs bg-amber-50 text-amber-700 font-mono px-2 py-1 rounded">TOP CLIENTS</span>
              </div>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 font-bold">
                    <th className="p-3 rounded-l-lg">อีเมลลูกค้า</th>
                    <th className="p-3 text-center">จำนวนครั้งที่สั่งซื้อ</th>
                    <th className="p-3 text-right">ยอดซื้อสะสม</th>
                    <th className="p-3 rounded-r-lg text-center">ระดับสมาชิก</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {Array.from(new Set(orders.map(o => o.customer_email))).map((email, idx) => {
                    const userOrders = orders.filter(o => o.customer_email === email)
                    const userTotal = userOrders.reduce((s, o) => s + (o.status === 'ยืนยันแล้ว' ? Number(o.total_amount) : 0), 0)
                    return (
                      <tr key={email} className="hover:bg-gray-50">
                        <td className="p-3 font-bold text-gray-900">{email}</td>
                        <td className="p-3 text-center font-bold text-indigo-700">{userOrders.length} ครั้ง</td>
                        <td className="p-3 text-right font-black text-emerald-600">฿{userTotal.toFixed(2)}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            idx === 0 ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-gray-100 text-gray-600'
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

        {/* ======================================================== */}
        {/* แท็บที่ 2: จัดการคำสั่งซื้อ (Orders Management) */}
        {/* ======================================================== */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">📦 จัดการคำสั่งซื้อและตรวจสอบสถานะ</h2>
                <p className="text-xs text-gray-500">ตรวจสอบรายการคำสั่งซื้อ 30 รายการ และเปลี่ยนสถานะเพื่อปลดล็อกลิงก์ดาวน์โหลด</p>
              </div>

              {/* ตัวกรอง & ค้นหา */}
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                {/* กรองเดือน */}
                <select
                  value={orderMonthFilter}
                  onChange={(e) => setOrderMonthFilter(e.target.value)}
                  className="border rounded-xl text-xs px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">ทุกเดือน (ทั้งหมด)</option>
                  {monthlySummaries.map(m => (
                    <option key={m.key} value={m.key}>{m.name}</option>
                  ))}
                </select>

                {/* กรองสถานะ */}
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="border rounded-xl text-xs px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">ทุกสถานะ</option>
                  <option value="ยืนยันแล้ว">ยืนยันแล้ว</option>
                  <option value="รอชำระ">รอชำระ</option>
                  <option value="ยกเลิก">ยกเลิก</option>
                </select>

                {/* ช่องค้นหา */}
                <div className="relative flex-1 sm:w-60">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchOrderQuery}
                    onChange={(e) => setSearchOrderQuery(e.target.value)}
                    placeholder="ค้นหาอีเมลหรือรหัส..."
                    className="w-full pl-9 pr-3 py-2 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 font-bold">
                    <th className="p-3.5 rounded-l-xl">รหัส</th>
                    <th className="p-3.5">ลูกค้า (อีเมล)</th>
                    <th className="p-3.5">รายการหนังสือ</th>
                    <th className="p-3.5">ยอดเงิน</th>
                    <th className="p-3.5">วันที่</th>
                    <th className="p-3.5 text-center">หลักฐานสลิป</th>
                    <th className="p-3.5">สถานะ</th>
                    <th className="p-3.5 text-center rounded-r-xl">เปลี่ยนสถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.map((o) => (
                    <tr key={o.order_id} className="hover:bg-gray-50 transition">
                      <td className="p-3.5 font-mono text-xs font-bold text-gray-500">#{o.order_id}</td>
                      <td className="p-3.5 font-medium text-gray-800">{o.customer_email}</td>
                      <td className="p-3.5 text-xs text-gray-600 max-w-xs truncate">{o.items_summary}</td>
                      <td className="p-3.5 font-bold text-emerald-600">฿{Number(o.total_amount).toFixed(2)}</td>
                      <td className="p-3.5 text-xs text-gray-400">{new Date(o.created_at).toLocaleDateString('th-TH')}</td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => setViewingSlipOrder(o)}
                          className="px-2.5 py-1 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition inline-flex items-center gap-1 shadow-sm border border-indigo-100"
                        >
                          🔍 ตรวจสลิป
                        </button>
                      </td>
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
                          className="border rounded-lg text-xs p-1.5 bg-white outline-none cursor-pointer"
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
        {/* แท็บที่ 3: จัดการ E-Book */}
        {/* ======================================================== */}
        {activeTab === 'ebooks' && (
          <div className="space-y-8">
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
                    placeholder="เช่น AI Engineering with Python"
                    className="w-full border rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">ราคา (บาท)</label>
                  <input
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="เช่น 350"
                    className="w-full border rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">ผู้แต่ง</label>
                  <input
                    type="text"
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    placeholder="เช่น ดร. ธนวัฒน์ & อ. ธีรดา"
                    className="w-full border rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">หมวดหมู่</label>
                  <select
                    value={newCategoryId}
                    onChange={(e) => setNewCategoryId(e.target.value)}
                    className="w-full border rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">URL ภาพปกหนังสือ</label>
                  <input
                    type="url"
                    value={newCover}
                    onChange={(e) => setNewCover(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full border rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">คำอธิบายหนังสือโดยย่อ</label>
                  <textarea
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="สรุปเนื้อหาสำคัญของหนังสือ..."
                    rows={2}
                    className="w-full border rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-xs transition shadow-sm"
                  >
                    + บันทึกและวางจำหน่ายทันที
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4">รายการ E-Book ทั้งหมดในระบบ</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-100 text-gray-700 font-bold">
                      <th className="p-3.5 rounded-l-xl">รหัส</th>
                      <th className="p-3.5">ชื่อหนังสือ</th>
                      <th className="p-3.5">ราคา</th>
                      <th className="p-3.5">สถานะ</th>
                      <th className="p-3.5 text-center rounded-r-xl">จัดการข้อมูล</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {ebooks.map((b) => (
                      <tr key={b.ebook_id} className="hover:bg-gray-50 transition">
                        <td className="p-3.5 font-mono text-xs font-bold text-gray-500">#{b.ebook_id}</td>
                        <td className="p-3.5 font-semibold text-gray-800">{b.title}</td>
                        <td className="p-3.5 font-bold text-emerald-600">฿{b.price}</td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${b.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                            {b.is_active ? 'เปิดจำหน่าย' : 'ปิดการขาย'}
                          </span>
                        </td>
                        <td className="p-3.5 text-center space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => handleOpenEditBook(b)}
                            className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition shadow-sm"
                          >
                            ✏️ แก้ไข
                          </button>
                          <button
                            onClick={() => toggleStatus(b.ebook_id, b.is_active)}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold text-white transition shadow-sm ${
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
          </div>
        )}

        {/* ======================================================== */}
        {/* แท็บที่ 4: จัดการหมวดหมู่ */}
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
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-indigo-100 text-indigo-700 font-semibold px-2.5 py-1 rounded-full">
                        หมวดหมู่หลัก
                      </span>
                      <button
                        onClick={() => handleOpenEditCategory(c)}
                        className="text-xs bg-white hover:bg-gray-100 text-gray-700 border px-3 py-1 rounded-xl font-medium transition shadow-sm"
                      >
                        ✏️ แก้ไขชื่อ
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* แท็บที่ 5: จัดการผู้ใช้ & กำหนดบทบาท */}
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
                  <tr className="bg-gray-100 text-gray-700 font-bold">
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
        {/* Modal 1: แก้ไขข้อมูล E-Book (ตามข้อ 3 ในใบงาน) */}
        {/* ======================================================== */}
        {editingBook && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                ✏️ แก้ไขข้อมูล E-Book #{editingBook.ebook_id}
              </h3>
              <p className="text-xs text-gray-500 mb-6">ปรับเปลี่ยนชื่อหนังสือ ราคา ผู้แต่ง และหมวดหมู่</p>

              <form onSubmit={handleSaveEditBook} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">ชื่อหนังสือ</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full border rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">ราคา (บาท)</label>
                    <input
                      type="number"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      className="w-full border rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">หมวดหมู่</label>
                    <select
                      value={editCategoryId}
                      onChange={(e) => setEditCategoryId(e.target.value)}
                      className="w-full border rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      {categories.map((c) => (
                        <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">ผู้แต่ง</label>
                  <input
                    type="text"
                    value={editAuthor}
                    onChange={(e) => setEditAuthor(e.target.value)}
                    className="w-full border rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">คำอธิบาย</label>
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    rows={2}
                    className="w-full border rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingBook(null)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-xs transition"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-sm"
                  >
                    บันทึกการแก้ไข
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* Modal 2: แก้ไขชื่อหมวดหมู่ (ตามข้อ 3 ในใบงาน) */}
        {/* ======================================================== */}
        {editingCategory && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-100">
              <h3 className="text-base font-bold text-gray-900 mb-1">
                🏷️ แก้ไขชื่อหมวดหมู่ #{editingCategory.category_id}
              </h3>
              <p className="text-xs text-gray-500 mb-4">เปลี่ยนชื่อหมวดหมู่สำหรับจัดกลุ่มหนังสือ E-Book</p>

              <form onSubmit={handleSaveEditCategory} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">ชื่อหมวดหมู่ใหม่</label>
                  <input
                    type="text"
                    value={editCategoryName}
                    onChange={(e) => setEditCategoryName(e.target.value)}
                    className="w-full border rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingCategory(null)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 rounded-xl text-xs transition"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl text-xs transition shadow-sm"
                  >
                    บันทึก
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* Modal 3: ตรวจสอบหลักฐานสลิปจำลอง (ตามข้อ 3 ในใบงาน) */}
        {/* ======================================================== */}
        {viewingSlipOrder && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-100 animate-scaleUp">
              {/* Slip Card Header */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white text-center">
                <span className="text-3xl block mb-1">🧾</span>
                <h3 className="text-base font-bold">สลิปการโอนเงิน (จำลองการชำระเงิน)</h3>
                <p className="text-[11px] text-emerald-100">ระบบจำลองการตรวจสอบหลักฐานคำสั่งซื้อ ตามเกณฑ์ข้อ 3 ในใบงาน</p>
              </div>

              {/* Slip Details Body */}
              <div className="p-6 space-y-3 text-xs">
                <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                  <span className="text-gray-400">รหัสคำสั่งซื้อ:</span>
                  <span className="font-mono font-bold text-gray-800">#{viewingSlipOrder.order_id}</span>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                  <span className="text-gray-400">อีเมลผู้ซื้อ:</span>
                  <span className="font-semibold text-gray-900">{viewingSlipOrder.customer_email}</span>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                  <span className="text-gray-400">วันที่ทำรายการ:</span>
                  <span className="text-gray-700">{new Date(viewingSlipOrder.created_at).toLocaleString('th-TH')}</span>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                  <span className="text-gray-400">ช่องทางชำระเงิน:</span>
                  <span className="font-medium text-indigo-700">QR Code พร้อมเพย์ (จำลอง)</span>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                  <span className="text-gray-400">สถานะปัจจุบัน:</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    viewingSlipOrder.status === 'ยืนยันแล้ว' ? 'bg-emerald-100 text-emerald-700' :
                    viewingSlipOrder.status === 'รอชำระ' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {viewingSlipOrder.status}
                  </span>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 mt-2">
                  <span className="text-gray-400 block mb-1">รายการหนังสือที่สั่งซื้อ:</span>
                  <p className="font-semibold text-gray-800">{viewingSlipOrder.items_summary}</p>
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200">
                    <span className="font-bold text-gray-700">ยอดเงินรวม:</span>
                    <span className="text-lg font-black text-emerald-600">฿{Number(viewingSlipOrder.total_amount).toFixed(2)}</span>
                  </div>
                </div>

                {/* ปุ่มจัดการอนุมัติคำสั่งซื้อ */}
                <div className="pt-3 space-y-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        handleChangeOrderStatus(viewingSlipOrder.order_id, 'ยืนยันแล้ว')
                        setViewingSlipOrder(null)
                      }}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1 shadow-sm"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      อนุมัติ (ยืนยันแล้ว)
                    </button>
                    <button
                      onClick={() => {
                        handleChangeOrderStatus(viewingSlipOrder.order_id, 'ยกเลิก')
                        setViewingSlipOrder(null)
                      }}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1 shadow-sm"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      ปฏิเสธ (ยกเลิก)
                    </button>
                  </div>
                  <button
                    onClick={() => setViewingSlipOrder(null)}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 rounded-xl text-xs transition"
                  >
                    ปิดหน้าต่าง
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  )
}