'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import emailjs from '@emailjs/browser'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, ShoppingBag, User, Shield, LogOut, CheckCircle, BookOpen } from 'lucide-react'

type Ebook = {
  ebook_id: number
  title: string
  author?: string
  price: number
  description: string
  cover_image: string
  category_id: number
  stock_status: string
  is_active?: boolean
}

type Category = {
  category_id: number
  category_name: string
}

type CartItem = Ebook & { quantity: number }

export default function Home() {
  const supabase = createClient()
  const router = useRouter()
  
  // กำหนดหมวดหมู่มาตรฐาน
  const categories: Category[] = [
    { category_id: 1, category_name: 'Next.js & Supabase' },
    { category_id: 2, category_name: 'TypeScript & Frontend' },
    { category_id: 3, category_name: 'Database & Backend' },
    { category_id: 4, category_name: 'UI/UX Design' }
  ]

  // รายการหนังสือสำรองพร้อมระบุผู้แต่ง
  const defaultEbooks: Ebook[] = [
    {
      ebook_id: 1,
      title: 'Next.js 14 & Supabase Masterclass',
      author: 'ดร. ธนวัฒน์ หาญณรงค์',
      price: 350,
      description: 'เรียนรู้การสร้างเว็บแอปพลิเคชัน Full-stack ระดับโปร ด้วย Next.js และ Supabase ตั้งแต่พื้นฐานจนถึงระบบ Auth และ Database จริง',
      cover_image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80',
      category_id: 1,
      stock_status: 'พร้อมจำหน่าย',
      is_active: true
    },
    {
      ebook_id: 2,
      title: 'Full-Stack Deployment & Cloud DevOps',
      author: 'อ. ธีรดา หล่อทอง',
      price: 390,
      description: 'คู่มือสำหรับนักพัฒนาในการตั้งค่าโฮสติ้งและจัดการเซิร์ฟเวอร์ด้วย Nginx, Vercel และระบบ Container แบบมืออาชีพ',
      cover_image: 'https://images.unsplash.com/photo-1618401471353-b98aedd04e11?w=600&auto=format&fit=crop&q=80',
      category_id: 1,
      stock_status: 'พร้อมจำหน่าย',
      is_active: true
    },
    {
      ebook_id: 3,
      title: 'Advanced TypeScript Handbook',
      author: 'Alex River',
      price: 290,
      description: 'เจาะลึก TypeScript สำหรับนักพัฒนาเว็บยุคใหม่ เทคนิคการเขียน Generics, Utility Types และการจัดการ Type ให้ปลอดภัยหายห่วง',
      cover_image: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=600&auto=format&fit=crop&q=80',
      category_id: 2,
      stock_status: 'พร้อมจำหน่าย',
      is_active: true
    },
    {
      ebook_id: 4,
      title: 'Tailwind CSS Design System',
      author: 'Sarah Connor',
      price: 220,
      description: 'คู่มือออกแบบและตกแต่งหน้าเว็บให้สวยงาม รวดเร็ว และรองรับทุกหน้าจอด้วย Tailwind CSS พร้อมตัวอย่างทำ Component สไตล์ Modern',
      cover_image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=600&auto=format&fit=crop&q=80',
      category_id: 2,
      stock_status: 'พร้อมจำหน่าย',
      is_active: true
    },
    {
      ebook_id: 5,
      title: 'Database Architecture & 3NF Design',
      author: 'ดร. ธนวัฒน์ หาญณรงค์',
      price: 310,
      description: 'หลักการออกแบบฐานข้อมูลเชิงสัมพันธ์ (Relational Database) ตั้งแต่ ER-Diagram, การทำ Normalization ถึงระดับ 3NF และการเขียน SQL ขั้นสูง',
      cover_image: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=600&auto=format&fit=crop&q=80',
      category_id: 3,
      stock_status: 'พร้อมจำหน่าย',
      is_active: true
    },
    {
      ebook_id: 6,
      title: 'Secure RESTful APIs with Node.js',
      author: 'John Doe',
      price: 340,
      description: 'สร้างระบบหลังบ้านที่ปลอดภัย ป้องกันช่องโหว่ OWASP Top 10 พร้อมระบบ JWT Authentication และการเข้ารหัสข้อมูลระดับองค์กร',
      cover_image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80',
      category_id: 3,
      stock_status: 'พร้อมจำหน่าย',
      is_active: true
    },
    {
      ebook_id: 7,
      title: 'UI/UX Fundamentals for Developers',
      author: 'อ. ธีรดา หล่อทอง',
      price: 270,
      description: 'เข้าใจหลักการออกแบบหน้าจอที่ใช้งานง่าย หลักการจัดวาง (Layout), สี, และ Typography ที่นักพัฒนาควรรู้เพื่อสร้างเว็บน่าดึงดูด',
      cover_image: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=600&auto=format&fit=crop&q=80',
      category_id: 4,
      stock_status: 'พร้อมจำหน่าย',
      is_active: true
    },
    {
      ebook_id: 8,
      title: 'Figma to Code Masterclass',
      author: 'Sarah Connor',
      price: 320,
      description: 'เทคนิคการแปลงไฟล์ออกแบบจาก Figma ให้กลายเป็นโค้ด Component ที่สะอาด ยืดหยุ่น และนำไปต่อยอดในโปรเจกต์จริงได้อย่างรวดเร็ว',
      cover_image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=600&auto=format&fit=crop&q=80',
      category_id: 4,
      stock_status: 'พร้อมจำหน่าย',
      is_active: true
    }
  ]

  const [ebooks, setEbooks] = useState<Ebook[]>(defaultEbooks)
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  
  // สถานะผู้ใช้
  const [user, setUser] = useState<{ email?: string; user_metadata?: { username?: string; full_name?: string } } | null>(null)

  // ตะกร้าสินค้า
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [checkoutEmail, setCheckoutEmail] = useState('')
  
  // ขั้นตอนการชำระเงิน
  const [step, setStep] = useState<'cart' | 'qrcode'>('cart')
  const [paying, setPaying] = useState(false)
  const [userRoleId, setUserRoleId] = useState<number>(2)

  const fetchSession = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      setUser(session.user)
      setCheckoutEmail(session.user.email || '')

      if (session.user.email === 'admin@gusso.com') {
        setUserRoleId(1)
      } else {
        try {
          const { data: dbUser } = await supabase.from('users').select('role_id, role').eq('id', session.user.id).single()
          if (dbUser?.role_id) {
            setUserRoleId(dbUser.role_id)
          } else if (dbUser?.role === 'author') {
            setUserRoleId(3)
          } else if (dbUser?.role === 'admin') {
            setUserRoleId(1)
          }
        } catch (e) {
          // ignore
        }

        try {
          const customRoles = JSON.parse(localStorage.getItem('gusso_custom_user_roles') || '{}')
          const override = customRoles[session.user.id] || (session.user.email ? customRoles[session.user.email] : undefined)
          if (override?.role_id) {
            setUserRoleId(override.role_id)
          }
        } catch (e) {
          // ignore
        }
      }
    }
  }, [supabase])

  const loadBooksFromDb = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('ebooks')
        .select('*')
        .eq('is_active', true)
        .order('ebook_id', { ascending: true })

      if (data && data.length > 0) {
        // กรองเฉพาะหนังสือที่อนุมัติแล้วเท่านั้น (ไม่แสดง pending หรือ rejected บนหน้าร้าน)
        const approvedOnly = data.filter(b => b.approval_status !== 'pending' && b.approval_status !== 'rejected')
        const authorsList = ['ดร. ธนวัฒน์ หาญณรงค์', 'อ. ธีรดา หล่อทอง', 'Alex River', 'Sarah Connor', 'John Doe']
        const formatted = approvedOnly.map((b, idx) => ({
          ...b,
          author: b.author || authorsList[idx % authorsList.length],
          stock_status: b.stock_status || 'พร้อมจำหน่าย',
          category_id: b.category_id || (idx % 4 + 1)
        }))
        setEbooks(formatted)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchSession()
    loadBooksFromDb()
  }, [fetchSession, loadBooksFromDb])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.refresh()
  }

  // กรองหนังสือตามหมวดหมู่และคำค้นหา (ตามข้อกำหนด 2.1)
  const filteredEbooks = ebooks.filter(book => {
    const matchesCategory = selectedCategory === null || book.category_id === selectedCategory
    const q = searchQuery.toLowerCase().trim()
    const matchesSearch = !q ||
      book.title.toLowerCase().includes(q) ||
      (book.author && book.author.toLowerCase().includes(q)) ||
      (book.description && book.description.toLowerCase().includes(q))
    return matchesCategory && matchesSearch
  })

  const addToCart = (book: Ebook) => {
    setCart(prev => {
      const existing = prev.find(item => item.ebook_id === book.ebook_id)
      if (existing) {
        return prev.map(item => 
          item.ebook_id === book.ebook_id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [...prev, { ...book, quantity: 1 }]
    })
  }

  const removeFromCart = (bookId: number) => {
    setCart(prev => prev.filter(item => item.ebook_id !== bookId))
  }

  const updateQuantity = (bookId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.ebook_id === bookId) {
        const newQty = item.quantity + delta
        return newQty > 0 ? { ...item, quantity: newQty } : item
      }
      return item
    }))
  }

  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  const proceedToCheckout = (e: React.FormEvent) => {
    e.preventDefault()
    if (!checkoutEmail) {
      alert('กรุณากรอกอีเมลสำหรับรับใบเสร็จ')
      return
    }
    if (cart.length === 0) {
      alert('ไม่มีสินค้าในตะกร้า')
      return
    }
    setStep('qrcode')
  }

  // ระบบบันทึกการซื้อ & ส่งเมลใบเสร็จพร้อมลิงก์ดาวน์โหลดจริงผ่าน EmailJS
  const handleCheckoutWithDownloadLinks = async () => {
    setPaying(true)

    try {
      const cleanCheckoutEmail = checkoutEmail.trim().toLowerCase()

      // บันทึกลงตาราง purchases
      for (const item of cart) {
        await supabase.from('purchases').insert([
          {
            user_email: cleanCheckoutEmail,
            ebook_id: item.ebook_id
          }
        ])
      }

      // บันทึกลงตาราง orders & order_items ถ้ามีในฐานข้อมูล
      try {
        const { data: orderData } = await supabase.from('orders').insert([
          {
            customer_email: cleanCheckoutEmail,
            total_amount: totalPrice,
            status: 'ยืนยันแล้ว'
          }
        ]).select().single()

        if (orderData?.order_id) {
          for (const item of cart) {
            await supabase.from('order_items').insert([
              {
                order_id: orderData.order_id,
                ebook_id: item.ebook_id,
                quantity: item.quantity,
                unit_price: item.price
              }
            ])
          }
        }
      } catch (err) {
        // ignore if orders table schema has different structure
      }

      const origin = window.location.origin
      const firstEbookId = cart[0]?.ebook_id || ''
      const defaultDownloadLink = `${origin}/download?ebook_id=${firstEbookId}`

      const itemsHtmlString = cart.map(item => {
        const downloadLink = `${origin}/download?ebook_id=${item.ebook_id}`
        return `<div style="margin-bottom: 12px; padding: 10px; background: #f9f9f9; border-radius: 6px;">
          • <b>${item.title}</b> (x${item.quantity}) : <b>฿${item.price * item.quantity}</b><br/>
          <a href="${downloadLink}" style="display: inline-block; margin-top: 6px; padding: 6px 12px; background: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 4px; font-size: 12px;">📥 ดาวน์โหลดหนังสือเล่มนี้</a>
        </div>`
      }).join('')

      const orderId = 'GS-' + Math.floor(100000 + Math.random() * 900000)

      const templateParams = {
        email: cleanCheckoutEmail,                  
        name: cleanCheckoutEmail.split('@')[0],    
        order_id: orderId,                    
        receipt_no: 'REC-' + orderId,         
        date: new Date().toLocaleString('th-TH'),    
        items_html: itemsHtmlString,          
        total_price: totalPrice.toFixed(2),
        link: defaultDownloadLink,
        download_link: defaultDownloadLink
      }

      await emailjs.send(
        'service_5t8qqtj',          
        'template_cudu5ko',         
        templateParams, 
        'rKpRB3YPhevxOZaEA'         
      )
      
      alert(`🎉 ชำระเงินสำเร็จ!\n\n📨 ระบบได้บันทึกสิทธิ์การดาวน์โหลดและส่งใบเสร็จไปยังอีเมล: ${cleanCheckoutEmail} เรียบร้อยแล้ว`)
      setCart([])
      setStep('cart')
      setIsCartOpen(false)
    } catch (error: unknown) {
      const err = error as { text?: string; message?: string }
      alert('เกิดข้อผิดพลาด: ' + (err.text || err.message || 'โปรดตรวจสอบระบบ'))
    } finally {
      setPaying(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md shadow-sm sticky top-0 z-20 px-6 py-4 border-b border-gray-100">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">📚</span>
            <span className="text-xl font-extrabold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              GusSo E-Book Store
            </span>
          </Link>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setIsCartOpen(true); setStep('cart'); }}
              className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition flex items-center gap-2 shadow-sm"
            >
              🛒 ตะกร้า ({cart.reduce((sum, item) => sum + item.quantity, 0)})
            </button>

            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/orders"
                  className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
                  title="ดูประวัติคำสั่งซื้อของฉัน"
                >
                  <ShoppingBag className="w-4 h-4 text-indigo-600" />
                  <span>คำสั่งซื้อของฉัน</span>
                </Link>

                <Link
                  href="/profile"
                  className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
                  title="แก้ไขข้อมูลส่วนตัว"
                >
                  <User className="w-4 h-4 text-violet-600" />
                  <span>โปรไฟล์</span>
                </Link>

                {(userRoleId === 3 || user.email === 'admin@gusso.com') && (
                  <Link
                    href="/author"
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl transition border border-purple-200 shadow-xs"
                    title="ห้องทำงานนักเขียน (Author Studio)"
                  >
                    <span>✍️</span>
                    <span className="hidden md:inline">ห้องทำงานนักเขียน</span>
                  </Link>
                )}

                {user.email === 'admin@gusso.com' && (
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-1 bg-amber-600 text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-amber-700 transition shadow-sm"
                  >
                    <Shield className="w-4 h-4" />
                    <span>แอดมิน</span>
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="text-red-600 hover:bg-red-50 p-2 rounded-xl text-sm font-medium transition border border-transparent hover:border-red-200"
                  title="ออกจากระบบ"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 transition shadow-sm"
              >
                เข้าสู่ระบบ
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero & Search Banner */}
      <section className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-700 text-white py-12 px-6 shadow-md mb-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-black mb-3">
            คลังหนังสือดิจิทัลสำหรับนักพัฒนา & ดีไซเนอร์
          </h1>
          <p className="text-indigo-100 text-sm sm:text-base mb-8 max-w-2xl mx-auto">
            เรียนรู้เทคโนโลยีใหม่ๆ ด้วย E-Book คุณภาพสูง สั่งซื้อง่าย ชำระเงินสะดวก ดาวน์โหลดได้ทันที
          </p>

          {/* ช่องค้นหาหนังสือ (ตรงตามข้อกำหนด 2.1) */}
          <div className="relative max-w-xl mx-auto">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อหนังสือ, ผู้แต่ง, หรือคำสำคัญ..."
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white text-gray-900 text-sm shadow-xl outline-none focus:ring-4 focus:ring-indigo-300 placeholder:text-gray-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded-full"
              >
                ล้าง
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6">
        {/* เมนูสำหรับมือถือ (แสดงถ้าล็อกอินแล้ว) */}
        {user && (
          <div className="md:hidden flex gap-2 mb-6 overflow-x-auto pb-2">
            <Link
              href="/orders"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border rounded-lg whitespace-nowrap shadow-sm"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-indigo-600" />
              คำสั่งซื้อของฉัน
            </Link>
            <Link
              href="/profile"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border rounded-lg whitespace-nowrap shadow-sm"
            >
              <User className="w-3.5 h-3.5 text-violet-600" />
              แก้ไขข้อมูลส่วนตัว
            </Link>
          </div>
        )}

        {/* แถบปุ่มเลือกหมวดหมู่หนังสือ */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap shadow-sm ${selectedCategory === null ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'}`}
          >
            🌟 ทั้งหมด ({ebooks.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.category_id}
              onClick={() => setSelectedCategory(cat.category_id)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap shadow-sm ${selectedCategory === cat.category_id ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'}`}
            >
              {cat.category_name}
            </button>
          ))}
        </div>

        {/* รายการหนังสือ */}
        {loading ? (
          <div className="text-center py-20 text-gray-500 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-3"></div>
            <p className="text-sm">กำลังโหลดรายการหนังสือ...</p>
          </div>
        ) : filteredEbooks.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            <p className="text-4xl mb-3">🔍</p>
            <h3 className="text-lg font-bold text-gray-800 mb-1">ไม่พบหนังสือที่ตรงกับคำค้นหา</h3>
            <p className="text-gray-500 text-sm mb-4">ลองค้นหาด้วยคำอื่น หรือเลือกหมวดหมู่อื่น</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory(null); }}
              className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-100 transition"
            >
              แสดงหนังสือทั้งหมด
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredEbooks.map((book) => (
              <div
                key={book.ebook_id}
                className="bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col justify-between group"
              >
                <div>
                  <div className="relative overflow-hidden bg-gray-100 h-52">
                    {book.cover_image ? (
                      <img
                        src={book.cover_image}
                        alt={book.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <BookOpen className="w-12 h-12" />
                      </div>
                    )}
                    {/* Badge สถานะพร้อมขาย (ตามข้อกำหนด 2.1) */}
                    <span className="absolute top-3 right-3 bg-emerald-500/95 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 backdrop-blur-xs">
                      <CheckCircle className="w-3 h-3" />
                      {book.stock_status || 'พร้อมจำหน่าย'}
                    </span>
                  </div>

                  <div className="p-5">
                    {/* แสดงชื่อผู้แต่ง (ตามข้อกำหนด 2.1) */}
                    <p className="text-xs text-indigo-600 font-semibold mb-1 flex items-center gap-1">
                      <span>✍️</span> {book.author || 'ทีมวิชาการ GusSo'}
                    </p>

                    <h2 className="text-base font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1 mb-2">
                      {book.title}
                    </h2>
                    
                    <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed mb-3">
                      {book.description}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0 flex items-center justify-between border-t border-gray-50 mt-2 pt-4">
                  <div>
                    <span className="text-xs text-gray-400 block">ราคา</span>
                    <span className="text-xl font-extrabold text-emerald-600">
                      ฿{Number(book.price).toFixed(2)}
                    </span>
                  </div>
                  <button
                    onClick={() => addToCart(book)}
                    className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition font-semibold text-xs shadow-md hover:shadow-indigo-200 active:scale-95"
                  >
                    + ใส่ตะกร้า
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal ตะกร้าสินค้า & QR Code */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-white w-full max-w-md h-full p-6 flex flex-col justify-between shadow-2xl overflow-y-auto">
            
            {/* STEP 1: ตะกร้าสินค้า */}
            {step === 'cart' && (
              <>
                <div>
                  <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h2 className="text-xl font-bold text-gray-800">🛒 ตะกร้าสินค้าของคุณ</h2>
                    <button
                      onClick={() => setIsCartOpen(false)}
                      className="text-gray-400 hover:text-gray-600 text-xl font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  {cart.length === 0 ? (
                    <p className="text-center text-gray-400 py-20">ยังไม่มีสินค้าในตะกร้า เลือกซื้อหนังสือสะสมได้เลย!</p>
                  ) : (
                    <div className="space-y-4 mb-6">
                      {cart.map((item) => (
                        <div key={item.ebook_id} className="flex justify-between items-center border-b pb-4">
                          <div className="flex-1 mr-3">
                            <h3 className="font-semibold text-gray-800 text-sm line-clamp-1">{item.title}</h3>
                            <p className="text-xs text-indigo-600 mb-1">✍️ {item.author || 'GusSo'}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <button
                                onClick={() => updateQuantity(item.ebook_id, -1)}
                                className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-xs font-bold"
                              >
                                -
                              </button>
                              <span className="text-xs font-semibold">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.ebook_id, 1)}
                                className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-xs font-bold"
                              >
                                +
                              </button>
                              <button
                                onClick={() => removeFromCart(item.ebook_id)}
                                className="text-[11px] text-red-500 hover:underline ml-2"
                              >
                                ลบ
                              </button>
                            </div>
                          </div>
                          <span className="font-bold text-emerald-600 text-sm">
                            ฿{(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {cart.length > 0 && (
                  <div className="border-t pt-4 space-y-4">
                    <div className="flex justify-between text-lg font-bold text-gray-800">
                      <span>ราคารวมทั้งหมด:</span>
                      <span className="text-emerald-600">฿{totalPrice.toFixed(2)}</span>
                    </div>

                    <form onSubmit={proceedToCheckout} className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          อีเมลสำหรับรับใบเสร็จ & ลิงก์ดาวน์โหลด
                        </label>
                        <input
                          type="email"
                          value={checkoutEmail}
                          onChange={(e) => setCheckoutEmail(e.target.value)}
                          placeholder="your-email@example.com"
                          className="w-full border rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-emerald-600 text-white py-3.5 rounded-xl hover:bg-emerald-700 transition font-semibold text-sm shadow-md"
                      >
                        💳 ไปยังหน้าชำระเงิน (QR Code)
                      </button>
                    </form>
                  </div>
                )}
              </>
            )}

            {/* STEP 2: QR Code ชำระเงิน */}
            {step === 'qrcode' && (
              <div className="flex flex-col h-full justify-between">
                <div>
                  <div className="flex justify-between items-center mb-4 border-b pb-3">
                    <h2 className="text-lg font-bold text-gray-800">📷 สแกนคิวอาร์โค้ดเพื่อชำระเงิน</h2>
                    <button
                      onClick={() => setStep('cart')}
                      className="text-sm text-indigo-600 hover:underline font-medium"
                    >
                      ← กลับตะกร้า
                    </button>
                  </div>

                  <div className="text-center bg-gray-50 p-6 rounded-2xl border border-gray-100 my-4">
                    <p className="text-sm text-gray-500 mb-2">ยอดชำระสุทธิ</p>
                    <p className="text-3xl font-extrabold text-emerald-600 mb-4">฿{totalPrice.toFixed(2)}</p>
                    
                    <div className="bg-white p-4 inline-block rounded-xl shadow-sm border">
                      <img
                        src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=GusSoStorePromptPayPayment"
                        alt="PromptPay QR Code"
                        className="w-44 h-44 mx-auto"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-3">PromptPay QR Code (จำลองการชำระเงิน)</p>
                  </div>

                  <div className="text-xs text-gray-500 space-y-1 bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                    <p className="font-semibold text-indigo-800">🔒 เงื่อนไขการเข้าถึงการดาวน์โหลด:</p>
                    <p>ระบบจะบันทึกสิทธิ์การดาวน์โหลดผูกกับอีเมล <span className="font-bold text-gray-800">{checkoutEmail}</span> ทันทีหลังจากยืนยันการชำระเงิน</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <button
                    onClick={handleCheckoutWithDownloadLinks}
                    disabled={paying}
                    className="w-full bg-indigo-600 text-white py-3.5 rounded-xl hover:bg-indigo-700 transition font-semibold text-sm disabled:opacity-50 shadow-md flex items-center justify-center gap-2"
                  >
                    {paying ? 'กำลังบันทึกสิทธิ์ & ส่งใบเสร็จ...' : '⚡ ยืนยันชำระเงินสำเร็จ & รับลิงก์ดาวน์โหลด'}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </main>
  )
}