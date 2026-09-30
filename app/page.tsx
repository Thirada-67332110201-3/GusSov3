'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import emailjs from '@emailjs/browser'
import { useRouter } from 'next/navigation'

type Ebook = {
  ebook_id: number
  title: string
  price: number
  description: string
  cover_image: string
  category_id: number
  stock_status: string
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

  // รายการหนังสือสุดพรีเมียม รูปสวย ตรงหมวดหมู่ ไม่ซ้ำกัน
  const mockEbooks: Ebook[] = [
    {
      ebook_id: 1,
      title: 'Next.js 14 & Supabase Masterclass',
      price: 350,
      description: 'เรียนรู้การสร้างเว็บแอปพลิเคชัน Full-stack ระดับโปร ด้วย Next.js และ Supabase ตั้งแต่พื้นฐานจนถึงระบบ Auth และ Database จริง',
      cover_image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80',
      category_id: 1,
      stock_status: 'available'
    },
    {
      ebook_id: 2,
      title: 'Full-Stack Deployment & Cloud DevOps',
      price: 390,
      description: 'คู่มือสำหรับนักพัฒนาในการตั้งค่าโฮสติ้งและจัดการเซิร์ฟเวอร์ด้วย Nginx, Vercel และระบบ Container แบบมืออาชีพ',
      cover_image: 'https://images.unsplash.com/photo-1618401471353-b98aedd04e11?w=600&auto=format&fit=crop&q=80',
      category_id: 1,
      stock_status: 'available'
    },
    {
      ebook_id: 3,
      title: 'Advanced TypeScript Handbook',
      price: 290,
      description: 'เจาะลึก TypeScript สำหรับนักพัฒนาเว็บยุคใหม่ เทคนิคการเขียน Generics, Utility Types และการจัดการ Type ให้ปลอดภัยหายห่วง',
      cover_image: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=600&auto=format&fit=crop&q=80',
      category_id: 2,
      stock_status: 'available'
    },
    {
      ebook_id: 4,
      title: 'Tailwind CSS Design System',
      price: 220,
      description: 'คู่มือออกแบบและตกแต่งหน้าเว็บให้สวยงาม รวดเร็ว และรองรับทุกหน้าจอด้วย Tailwind CSS พร้อมตัวอย่างทำ Component สไตล์ Modern',
      cover_image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=600&auto=format&fit=crop&q=80',
      category_id: 2,
      stock_status: 'available'
    },
    {
      ebook_id: 5,
      title: 'Database Architecture & 3NF Design',
      price: 310,
      description: 'หลักการออกแบบฐานข้อมูลเชิงสัมพันธ์ (Relational Database) ตั้งแต่ ER-Diagram, การทำ Normalization ถึงระดับ 3NF และการเขียน SQL ขั้นสูง',
      cover_image: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=600&auto=format&fit=crop&q=80',
      category_id: 3,
      stock_status: 'available'
    },
    {
      ebook_id: 6,
      title: 'Secure RESTful APIs with Node.js',
      price: 340,
      description: 'สร้างระบบหลังบ้านที่ปลอดภัย ป้องกันช่องโหว่ OWASP Top 10 พร้อมระบบ JWT Authentication และการเข้ารหัสข้อมูลระดับองค์กร',
      cover_image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80',
      category_id: 3,
      stock_status: 'available'
    },
    {
      ebook_id: 7,
      title: 'UI/UX Fundamentals for Developers',
      price: 270,
      description: 'เข้าใจหลักการออกแบบหน้าจอที่ใช้งานง่าย หลักการจัดวาง (Layout), สี, และ Typography ที่นักพัฒนาควรรู้เพื่อสร้างเว็บน่าดึงดูด',
      cover_image: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=600&auto=format&fit=crop&q=80',
      category_id: 4,
      stock_status: 'available'
    },
    {
      ebook_id: 8,
      title: 'Figma to Code Masterclass',
      price: 320,
      description: 'เทคนิคการแปลงไฟล์ออกแบบจาก Figma ให้กลายเป็นโค้ด Component ที่สะอาด ยืดหยุ่น และนำไปต่อยอดในโปรเจกต์จริงได้อย่างรวดเร็ว',
      cover_image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=600&auto=format&fit=crop&q=80',
      category_id: 4,
      stock_status: 'available'
    }
  ]

  const [ebooks, setEbooks] = useState<Ebook[]>(mockEbooks)
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  
  // สถานะผู้ใช้
  const [user, setUser] = useState<{ email?: string } | null>(null)

  // ตะกร้าสินค้า
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [checkoutEmail, setCheckoutEmail] = useState('')
  
  // ขั้นตอนการชำระเงิน
  const [step, setStep] = useState<'cart' | 'qrcode'>('cart')
  const [paying, setPaying] = useState(false)

  const fetchSession = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      setUser(session.user)
      setCheckoutEmail(session.user.email || '')
    }
  }, [supabase])

  useEffect(() => {
    fetchSession()
  }, [fetchSession])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.refresh()
  }

  // กรองหนังสือตามหมวดหมู่ที่เลือก
  const handleSelectCategory = (catId: number | null) => {
    setSelectedCategory(catId)
    if (catId === null) {
      setEbooks(mockEbooks)
    } else {
      setEbooks(mockEbooks.filter(b => b.category_id === catId))
    }
  }

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

      for (const item of cart) {
        await supabase.from('purchases').insert([
          {
            user_email: cleanCheckoutEmail,
            ebook_id: item.ebook_id
          }
        ])
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
      
      alert(`🎉 ชำระเงินสำเร็จ!\n\n📨 ระบบได้บันทึกสิทธิ์การดาวน์โหลดและส่งใบเสร็จไปยังอีเมล: ${checkoutEmail} เรียบร้อยแล้ว`)
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
      <header className="bg-white shadow-sm sticky top-0 z-10 px-6 py-4 flex justify-between items-center max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800">📚 GusSo E-Book Store</h1>
        
        <div className="flex items-center gap-4">
          <button
            onClick={() => { setIsCartOpen(true); setStep('cart'); }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition flex items-center gap-2 shadow-sm"
          >
            🛒 ตะกร้าสินค้า ({cart.reduce((sum, item) => sum + item.quantity, 0)})
          </button>

          {user ? (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs text-gray-400">เข้าสู่ระบบด้วย</p>
                <p className="text-sm font-semibold text-gray-800">{user.email}</p>
              </div>
              {user.email === 'admin@gusso.com' && (
                <a
                  href="/admin"
                  className="bg-amber-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 transition"
                >
                  หลังบ้านแอดมิน
                </a>
              )}
              <button
                onClick={handleLogout}
                className="bg-red-50 text-red-600 border border-red-200 px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition"
              >
                ออกจากระบบ
              </button>
            </div>
          ) : (
            <a
              href="/login"
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
            >
              เข้าสู่ระบบ
            </a>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* แถบปุ่มเลือกหมวดหมู่หนังสือ */}
        <div className="flex items-center gap-3 mb-8 overflow-x-auto pb-2">
          <button
            onClick={() => handleSelectCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition whitespace-nowrap shadow-sm ${selectedCategory === null ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border hover:bg-gray-100'}`}
          >
            🌟 หนังสือทั้งหมด ({mockEbooks.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.category_id}
              onClick={() => handleSelectCategory(cat.category_id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition whitespace-nowrap shadow-sm ${selectedCategory === cat.category_id ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border hover:bg-gray-100'}`}
            >
              {cat.category_name}
            </button>
          ))}
        </div>

        {/* รายการหนังสือ */}
        {loading ? (
          <p className="text-center text-gray-500 py-20">กำลังโหลดรายการหนังสือ...</p>
        ) : ebooks.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border p-8">
            <p className="text-gray-500 text-lg">ไม่พบรายการหนังสือในหมวดหมู่นี้</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ebooks.map((book) => (
              <div
                key={book.ebook_id}
                className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100 flex flex-col justify-between hover:shadow-lg transition"
              >
                <div>
                  {book.cover_image ? (
                    <img
                      src={book.cover_image}
                      alt={book.title}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-400">
                      ไม่มีรูปภาพปก
                    </div>
                  )}
                  <div className="p-5">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">
                      {book.title}
                    </h2>
                    <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                      {book.description}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0 flex items-center justify-between border-t border-gray-50 mt-4 pt-4">
                  <span className="text-2xl font-bold text-green-600">
                    ฿{Number(book.price).toFixed(2)}
                  </span>
                  <button
                    onClick={() => addToCart(book)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition text-sm font-medium"
                  >
                    ใส่ตะกร้า
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
                          <div>
                            <h3 className="font-semibold text-gray-800 text-sm">{item.title}</h3>
                            <p className="text-xs text-gray-500">฿{item.price} x {item.quantity}</p>
                          </div>
                          <span className="font-bold text-green-600 text-sm">
                            ฿{item.price * item.quantity}
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
                      <span className="text-green-600">฿{totalPrice.toFixed(2)}</span>
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
                          className="w-full border rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-emerald-600 text-white py-3 rounded-xl hover:bg-emerald-700 transition font-medium text-sm shadow-md"
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
                    <p className="text-3xl font-extrabold text-green-600 mb-4">฿{totalPrice.toFixed(2)}</p>
                    
                    <div className="bg-white p-4 inline-block rounded-xl shadow-sm border">
                      <img
                        src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=GusSoStorePromptPayPayment"
                        alt="PromptPay QR Code"
                        className="w-44 h-44 mx-auto"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-3">PromptPay QR Code (พร้อมเพย์)</p>
                  </div>

                  <div className="text-xs text-gray-500 space-y-1 bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                    <p className="font-semibold text-indigo-800">🔒 ระบบความปลอดภัยการดาวน์โหลด:</p>
                    <p>เมื่อกดจ่ายเงินสำเร็จ ระบบจะผูกสิทธิ์หนังสือเข้ากับอีเมล <span className="font-bold text-gray-700">{checkoutEmail}</span> ทันที</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <button
                    onClick={handleCheckoutWithDownloadLinks}
                    disabled={paying}
                    className="w-full bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 transition font-medium text-sm disabled:opacity-50 shadow-md flex items-center justify-center gap-2"
                  >
                    {paying ? 'กำลังบันทึกสิทธิ์ & ส่งใบเสร็จ...' : '⚡ จำลองสแกนจ่ายสำเร็จ & รับลิงก์ดาวน์โหลด'}
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