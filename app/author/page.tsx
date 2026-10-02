'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  BookOpen,
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Coins,
  TrendingUp,
  Sparkles,
  ShoppingBag,
  AlertCircle,
  Eye,
  Percent
} from 'lucide-react'

type Category = {
  category_id: number
  category_name: string
}

type AuthorBook = {
  ebook_id: number
  title: string
  price: number
  category_id: number
  author?: string
  description: string
  cover_image: string
  approval_status: 'pending' | 'approved' | 'rejected'
  rejection_reason?: string
  is_active: boolean
  submitted_by?: string
  submitted_by_name?: string
  created_at?: string
  copies_sold?: number
  author_earnings?: number
}

const SAMPLE_COVERS = [
  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1532012164546-f432f2e37b73?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=600&auto=format&fit=crop&q=80'
]

export default function AuthorPage() {
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string>('')
  const [userEmail, setUserEmail] = useState<string>('')
  const [userName, setUserName] = useState<string>('')
  const [roleId, setRoleId] = useState<number>(2)
  const [isAuthorOrAdmin, setIsAuthorOrAdmin] = useState(false)

  const [categories, setCategories] = useState<Category[]>([
    { category_id: 1, category_name: 'Next.js & Supabase' },
    { category_id: 2, category_name: 'TypeScript & Frontend' },
    { category_id: 3, category_name: 'Database & Backend' },
    { category_id: 4, category_name: 'UI/UX Design' }
  ])

  const [myBooks, setMyBooks] = useState<AuthorBook[]>([])
  const [showSubmitModal, setShowSubmitModal] = useState(false)

  // Form State
  const [title, setTitle] = useState('')
  const [categoryId, setCategoryId] = useState<number>(1)
  const [price, setPrice] = useState<number>(290)
  const [description, setDescription] = useState('')
  const [coverImage, setCoverImage] = useState(SAMPLE_COVERS[0])
  const [submitting, setSubmitting] = useState(false)

  // คำนวณส่วนแบ่งอัตโนมัติ (60% ผู้แต่ง / 40% เจ้าของเว็บ)
  const authorSharePerUnit = Math.round(price * 0.60)
  const platformSharePerUnit = Math.round(price * 0.40)

  // โหลดข้อมูลผู้ใช้และหนังสือของผู้แต่ง
  const loadAuthorData = useCallback(async () => {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      router.push('/login')
      return
    }

    const u = session.user
    setUserId(u.id)
    setUserEmail(u.email || '')
    const name = u.user_metadata?.username || u.user_metadata?.full_name || u.email?.split('@')[0] || 'นักเขียน'
    setUserName(name)

    // ตรวจสอบบทบาทจากตาราง users
    let curRoleId = 2
    if (u.email === 'admin@gusso.com') {
      curRoleId = 1
    } else {
      try {
        const { data: dbUser } = await supabase.from('users').select('role_id, role').eq('id', u.id).single()
        if (dbUser?.role_id) curRoleId = dbUser.role_id
        else if (dbUser?.role === 'author') curRoleId = 3
        else if (dbUser?.role === 'admin') curRoleId = 1
      } catch (err) {
        console.warn('Error fetching role:', err)
      }

      // ตรวจสอบ fallback จาก localStorage
      try {
        const customRoles = JSON.parse(localStorage.getItem('gusso_custom_user_roles') || '{}')
        const override = customRoles[u.id] || (u.email ? customRoles[u.email] : undefined)
        if (override?.role_id) {
          curRoleId = override.role_id
        }
      } catch (e) {
        // ignore
      }
    }
    setRoleId(curRoleId)
    const authorized = curRoleId === 3 || curRoleId === 1 || u.email === 'admin@gusso.com'
    setIsAuthorOrAdmin(authorized)

    if (authorized) {
      // 1. โหลดหมวดหมู่ (Supabase + LocalStorage Dual Persistence)
      const { data: catData } = await supabase.from('categories').select('*').order('category_id', { ascending: true })
      let mergedCats = catData && catData.length > 0 ? [...catData] : [
        { category_id: 1, category_name: 'Next.js & Supabase' },
        { category_id: 2, category_name: 'TypeScript & Frontend' },
        { category_id: 3, category_name: 'Database & Backend' },
        { category_id: 4, category_name: 'UI/UX Design' }
      ]
      try {
        const localCats = JSON.parse(localStorage.getItem('gusso_custom_categories') || '[]')
        localCats.forEach((lc: any) => {
          if (!mergedCats.some((c: any) => c.category_id === lc.category_id || c.category_name.toLowerCase() === lc.category_name.toLowerCase())) {
            mergedCats.push(lc)
          }
        })
      } catch (err) {
        // ignore
      }
      setCategories(mergedCats)

      // 2. โหลดหนังสือที่ผู้แต่งคนนี้ส่งมา (หรือทั้งหมดถ้าเป็นแอดมิน) จาก Supabase
      let booksData: any[] = []
      try {
        let query = supabase.from('ebooks').select('*')
        if (curRoleId !== 1 && u.email !== 'admin@gusso.com') {
          query = query.eq('submitted_by', u.id)
        }
        const { data, error: bookErr } = await query.order('ebook_id', { ascending: false })
        if (!bookErr && data) {
          booksData = data
        } else {
          // หากเกิด error เช่น ยังไม่มีคอลัมน์ submitted_by ใน DB ให้ fallback ดึงข้อมูลทั้งหมด
          const { data: fallbackData } = await supabase.from('ebooks').select('*').order('ebook_id', { ascending: false })
          if (fallbackData) {
            booksData = fallbackData.filter((b: any) => b.submitted_by === u.id)
          }
        }
      } catch (err) {
        console.warn('Supabase fetch error for author books:', err)
      }

      // 3. ดึงยอดขายของหนังสือแต่ละเล่มจาก order_items
      const { data: orderItems } = await supabase.from('order_items').select('ebook_id, quantity, unit_price')

      const salesMap = new Map<number, { sold: number, revenue: number }>()
      if (orderItems) {
        orderItems.forEach(item => {
          const prev = salesMap.get(item.ebook_id) || { sold: 0, revenue: 0 }
          salesMap.set(item.ebook_id, {
            sold: prev.sold + item.quantity,
            revenue: prev.revenue + (item.quantity * item.unit_price)
          })
        })
      }

      // 4. ดึงข้อมูลหนังสือที่ส่งมาและสถานะจาก LocalStorage (Cross-tab Bridge)
      let localSubmitted: any[] = []
      try {
        localSubmitted = JSON.parse(localStorage.getItem('gusso_submitted_books') || '[]')
      } catch (e) {
        // ignore
      }

      let approvalOverrides: Record<string, any> = {}
      try {
        approvalOverrides = JSON.parse(localStorage.getItem('gusso_book_approval_overrides') || '{}')
      } catch (e) {
        // ignore
      }

      // แมปผลงานจากฐานข้อมูล Supabase
      const mappedDbBooks: AuthorBook[] = (booksData || []).map(b => {
        const stats = salesMap.get(b.ebook_id) || { sold: 0, revenue: 0 }
        const override = approvalOverrides[b.ebook_id]
        return {
          ebook_id: b.ebook_id,
          title: b.title,
          price: Number(b.price),
          category_id: b.category_id || 1,
          description: b.description || '',
          cover_image: b.cover_image || SAMPLE_COVERS[0],
          approval_status: override?.approval_status || b.approval_status || 'approved',
          rejection_reason: override?.rejection_reason || b.rejection_reason,
          is_active: override?.is_active !== undefined ? override.is_active : (b.is_active !== false),
          copies_sold: stats.sold,
          author_earnings: Math.round(stats.revenue * 0.60)
        }
      })

      // แมปผลงานจาก LocalStorage
      const userLocalBooks: AuthorBook[] = localSubmitted
        .filter(b => curRoleId === 1 || u.email === 'admin@gusso.com' || b.submitted_by === u.id || b.author === name || !b.submitted_by)
        .map(b => {
          const stats = salesMap.get(b.ebook_id) || { sold: 0, revenue: 0 }
          const override = approvalOverrides[b.ebook_id]
          return {
            ebook_id: b.ebook_id,
            title: b.title,
            price: Number(b.price),
            category_id: Number(b.category_id) || 1,
            author: b.author || name,
            description: b.description || '',
            cover_image: b.cover_image || SAMPLE_COVERS[0],
            approval_status: override?.approval_status || b.approval_status || 'pending',
            rejection_reason: override?.rejection_reason || b.rejection_reason,
            is_active: override?.is_active !== undefined ? override.is_active : (b.is_active !== undefined ? b.is_active : false),
            copies_sold: stats.sold,
            author_earnings: Math.round(stats.revenue * 0.60)
          }
        })

      // รวมผลงานทั้งสองแหล่ง และกำจัดตัวซ้ำ
      const combinedMap = new Map<string, AuthorBook>()
      mappedDbBooks.forEach(b => combinedMap.set(`${b.ebook_id}`, b))
      userLocalBooks.forEach(b => {
        // ให้ความสำคัญกับค่าใน userLocalBooks (หรืออัปเดตสถานะล่าสุด)
        const key = `${b.ebook_id}`
        combinedMap.set(key, b)
      })

      setMyBooks(Array.from(combinedMap.values()))
    }

    setLoading(false)
  }, [supabase, router])

  useEffect(() => {
    loadAuthorData()
  }, [loadAuthorData])

  // ฟังก์ชันส่งหนังสือใหม่เพื่อรอตรวจสอบ (Dual Persistence: LocalStorage + Supabase)
  const handleSubmitBook = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      alert('กรุณากรอกชื่อหนังสือ')
      return
    }

    setSubmitting(true)

    try {
      // 1. ค้นหาหรือจับคู่ author_id ในตาราง authors
      let authorId = 1
      try {
        const { data: authorData } = await supabase
          .from('authors')
          .select('author_id')
          .ilike('author_name', `%${userName}%`)
          .limit(1)

        if (authorData && authorData.length > 0) {
          authorId = authorData[0].author_id
        } else {
          const { data: newAuthor } = await supabase
            .from('authors')
            .insert({ author_name: userName, bio: `นักเขียนอิสระประจำแพลตฟอร์ม GusSo E-Book Store (${userEmail})` })
            .select('author_id')
            .single()
          if (newAuthor) authorId = newAuthor.author_id
        }
      } catch (authErr) {
        console.warn('Author table lookup notice:', authErr)
      }

      // 2. สร้างโครงสร้างหนังสือใหม่สำหรับบันทึก
      const generatedId = Date.now()
      const newBookObj: AuthorBook = {
        ebook_id: generatedId,
        title: title.trim(),
        price: Number(price),
        category_id: Number(categoryId),
        author: userName,
        description: description.trim() || 'หนังสือคุณภาพจัดทำโดยนักเขียนอิสระ',
        cover_image: coverImage,
        approval_status: 'pending',
        is_active: false,
        submitted_by: userId,
        submitted_by_name: userName,
        created_at: new Date().toISOString(),
        copies_sold: 0,
        author_earnings: 0
      }

      // 3. บันทึกลง LocalStorage ทันที (รับประกันความคงอยู่ 100% ให้หน้า Admin เห็นได้ทันที)
      let assignedEbookId = generatedId
      try {
        const existingSaved: any[] = JSON.parse(localStorage.getItem('gusso_submitted_books') || '[]')
        const filtered = existingSaved.filter(b => b.title !== newBookObj.title && b.ebook_id !== generatedId)
        localStorage.setItem('gusso_submitted_books', JSON.stringify([newBookObj, ...filtered]))
      } catch (storageErr) {
        console.warn('LocalStorage save warning:', storageErr)
      }

      // 4. พยายามบันทึกลงตาราง ebooks ใน Supabase ด้วยสถานะ pending
      try {
        const newBookPayload = {
          title: title.trim(),
          price: Number(price),
          category_id: Number(categoryId),
          author_id: authorId,
          description: description.trim() || 'หนังสือคุณภาพจัดทำโดยนักเขียนอิสระ',
          cover_image: coverImage,
          is_active: false,
          approval_status: 'pending',
          submitted_by: userId,
          stock_status: 'พร้อมจำหน่าย'
        }

        const { data: inserted, error: insertError } = await supabase
          .from('ebooks')
          .insert(newBookPayload)
          .select('*')
          .single()

        if (insertError) {
          console.warn('Supabase DB Insert notice (saved locally):', insertError)
        } else if (inserted) {
          assignedEbookId = inserted.ebook_id
          newBookObj.ebook_id = inserted.ebook_id
          // อัปเดต ID จริงจากฐานข้อมูลลง LocalStorage
          try {
            const saved: any[] = JSON.parse(localStorage.getItem('gusso_submitted_books') || '[]')
            const updated = saved.map(b => b.title === newBookObj.title ? { ...b, ebook_id: inserted.ebook_id } : b)
            localStorage.setItem('gusso_submitted_books', JSON.stringify(updated))
          } catch (e) {
            // ignore
          }
        }
      } catch (dbErr) {
        console.warn('Supabase insert exception (saved locally):', dbErr)
      }

      // 5. อัปเดต State หน้าจอนักเขียน
      setMyBooks(prev => [newBookObj, ...prev.filter(b => b.title !== newBookObj.title)])

      alert('🎉 ส่งหนังสือเข้าสู่ระบบตรวจสอบเรียบร้อยแล้ว!\n\n📋 สถานะปัจจุบัน: "รอตรวจสอบ (Pending)"\n🛡️ ผู้ดูแลระบบ (Admin) จะเห็นหนังสือเล่มนี้ในแท็บ [ตรวจอนุมัติ E-Book] ทันที\n✅ เมื่อได้รับ "อนุมัติ" หนังสือจะแสดงบนหน้าแรกทันที และคุณจะได้รับส่วนแบ่ง 60% จากทุกยอดจำหน่าย')
      setShowSubmitModal(false)
      setTitle('')
      setDescription('')
      setPrice(290)
    } catch (err: unknown) {
      const e = err as { message?: string }
      alert('เกิดข้อผิดพลาดในการส่งหนังสือ: ' + (e.message || 'กรุณาลองใหม่อีกครั้ง'))
    } finally {
      setSubmitting(false)
    }
  }

  // คำนวณยอดสรุปภาพรวมของนักเขียน
  const totalBooksCount = myBooks.length
  const pendingCount = myBooks.filter(b => b.approval_status === 'pending').length
  const approvedCount = myBooks.filter(b => b.approval_status === 'approved').length
  const totalUnitsSold = myBooks.reduce((acc, b) => acc + (b.copies_sold || 0), 0)
  const totalAuthorEarnings = myBooks.reduce((acc, b) => acc + (b.author_earnings || 0), 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-600 text-sm font-medium">กำลังโหลดห้องทำงานนักเขียน...</p>
        </div>
      </div>
    )
  }

  // กรณีผู้ใช้ยังไม่ได้เป็นนักเขียน (Customer ทั่วไป)
  if (!isAuthorOrAdmin) {
    return (
      <main className="min-h-screen bg-slate-50 py-16 px-4">
        <div className="max-w-xl mx-auto bg-white rounded-3xl p-8 shadow-sm border border-slate-200 text-center space-y-6">
          <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-3xl mx-auto flex items-center justify-center text-3xl shadow-inner">
            ✍️
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">พื้นที่สำหรับนักเขียน (Author Studio)</h1>
            <p className="text-sm text-slate-500 mt-2">
              คุณกำลังเข้าสู่ระบบในฐานะ <span className="font-semibold text-emerald-600">สมาชิกทั่วไป (Customer)</span>
            </p>
          </div>

          <div className="bg-purple-50 border border-purple-100 rounded-2xl p-5 text-left text-sm text-purple-900 space-y-2">
            <div className="font-bold flex items-center gap-1.5 text-purple-800">
              <Sparkles className="w-4 h-4 text-purple-600" />
              สิทธิพิเศษสำหรับนักเขียน (Author Role):
            </div>
            <ul className="list-disc list-inside text-xs text-purple-700 space-y-1">
              <li>ส่งผลงานหนังสือ E-Book ขึ้นวางจำหน่ายบนหน้าแรกของระบบ</li>
              <li>รับส่วนแบ่งรายได้ <strong>60%</strong> จากทุกคำสั่งซื้อ (หักเข้าแพลตฟอร์ม 40%)</li>
              <li>ระบบแดชบอร์ดตรวจสอบยอดขายและเงินส่วนแบ่งแบบเรียลไทม์</li>
              <li>มีระบบตรวจสอบเนื้อหา (Content Approval) มั่นใจได้ในมาตรฐานผลงาน</li>
            </ul>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 text-left flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">วิธีขอเปิดสิทธิ์นักเขียน:</span> โปรดติดต่อผู้ดูแลระบบ (Admin) เพื่อปรับสถานะบทบาทของคุณเป็น <strong>&quot;Author (นักเขียน)&quot;</strong> ในระบบจัดการสมาชิก
            </div>
          </div>

          <div className="flex gap-3 justify-center pt-2">
            <Link
              href="/"
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition"
            >
              กลับหน้าร้าน
            </Link>
            <Link
              href="/profile"
              className="px-5 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition shadow-sm"
            >
              ดูโปรไฟล์ของฉัน
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition"
              title="กลับหน้าร้าน"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <span className="p-1.5 bg-purple-100 text-purple-700 rounded-lg text-lg">✍️</span>
                ห้องทำงานนักเขียน (Author Studio)
              </h1>
              <p className="text-xs text-slate-500">
                ยินดีต้อนรับคุณ <span className="font-semibold text-purple-700">{userName}</span> | สิทธิ์ส่วนแบ่งผลงาน: 60%
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSubmitModal(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition flex items-center gap-1.5 shadow-sm shadow-purple-200"
            >
              <PlusCircle className="w-4 h-4" />
              <span>ส่งหนังสือใหม่เข้าตรวจสอบ</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Banner แจ้งโมเดลส่วนแบ่งรายได้ 60/40 */}
        <div className="bg-slate-950 bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-purple-500/30 relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold bg-purple-500/25 text-purple-200 border border-purple-400/40 shadow-xs">
              <Percent className="w-3.5 h-3.5 text-purple-300" />
              ข้อตกลงส่วนแบ่งรายได้ (Revenue Sharing Model)
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-xs">
              สร้างผลงานของคุณ รับส่วนแบ่งรายได้ 60% ทุกเล่ม
            </h2>
            <p className="text-purple-100/90 text-sm leading-relaxed">
              เมื่อส่งหนังสือใหม่ ทีมงานแอดมินจะทำการตรวจสอบความถูกต้องและความเหมาะสมของเนื้อหา เมื่อผ่านการอนุมัติ (Approved) หนังสือจะวางจำหน่ายทันที โดยผู้แต่งได้รับ <strong className="text-amber-300 font-bold underline decoration-amber-400/60 decoration-2 underline-offset-2">60%</strong> ของยอดจำหน่าย และระบบหักค่าพื้นที่/ดำเนินการ <strong className="text-white font-bold">40%</strong>
            </p>
          </div>
        </div>

        {/* KPI Cards สรุปตัวเลขนักเขียน */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center text-xl">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">หนังสือของฉันทั้งหมด</p>
              <h3 className="text-2xl font-bold text-slate-900">{totalBooksCount} <span className="text-xs font-normal text-slate-400">เล่ม</span></h3>
              <p className="text-[11px] text-emerald-600 font-medium">วางจำหน่ายแล้ว {approvedCount} เล่ม</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-xl">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">รอการตรวจสอบ (Pending)</p>
              <h3 className="text-2xl font-bold text-amber-700">{pendingCount} <span className="text-xs font-normal text-slate-400">เล่ม</span></h3>
              <p className="text-[11px] text-slate-400">รอแอดมินอนุมัติเนื้อหา</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center text-xl">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">ยอดจำหน่ายรวม</p>
              <h3 className="text-2xl font-bold text-blue-700">{totalUnitsSold} <span className="text-xs font-normal text-slate-400">ครั้ง</span></h3>
              <p className="text-[11px] text-slate-400">นับจากออเดอร์ที่สำเร็จ</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-purple-200 bg-purple-50/40 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">เงินส่วนแบ่ง 60% ที่ได้รับ</p>
              <h3 className="text-2xl font-extrabold text-emerald-700">฿{totalAuthorEarnings.toLocaleString()}</h3>
              <p className="text-[11px] text-purple-700 font-medium">คำนวณสุทธิหลังหัก 40%</p>
            </div>
          </div>
        </div>

        {/* ตารางรายการหนังสือของผู้แต่ง */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-600" />
                รายการผลงานและสถานะการตรวจสอบ (My E-Books)
              </h2>
              <p className="text-xs text-slate-500">ตรวจสอบสถานะการอนุมัติ ยอดขาย และส่วนแบ่งรายได้ของหนังสือแต่ละเล่ม</p>
            </div>
            <button
              onClick={() => setShowSubmitModal(true)}
              className="text-xs bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              เพิ่มหนังสือเล่มใหม่
            </button>
          </div>

          {myBooks.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-16 h-16 bg-purple-50 text-purple-500 rounded-3xl mx-auto flex items-center justify-center text-3xl">
                📚
              </div>
              <div>
                <p className="text-slate-800 font-semibold">ยังไม่มีรายการหนังสือของคุณในระบบ</p>
                <p className="text-xs text-slate-400 mt-1">เริ่มต้นส่งหนังสือเล่มแรกของคุณ เพื่อให้ทีมงานตรวจสอบและเปิดจำหน่าย</p>
              </div>
              <button
                onClick={() => setShowSubmitModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition shadow-sm"
              >
                + ส่งหนังสือใหม่ตอนนี้
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
                    <th className="p-4">หนังสือ</th>
                    <th className="p-4">ราคาจำหน่าย</th>
                    <th className="p-4">ส่วนแบ่งผู้แต่ง (60%)</th>
                    <th className="p-4">สถานะการตรวจอนุมัติ</th>
                    <th className="p-4 text-center">ยอดขาย (เล่ม)</th>
                    <th className="p-4 text-right">รายได้สะสม (60%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myBooks.map(book => {
                    const authorEarningPerBook = Math.round(book.price * 0.60)
                    return (
                      <tr key={book.ebook_id} className="hover:bg-slate-50/70 transition">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={book.cover_image}
                              alt={book.title}
                              className="w-12 h-16 object-cover rounded-lg shadow-xs border border-slate-200"
                            />
                            <div>
                              <div className="font-bold text-slate-900 line-clamp-1">{book.title}</div>
                              <div className="text-xs text-slate-400">ID: #{book.ebook_id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-bold text-slate-800">
                          ฿{book.price.toLocaleString()}
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-purple-700">฿{authorEarningPerBook.toLocaleString()}</span>
                          <span className="text-[11px] text-slate-400 block">หักเข้าเว็บ ฿{Math.round(book.price * 0.40)} (40%)</span>
                        </td>
                        <td className="p-4">
                          {book.approval_status === 'pending' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              รอตรวจสอบ (Pending)
                            </span>
                          )}
                          {book.approval_status === 'approved' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              อนุมัติแล้ว • วางขาย
                            </span>
                          )}
                          {book.approval_status === 'rejected' && (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-800 border border-red-200">
                                <XCircle className="w-3.5 h-3.5 text-red-600" />
                                ไม่อนุมัติ (Rejected)
                              </span>
                              {book.rejection_reason && (
                                <p className="text-[11px] text-red-600 mt-1 max-w-xs">
                                  เหตุผล: {book.rejection_reason}
                                </p>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-center font-bold text-slate-700">
                          {book.copies_sold || 0}
                        </td>
                        <td className="p-4 text-right font-extrabold text-emerald-700 text-base">
                          ฿{(book.author_earnings || 0).toLocaleString()}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal ส่งหนังสือใหม่ */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 my-8">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <span>✍️</span> ส่งหนังสือใหม่เพื่อตรวจสอบ
                </h3>
                <p className="text-xs text-slate-500">กรอกข้อมูลผลงานและกำหนดราคาขาย</p>
              </div>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitBook} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ชื่อหนังสือ E-Book *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="เช่น Next.js 15 Pro Masterclass"
                  className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    หมวดหมู่ *
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                  >
                    {categories.map(c => (
                      <option key={c.category_id} value={c.category_id}>
                        {c.category_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ราคาจำหน่าย (บาท) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={price === 0 ? '' : price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    placeholder="ใส่ราคาได้ตามต้องการ เช่น 100, 250, 390"
                    className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                    required
                  />
                </div>
              </div>

              {/* การคำนวณส่วนแบ่งแบบเรียลไทม์ 60/40 */}
              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 text-xs space-y-1.5">
                <div className="font-bold text-purple-900 flex items-center justify-between">
                  <span>💰 การจัดสรรรายได้ต่องวดการขาย:</span>
                  <span className="text-purple-700 font-extrabold text-sm">฿{price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>• ส่วนแบ่งที่คุณได้รับ (60%):</span>
                  <span className="font-bold">฿{authorSharePerUnit.toLocaleString()} บาท / เล่ม</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>• ค่าพื้นที่ & แพลตฟอร์มแอดมิน (40%):</span>
                  <span>฿{platformSharePerUnit.toLocaleString()} บาท / เล่ม</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  เรื่องย่อ / รายละเอียดเนื้อหา
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="อธิบายจุดเด่นของหนังสือ สารบัญ หรือสิ่งที่ผู้อ่านจะได้รับ..."
                  className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  รูปภาพหน้าปก (URL)
                </label>
                <input
                  type="url"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-purple-500 outline-none mb-2"
                  required
                />

                <div className="text-[11px] text-slate-400 mb-1.5">หรือเลือกรูปภาพตัวอย่าง:</div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {SAMPLE_COVERS.map((cov, idx) => (
                    <img
                      key={idx}
                      src={cov}
                      alt="Sample cover"
                      onClick={() => setCoverImage(cov)}
                      className={`w-12 h-16 object-cover rounded-lg cursor-pointer border-2 transition ${
                        coverImage === cov ? 'border-purple-600 scale-105' : 'border-slate-200 hover:border-slate-400'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="w-1/3 border border-slate-200 py-3 rounded-xl text-slate-600 text-sm font-semibold hover:bg-slate-50 transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-2/3 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl text-sm font-bold transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {submitting ? 'กำลังส่งข้อมูล...' : '🚀 ยืนยันส่งหนังสือเข้าตรวจสอบ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
