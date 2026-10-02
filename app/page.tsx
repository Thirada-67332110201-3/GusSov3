'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import emailjs from '@emailjs/browser'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, ShoppingBag, User, Shield, LogOut, CheckCircle, BookOpen, Star, MessageSquare, Clock, Flame, Sparkles, Tag, CreditCard, ArrowRight, QrCode, Gift, Award, Coins, Eye, LayoutGrid } from 'lucide-react'
import { UNIQUE_EBOOKS_METADATA, BookReview } from '@/lib/books-data'
import { getWeeklyPeriodInfo, getBookPromotionPricing, WeeklyPromotionCampaign } from '@/lib/promotions'
import { getGussoCoins, spendGussoCoins, unlockBadge } from '@/lib/gamification'
import { Bookshelf3D } from '@/components/bookshelf-3d'
import { InteractivePageFlipReader } from '@/components/interactive-page-flip-reader'
import { MysteryBoxModal } from '@/components/mystery-box-modal'
import { AiBookAdvisor } from '@/components/ai-book-advisor'
import { AiBookSummarizerModal } from '@/components/ai-book-summarizer-modal'
import { ThemeToggleCyberpunk } from '@/components/theme-toggle-cyberpunk'

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
  approval_status?: 'pending' | 'approved' | 'rejected'
  rejection_reason?: string
  rating?: number
  total_reviews?: number
}

type Category = {
  category_id: number
  category_name: string
}

type CartItem = Ebook & {
  quantity: number
  original_price?: number
  discount_amount?: number
}

export default function Home() {
  const supabase = createClient()
  const router = useRouter()
  
  // กำหนดหมวดหมู่มาตรฐาน
  const defaultCategories: Category[] = [
    { category_id: 1, category_name: 'Next.js & Supabase' },
    { category_id: 2, category_name: 'TypeScript & Frontend' },
    { category_id: 3, category_name: 'Database & Backend' },
    { category_id: 4, category_name: 'UI/UX Design' }
  ]
  const [categories, setCategories] = useState<Category[]>(defaultCategories)

  // รายการหนังสือมาตรฐานทั้ง 13 เล่มที่หลากหลาย ไม่ซ้ำกัน
  const defaultEbooks: Ebook[] = Object.entries(UNIQUE_EBOOKS_METADATA).map(([id, meta]) => ({
    ebook_id: Number(id),
    title: meta.title,
    author: meta.author,
    price: meta.price,
    description: meta.description,
    cover_image: meta.cover_image,
    category_id: meta.category_id,
    stock_status: 'พร้อมจำหน่าย',
    is_active: true,
    rating: meta.rating,
    total_reviews: meta.total_reviews
  }))

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

  // สถานะระบบให้คะแนนดาว 1-5 ดาว และเขียนรีวิว
  const [ratingModalBook, setRatingModalBook] = useState<Ebook | null>(null)
  const [bookReviews, setBookReviews] = useState<BookReview[]>([])
  const [loadingReviews, setLoadingReviews] = useState(false)
  const [userRating, setUserRating] = useState<number>(5)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [reviewerName, setReviewerName] = useState<string>('')
  const [reviewComment, setReviewComment] = useState<string>('')
  const [submittingReview, setSubmittingReview] = useState<boolean>(false)
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState<string>('')

  // ระบบโปรโมชั่นเปลี่ยนรายอาทิตย์ (Weekly Promotions)
  const [weeklyInfo, setWeeklyInfo] = useState(() => getWeeklyPeriodInfo())
  const [isPromotionActive, setIsPromotionActive] = useState<boolean>(true)
  const [countdown, setCountdown] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  })
  const [promoFilterOnly, setPromoFilterOnly] = useState<boolean>(false)

  // สลับมุมมอง: 'grid' (ตารางปกติ) vs 'bookshelf' (ชั้นไม้ 3D)
  const [viewMode, setViewMode] = useState<'grid' | 'bookshelf'>('grid')

  // สถานะ Gamification & กล่องสุ่ม
  const [userCoins, setUserCoins] = useState<number>(150)
  const [showMysteryBox, setShowMysteryBox] = useState<boolean>(false)
  const [useCoinsInCart, setUseCoinsInCart] = useState<boolean>(false)

  // สถานะ Modal สำหรับอ่าน 3D และสรุป AI
  const [readerBook, setReaderBook] = useState<any | null>(null)
  const [summaryBook, setSummaryBook] = useState<any | null>(null)

  useEffect(() => {
    setUserCoins(getGussoCoins())
    const handleCoinsUpdate = (e: any) => {
      if (e.detail?.coins !== undefined) {
        setUserCoins(e.detail.coins)
      }
    }
    window.addEventListener('gusso_coins_updated', handleCoinsUpdate)
    return () => window.removeEventListener('gusso_coins_updated', handleCoinsUpdate)
  }, [])

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
        .order('ebook_id', { ascending: true })

      // ดึงข้อมูลหนังสือที่ส่งมา และ override จาก LocalStorage
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

      let allBooks: Ebook[] = (data || []).map((b) => {
        const meta = UNIQUE_EBOOKS_METADATA[b.ebook_id]
        const override = approvalOverrides[b.ebook_id]
        return {
          ...b,
          title: meta?.title || b.title,
          author: meta?.author || b.author || 'ดร. ธนวัฒน์ หาญณรงค์',
          price: Number(b.price || meta?.price || 290),
          description: meta?.description || b.description,
          cover_image: meta?.cover_image || b.cover_image,
          category_id: meta?.category_id || b.category_id || 1,
          stock_status: b.stock_status || 'พร้อมจำหน่าย',
          approval_status: override?.approval_status || b.approval_status || 'approved',
          is_active: override?.is_active !== undefined ? override.is_active : (b.is_active !== false),
          rating: Number(b.rating || meta?.rating || 5.0),
          total_reviews: Number(b.total_reviews || meta?.total_reviews || 1)
        }
      })

      // รวมหนังสือใหม่จาก LocalStorage ที่ผ่านการอนุมัติแล้ว
      localSubmitted.forEach(lb => {
        const override = approvalOverrides[lb.ebook_id]
        const finalStatus = override?.approval_status || lb.approval_status || 'pending'
        const finalActive = override?.is_active !== undefined ? override.is_active : (lb.is_active !== undefined ? lb.is_active : false)
        const existingIdx = allBooks.findIndex(b => b.ebook_id === lb.ebook_id || (b.title && b.title === lb.title))
        if (existingIdx >= 0) {
          allBooks[existingIdx] = {
            ...allBooks[existingIdx],
            ...lb,
            approval_status: finalStatus,
            is_active: finalActive
          }
        } else {
          allBooks.push({
            ebook_id: lb.ebook_id,
            title: lb.title,
            author: lb.author || lb.submitted_by_name || 'นักเขียนอิสระ',
            price: Number(lb.price || 290),
            category_id: Number(lb.category_id || 1),
            description: lb.description || '',
            cover_image: lb.cover_image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
            stock_status: 'พร้อมจำหน่าย',
            approval_status: finalStatus,
            is_active: finalActive,
            rating: lb.rating || 5.0,
            total_reviews: lb.total_reviews || 1
          })
        }
      })

      // กรองเฉพาะหนังสือที่ได้รับ "อนุมัติ" และเปิดจำหน่าย (is_active = true) เท่านั้น
      const approvedOnly = allBooks.filter(b => b.approval_status === 'approved' && b.is_active === true)
      setEbooks(approvedOnly)

      // โหลดหมวดหมู่จาก Supabase และ LocalStorage (Dual Persistence Bridge)
      try {
        const { data: catData } = await supabase.from('categories').select('*').order('category_id', { ascending: true })
        let mergedCats: Category[] = catData && catData.length > 0 ? [...catData] : [...defaultCategories]
        try {
          const localCats: Category[] = JSON.parse(localStorage.getItem('gusso_custom_categories') || '[]')
          localCats.forEach(lc => {
            const idx = mergedCats.findIndex(c => c.category_id === lc.category_id || c.category_name.toLowerCase() === lc.category_name.toLowerCase())
            if (idx >= 0) {
              mergedCats[idx] = { ...mergedCats[idx], ...lc }
            } else {
              mergedCats.push(lc)
            }
          })
        } catch (err) {
          // ignore
        }
        setCategories(mergedCats)
      } catch (err) {
        console.warn('Error loading categories in homepage:', err)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const openReviewModal = async (book: Ebook) => {
    setRatingModalBook(book)
    setUserRating(5)
    setHoverRating(0)
    setReviewComment('')
    setReviewSuccessMsg('')
    const currentName = user?.user_metadata?.full_name || user?.user_metadata?.username || user?.email?.split('@')[0] || ''
    setReviewerName(currentName)
    setLoadingReviews(true)

    try {
      // 1. ดึงจาก Supabase
      const { data } = await supabase
        .from('book_reviews')
        .select('*')
        .eq('ebook_id', book.ebook_id)
        .order('created_at', { ascending: false })

      // 2. ดึงจาก localStorage
      const localReviews: BookReview[] = JSON.parse(
        localStorage.getItem(`gusso_book_reviews_${book.ebook_id}`) || '[]'
      )

      if (data && data.length > 0) {
        const combined = [...localReviews, ...data]
        const uniqueReviews = combined.filter((v, i, a) => a.findIndex(t => (t.review_id && t.review_id === v.review_id) || (t.comment === v.comment && t.user_name === v.user_name)) === i)
        setBookReviews(uniqueReviews)
      } else if (localReviews.length > 0) {
        setBookReviews(localReviews)
      } else {
        const defaultSampleReviews: BookReview[] = [
          {
            ebook_id: book.ebook_id,
            user_name: 'สมเกียรติ พัฒนา',
            rating: 5,
            comment: 'เนื้อหาดีมากครับ ตัวอย่างเข้าใจง่าย นำไปประยุกต์ใช้ในโปรเจกต์จริงได้ทันที',
            created_at: new Date(Date.now() - 86400000 * 2).toISOString()
          },
          {
            ebook_id: book.ebook_id,
            user_name: 'ธนวัฒน์ โปรแกรมเมอร์',
            rating: Math.min(5, Math.max(4, Math.round(book.rating || 5))),
            comment: 'อธิบายกระชับ รูปเล่มและตัวอย่างโค้ดอ่านสบายตา แนะนำสำหรับทุกคนครับ',
            created_at: new Date(Date.now() - 86400000 * 5).toISOString()
          }
        ]
        setBookReviews(defaultSampleReviews)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingReviews(false)
    }
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ratingModalBook) return
    if (!reviewerName.trim()) {
      alert('กรุณากรอกชื่อของคุณ')
      return
    }
    if (!reviewComment.trim()) {
      alert('กรุณาเขียนความคิดเห็นสั้นๆ')
      return
    }

    setSubmittingReview(true)
    const newReview: BookReview = {
      ebook_id: ratingModalBook.ebook_id,
      user_name: reviewerName.trim(),
      user_email: user?.email || undefined,
      rating: userRating,
      comment: reviewComment.trim(),
      created_at: new Date().toISOString()
    }

    try {
      const { data } = await supabase.from('book_reviews').insert([
        {
          ebook_id: ratingModalBook.ebook_id,
          user_name: newReview.user_name,
          user_email: newReview.user_email,
          rating: newReview.rating,
          comment: newReview.comment
        }
      ]).select()

      if (data && data[0]) {
        newReview.review_id = data[0].review_id
      }
    } catch (err) {
      console.warn('Supabase insert review skipped:', err)
    }

    // บันทึกสำรองลง localStorage ทันที
    const existing = JSON.parse(localStorage.getItem(`gusso_book_reviews_${ratingModalBook.ebook_id}`) || '[]')
    localStorage.setItem(`gusso_book_reviews_${ratingModalBook.ebook_id}`, JSON.stringify([newReview, ...existing]))

    // ปรับปรุงรายการรีวิวในหน้าจอ
    setBookReviews(prev => [newReview, ...prev])

    // คำนวณคะแนนดาวเฉลี่ยใหม่
    const curRating = Number(ratingModalBook.rating || 5.0)
    const curReviews = Number(ratingModalBook.total_reviews || 1)
    const nextReviews = curReviews + 1
    const nextRating = Number(((curRating * curReviews + userRating) / nextReviews).toFixed(1))

    // อัปเดตใน state ebooks ทันที
    setEbooks(prev => prev.map(b => b.ebook_id === ratingModalBook.ebook_id ? { ...b, rating: nextRating, total_reviews: nextReviews } : b))
    setRatingModalBook(prev => prev ? { ...prev, rating: nextRating, total_reviews: nextReviews } : null)

    try {
      await supabase.from('ebooks').update({
        rating: nextRating,
        total_reviews: nextReviews
      }).eq('ebook_id', ratingModalBook.ebook_id)
    } catch (e) {
      // ignore
    }

    setReviewComment('')
    setReviewSuccessMsg('🎉 ขอบคุณสำหรับคะแนนรีวิวของคุณ! คะแนนดาวได้รับการอัปเดตแล้ว')
    setSubmittingReview(false)
    setTimeout(() => setReviewSuccessMsg(''), 4000)
  }

  useEffect(() => {
    fetchSession()
    loadBooksFromDb()
  }, [fetchSession, loadBooksFromDb])

  // ตัวนับเวลาถอยหลังโปรโมชั่นประจำสัปดาห์ (รีเซ็ตอัตโนมัติทุกเที่ยงคืนวันอาทิตย์)
  useEffect(() => {
    try {
      const savedPromo = localStorage.getItem('gusso_weekly_promo_enabled')
      if (savedPromo !== null) {
        setIsPromotionActive(savedPromo === 'true')
      }
    } catch (e) {
      // ignore
    }

    const updateCountdown = () => {
      const info = getWeeklyPeriodInfo(new Date())
      setWeeklyInfo(info)
      const now = new Date().getTime()
      const distance = info.endOfWeek.getTime() - now

      if (distance <= 0) {
        setWeeklyInfo(getWeeklyPeriodInfo(new Date()))
      } else {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24))
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((distance % (1000 * 60)) / 1000)
        setCountdown({ days, hours, minutes, seconds })
      }
    }

    updateCountdown()
    const timer = setInterval(updateCountdown, 1000)
    return () => clearInterval(timer)
  }, [])

  // ซิงค์ตะกร้าสินค้ากับ localStorage เพื่อให้หน้าแท็บชำระเงิน (/checkout) นำไปแสดงผลได้ทันที
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('gusso_cart')
      if (savedCart) {
        const parsed = JSON.parse(savedCart)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCart(parsed)
        }
      }
    } catch (e) {
      // ignore
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('gusso_cart', JSON.stringify(cart))
    } catch (e) {
      // ignore
    }
  }, [cart])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.refresh()
  }

  // กรองหนังสือตามหมวดหมู่ คำค้นหา และตัวกรองเฉพาะโปรโมชั่น
  const filteredEbooks = ebooks.filter(book => {
    const matchesCategory = selectedCategory === null || book.category_id === selectedCategory
    const q = searchQuery.toLowerCase().trim()
    const matchesSearch = !q ||
      book.title.toLowerCase().includes(q) ||
      (book.author && book.author.toLowerCase().includes(q)) ||
      (book.description && book.description.toLowerCase().includes(q))

    if (promoFilterOnly && isPromotionActive) {
      const pricing = getBookPromotionPricing(book, weeklyInfo.activeCampaign, isPromotionActive)
      if (!pricing.isDiscounted) return false
    }

    return matchesCategory && matchesSearch
  })

  const addToCart = (book: Ebook) => {
    // คำนวณราคาโปรโมชั่นรายอาทิตย์ (การันตีไม่มีทางเป็น 0 หรือติดลบ)
    const pricing = getBookPromotionPricing(book, weeklyInfo.activeCampaign, isPromotionActive)
    const effectivePrice = pricing.finalPrice

    setCart(prev => {
      const existing = prev.find(item => item.ebook_id === book.ebook_id)
      if (existing) {
        return prev.map(item => 
          item.ebook_id === book.ebook_id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [
        ...prev,
        {
          ...book,
          price: effectivePrice,
          original_price: book.price,
          discount_amount: pricing.discountAmount,
          quantity: 1
        }
      ]
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
  const totalSavings = cart.reduce((sum, item) => {
    const orig = item.original_price || item.price
    const diff = Math.max(0, orig - item.price)
    return sum + (diff * item.quantity)
  }, 0)

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
        to_email: cleanCheckoutEmail,
        email: cleanCheckoutEmail,
        user_email: cleanCheckoutEmail,
        reply_to: cleanCheckoutEmail,
        to_name: cleanCheckoutEmail.split('@')[0],
        name: cleanCheckoutEmail.split('@')[0],
        order_id: orderId,
        receipt_no: 'REC-' + orderId,
        date: new Date().toLocaleString('th-TH'),
        items_html: itemsHtmlString,
        total_price: totalPrice.toFixed(2),
        link: defaultDownloadLink,
        download_link: defaultDownloadLink
      }

      console.log('Sending EmailJS receipt to:', cleanCheckoutEmail, templateParams)
      try {
        const emailRes = await emailjs.send(
          'service_5t8qqtj',          
          'template_cudu5ko',         
          templateParams, 
          'rKpRB3YPhevxOZaEA'         
        )
        console.log('EmailJS response:', emailRes)
      } catch (mailErr: any) {
        console.warn('EmailJS send notice:', mailErr)
      }
      
      alert(`🎉 ชำระเงินสำเร็จ!\n\n📨 ระบบได้บันทึกสิทธิ์การดาวน์โหลดและส่งใบเสร็จไปยังอีเมล: ${cleanCheckoutEmail} เรียบร้อยแล้ว\n(หากไม่พบในกล่องข้อความหลัก โปรดตรวจสอบในโฟลเดอร์ "จดหมายขยะ / Spam" ด้วยนะครับ)`)
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

  // ฟังก์ชันบันทึกคำสั่งซื้อไว้ก่อน (สถานะ "รอชำระ") สำหรับลูกค้าที่ลืมชำระ หรือต้องการชำระเงินภายหลัง
  const handleSavePendingOrder = async () => {
    setPaying(true)
    try {
      const cleanCheckoutEmail = checkoutEmail.trim().toLowerCase()
      if (!cleanCheckoutEmail) {
        alert('กรุณากรอกอีเมลสำหรับรับข้อมูลคำสั่งซื้อ')
        setPaying(false)
        return
      }

      // บันทึกลงตาราง orders ด้วยสถานะ "รอชำระ"
      const { data: orderData, error: orderErr } = await supabase.from('orders').insert([
        {
          customer_email: cleanCheckoutEmail,
          total_amount: totalPrice,
          status: 'รอชำระ'
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

      alert(`📋 บันทึกคำสั่งซื้อ #${orderData?.order_id || 'ใหม่'} สำเร็จแล้ว!\n\nสถานะปัจจุบัน: "🕒 รอชำระเงิน"\nยอดรวม: ฿${totalPrice.toFixed(2)}\n\nคุณสามารถเข้าสู่เมนู "คำสั่งซื้อของฉัน" เพื่อดูสถานะ และสแกน QR Code ชำระเงินได้ทุกเมื่อ`)
      setCart([])
      setStep('cart')
      setIsCartOpen(false)
      router.push('/orders')
    } catch (e: any) {
      console.error(e)
      alert('เกิดข้อผิดพลาดในการบันทึกคำสั่งซื้อ: ' + (e.message || ''))
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
          
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowMysteryBox(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-xl transition border border-amber-200 shadow-xs cursor-pointer group"
              title="เปิดกล่องสุ่มรายวัน & ดูเหรียญตราความสำเร็จ"
            >
              <Gift className="w-4 h-4 text-amber-600 group-hover:scale-110 transition" />
              <span className="hidden sm:inline">กล่องสุ่ม</span>
              <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                🪙 {userCoins}
              </span>
            </button>

            <ThemeToggleCyberpunk />

            <button
              onClick={() => { setIsCartOpen(true); setStep('cart'); }}
              className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition flex items-center gap-2 shadow-sm cursor-pointer"
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

        {/* ======================================================== */}
        {/* กล่องโปรโมชั่นเปลี่ยนรายอาทิตย์ (Weekly Promotion Banner) */}
        {/* ======================================================== */}
        {isPromotionActive && (
          <div className="mb-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-indigo-500/20 relative overflow-hidden">
            {/* Ambient background glow */}
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-pink-500/20 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-sm animate-pulse">
                    <Flame className="w-3.5 h-3.5 fill-slate-950" />
                    โปรโมชั่นประจำสัปดาห์ (สัปดาห์ที่ {weeklyInfo.weekNumber})
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                    <Shield className="w-3 h-3 text-emerald-400" />
                    การันตีราคาเป็นธรรม (ห้ามราคา 0 บาท หรือติดลบ)
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
                  {weeklyInfo.activeCampaign.title}
                </h2>

                <p className="text-sm text-slate-300 leading-relaxed">
                  {weeklyInfo.activeCampaign.description}
                  <span className="block text-xs text-indigo-300 mt-1">
                    📅 ระยะเวลา: {weeklyInfo.startOfWeek.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} - {weeklyInfo.endOfWeek.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })} (หมุนเวียนโปรโมชั่นใหม่อัตโนมัติทุกวันอาทิตย์เที่ยงคืน)
                  </span>
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      if (weeklyInfo.activeCampaign.targetCategoryId) {
                        setSelectedCategory(weeklyInfo.activeCampaign.targetCategoryId)
                        setPromoFilterOnly(false)
                      } else {
                        setPromoFilterOnly(true)
                      }
                    }}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-extrabold px-5 py-2.5 rounded-xl text-xs sm:text-sm shadow-lg shadow-orange-500/20 transition transform hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 fill-slate-950" />
                    เลือกดูหนังสือที่ร่วมโปรโมชั่นสัปดาห์นี้
                  </button>

                  <button
                    onClick={() => {
                      setPromoFilterOnly(prev => !prev)
                      setSelectedCategory(null)
                    }}
                    className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                      promoFilterOnly 
                        ? 'bg-white text-slate-900 border-white shadow-md' 
                        : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                    }`}
                  >
                    <Tag className="w-3.5 h-3.5" />
                    {promoFilterOnly ? '✓ กำลังแสดงเฉพาะเล่มที่ลดราคา' : 'กรองเฉพาะเล่มที่ลดราคา'}
                  </button>
                </div>
              </div>

              {/* นาฬิกานับถอยหลังรายอาทิตย์ (Weekly Live Countdown Timer) */}
              <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl p-5 border border-slate-700/60 shrink-0 text-center shadow-inner">
                <span className="text-xs text-slate-400 font-bold block mb-2 flex items-center justify-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
                  เวลาคงเหลือของโปรโมชั่นสัปดาห์นี้
                </span>

                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-slate-900/90 rounded-xl p-2.5 min-w-[56px] border border-slate-700/40">
                    <span className="text-xl sm:text-2xl font-black text-amber-400 block font-mono">
                      {countdown.days}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">วัน</span>
                  </div>
                  <div className="bg-slate-900/90 rounded-xl p-2.5 min-w-[56px] border border-slate-700/40">
                    <span className="text-xl sm:text-2xl font-black text-white block font-mono">
                      {String(countdown.hours).padStart(2, '0')}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">ชั่วโมง</span>
                  </div>
                  <div className="bg-slate-900/90 rounded-xl p-2.5 min-w-[56px] border border-slate-700/40">
                    <span className="text-xl sm:text-2xl font-black text-white block font-mono">
                      {String(countdown.minutes).padStart(2, '0')}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">นาที</span>
                  </div>
                  <div className="bg-slate-900/90 rounded-xl p-2.5 min-w-[56px] border border-slate-700/40">
                    <span className="text-xl sm:text-2xl font-black text-rose-400 block font-mono">
                      {String(countdown.seconds).padStart(2, '0')}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">วินาที</span>
                  </div>
                </div>

                <p className="text-[10.5px] text-slate-400 mt-2.5 font-medium">
                  เปลี่ยนโปรโมชั่นใหม่ทุกเที่ยงคืนวันอาทิตย์ 🔄
                </p>
              </div>
            </div>
          </div>
        )}

        {/* แถบปุ่มเลือกหมวดหมู่หนังสือ และปุ่มสลับมุมมองชั้นหนังสือ 3D */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => { setSelectedCategory(null); setPromoFilterOnly(false); }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap shadow-sm cursor-pointer ${
                selectedCategory === null && !promoFilterOnly 
                  ? 'bg-indigo-600 text-white shadow-indigo-200' 
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              🌟 ทั้งหมด ({ebooks.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.category_id}
                onClick={() => { setSelectedCategory(cat.category_id); setPromoFilterOnly(false); }}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap shadow-sm cursor-pointer ${
                  selectedCategory === cat.category_id 
                    ? 'bg-indigo-600 text-white shadow-indigo-200' 
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                {cat.category_name}
              </button>
            ))}
            {isPromotionActive && (
              <button
                onClick={() => { setPromoFilterOnly(prev => !prev); setSelectedCategory(null); }}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap shadow-sm cursor-pointer flex items-center gap-1.5 ${
                  promoFilterOnly
                    ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-red-200'
                    : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                ดีลประจำสัปดาห์ (ลดราคา)
              </button>
            )}
          </div>

          {/* สลับมุมมอง: Grid View vs 3D Bookshelf */}
          <div className="flex items-center bg-white p-1 rounded-2xl border border-gray-200 shadow-xs shrink-0 self-end sm:self-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>ตารางการ์ด</span>
            </button>
            <button
              onClick={() => setViewMode('bookshelf')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                viewMode === 'bookshelf'
                  ? 'bg-gradient-to-r from-amber-700 to-amber-900 text-amber-100 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <span>🪵</span>
              <span>ชั้นไม้ 3D</span>
            </button>
          </div>
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
              onClick={() => { setSearchQuery(''); setSelectedCategory(null); setPromoFilterOnly(false); }}
              className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-100 transition cursor-pointer"
            >
              แสดงหนังสือทั้งหมด
            </button>
          </div>
        ) : viewMode === 'bookshelf' ? (
          <Bookshelf3D
            books={filteredEbooks.map(b => ({
              ebook_id: b.ebook_id,
              title: b.title,
              author: b.author,
              author_id: UNIQUE_EBOOKS_METADATA[b.ebook_id]?.author_id || 1,
              price: getBookPromotionPricing(b, weeklyInfo.activeCampaign, isPromotionActive).finalPrice,
              description: b.description,
              cover_image: b.cover_image,
              rating: b.rating,
              total_reviews: b.total_reviews,
              category_id: b.category_id
            }))}
            onAddToCart={(b) => addToCart({ ...b, stock_status: 'พร้อมจำหน่าย', category_id: b.category_id || 1 })}
            onOpenReader={(b) => setReaderBook(b)}
            onOpenAiSummary={(b) => setSummaryBook(b)}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredEbooks.map((book) => {
              const promoPricing = getBookPromotionPricing(book, weeklyInfo.activeCampaign, isPromotionActive)
              const authorId = UNIQUE_EBOOKS_METADATA[book.ebook_id]?.author_id || 1
              return (
              <div
                key={book.ebook_id}
                className={`bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border flex flex-col justify-between group ${
                  promoPricing.isDiscounted ? 'border-amber-300 ring-2 ring-amber-100' : 'border-gray-100'
                }`}
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
                    {/* Badge โปรโมชั่นประจำสัปดาห์ (ถ้ามี) */}
                    {promoPricing.isDiscounted && promoPricing.badgeText && (
                      <span className="absolute top-3 left-3 bg-gradient-to-r from-red-600 to-amber-500 text-white text-[11px] font-black px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1 animate-bounce" style={{ animationDuration: '2.5s' }}>
                        <Flame className="w-3 h-3 fill-white" />
                        {promoPricing.badgeText}
                      </span>
                    )}

                    {/* Badge สถานะพร้อมขาย (ตามข้อกำหนด 2.1) */}
                    <span className="absolute top-3 right-3 bg-emerald-500/95 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 backdrop-blur-xs">
                      <CheckCircle className="w-3 h-3" />
                      {book.stock_status || 'พร้อมจำหน่าย'}
                    </span>
                  </div>

                  <div className="p-5">
                    {/* แสดงชื่อผู้แต่ง พร้อมลิงก์ไปหน้าโปรไฟล์และเลี้ยงกาแฟ */}
                    <Link
                      href={`/author/${authorId}`}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold mb-1 inline-flex items-center gap-1 group/author"
                      title="ดูโปรไฟล์นักเขียน & เลี้ยงกาแฟ"
                    >
                      <span>✍️</span>
                      <span className="group-hover/author:underline">{book.author || 'ทีมวิชาการ GusSo'}</span>
                      <span className="text-[10px] text-amber-500 font-normal">☕</span>
                    </Link>

                    <h2 className="text-base font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1 mb-2">
                      {book.title}
                    </h2>
                    
                    <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed mb-3">
                      {book.description}
                    </p>

                    {/* แสดงคะแนนดาว 1-5 ดาว และปุ่มเปิดรีวิว */}
                    <div className="flex items-center justify-between pt-2.5 border-t border-gray-100">
                      <div className="flex items-center gap-1.5" title={`คะแนนเฉลี่ย ${Number(book.rating || 5.0).toFixed(1)} จาก 5 ดาว`}>
                        <div className="flex items-center text-amber-400">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3.5 h-3.5 ${
                                star <= Math.round(book.rating || 5)
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-bold text-gray-800">
                          {Number(book.rating || 5.0).toFixed(1)}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          ({book.total_reviews || 1})
                        </span>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => openReviewModal(book)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2 py-1 rounded-lg transition cursor-pointer"
                        title="ดูรีวิวและให้คะแนนดาว"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>รีวิว/ให้ดาว</span>
                      </button>
                    </div>

                    {/* ปุ่มอ่านตัวอย่าง 3D และปุ่มสรุป AI */}
                    <div className="grid grid-cols-2 gap-1.5 pt-2.5 border-t border-gray-100 mt-2.5">
                      <button
                        type="button"
                        onClick={() => setReaderBook(book)}
                        className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-1.5 px-2 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                        title="เปิดอ่านตัวอย่างแบบพลิกหน้ากระดาษ 3D"
                      >
                        <BookOpen className="w-3 h-3" />
                        <span>อ่าน 3D</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSummaryBook(book)}
                        className="bg-purple-50 hover:bg-purple-100 text-purple-700 py-1.5 px-2 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                        title="ให้ AI ช่วยสรุปใจความสำคัญใน 3 มิติ"
                      >
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>สรุป AI</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0 flex items-center justify-between border-t border-gray-50 mt-2 pt-4">
                  <div>
                    {promoPricing.isDiscounted ? (
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-gray-400 line-through">
                            ฿{Number(promoPricing.originalPrice).toFixed(2)}
                          </span>
                          <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                            ประหยัด ฿{promoPricing.discountAmount}
                          </span>
                        </div>
                        <span className="text-xl font-black text-rose-600">
                          ฿{Number(promoPricing.finalPrice).toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      <div>
                        <span className="text-xs text-gray-400 block">ราคา</span>
                        <span className="text-xl font-extrabold text-emerald-600">
                          ฿{Number(book.price).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => addToCart(book)}
                    className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition font-semibold text-xs shadow-md hover:shadow-indigo-200 active:scale-95 cursor-pointer flex items-center gap-1"
                  >
                    <span>+ ใส่ตะกร้า</span>
                  </button>
                </div>
              </div>
            )})}
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
                      {cart.map((item) => {
                        const hasDiscount = item.original_price && item.original_price > item.price
                        return (
                        <div key={item.ebook_id} className="flex justify-between items-center border-b pb-4">
                          <div className="flex-1 mr-3">
                            <h3 className="font-semibold text-gray-800 text-sm line-clamp-1">{item.title}</h3>
                            <p className="text-xs text-indigo-600 mb-1">✍️ {item.author || 'GusSo'}</p>
                            {hasDiscount && (
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-[11px] text-gray-400 line-through">฿{item.original_price}</span>
                                <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.2 rounded">
                                  ลด ฿{item.original_price! - item.price}/เล่ม
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <button
                                onClick={() => updateQuantity(item.ebook_id, -1)}
                                className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-xs font-bold cursor-pointer"
                              >
                                -
                              </button>
                              <span className="text-xs font-semibold">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.ebook_id, 1)}
                                className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-xs font-bold cursor-pointer"
                              >
                                +
                              </button>
                              <button
                                onClick={() => removeFromCart(item.ebook_id)}
                                className="text-[11px] text-red-500 hover:underline ml-2 cursor-pointer"
                              >
                                ลบ
                              </button>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-emerald-600 text-sm block">
                              ฿{(item.price * item.quantity).toFixed(2)}
                            </span>
                            {hasDiscount && (
                              <span className="text-[10px] text-gray-400 block">
                                (ประหยัด ฿{((item.original_price! - item.price) * item.quantity).toFixed(2)})
                              </span>
                            )}
                          </div>
                        </div>
                      )})}
                    </div>
                  )}
                </div>

                {cart.length > 0 && (
                  <div className="border-t pt-4 space-y-4">
                    {totalSavings > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-center justify-between font-medium">
                        <span className="flex items-center gap-1.5 font-bold">
                          <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                          ส่วนลดโปรโมชั่นประจำสัปดาห์:
                        </span>
                        <span className="font-extrabold text-red-600 text-sm">-฿{totalSavings.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-lg font-bold text-gray-800">
                      <span>ราคารวมสุทธิ:</span>
                      <span className="text-emerald-600 text-xl font-extrabold">฿{totalPrice.toFixed(2)}</span>
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
                      <div className="space-y-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            try {
                              localStorage.setItem('gusso_cart', JSON.stringify(cart))
                            } catch (e) {
                              console.warn('Sync cart error:', e)
                            }
                            window.open('/checkout', '_blank')
                            setIsCartOpen(false)
                          }}
                          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-3.5 px-4 rounded-xl transition font-bold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transform hover:scale-[1.01] active:scale-[0.99]"
                        >
                          <CreditCard className="w-4 h-4" />
                          <span>ชำระเงิน ฿{totalPrice.toFixed(2)} (เปิดแท็บใหม่)</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>

                        <button
                          type="submit"
                          className="w-full bg-slate-100 text-slate-700 py-2.5 rounded-xl hover:bg-slate-200 transition font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <QrCode className="w-3.5 h-3.5 text-slate-500" />
                          <span>หรือสแกน QR Code ด่วนที่หน้านี้</span>
                        </button>
                      </div>
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

                <div className="border-t pt-4 space-y-2">
                  <button
                    onClick={handleCheckoutWithDownloadLinks}
                    disabled={paying}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl transition font-semibold text-sm disabled:opacity-50 shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {paying ? 'กำลังบันทึกสิทธิ์ & ส่งใบเสร็จ...' : '⚡ ยืนยันชำระเงินสำเร็จ & รับลิงก์ดาวน์โหลด'}
                  </button>

                  <button
                    onClick={handleSavePendingOrder}
                    disabled={paying}
                    type="button"
                    className="w-full bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 py-2.5 rounded-xl transition font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>💾 บันทึกคำสั่งซื้อไว้ก่อน (รอชำระภายหลัง)</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Modal ระบบให้คะแนนดาว 1-5 ดาว & รีวิว */}
      {ratingModalBook && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            {/* ส่วนหัวของ Modal */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-violet-50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-16 rounded-lg overflow-hidden bg-gray-200 shrink-0 shadow-sm">
                  {ratingModalBook.cover_image && (
                    <img src={ratingModalBook.cover_image} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm line-clamp-1">{ratingModalBook.title}</h3>
                  <p className="text-xs text-indigo-600 font-medium">✍️ {ratingModalBook.author}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="flex items-center text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= Math.round(ratingModalBook.rating || 5)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-gray-800">
                      {Number(ratingModalBook.rating || 5.0).toFixed(1)} / 5.0
                    </span>
                    <span className="text-xs text-gray-400">
                      ({ratingModalBook.total_reviews || 1} รีวิว)
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setRatingModalBook(null)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition"
              >
                ✕
              </button>
            </div>

            {/* ส่วนเนื้อหาของ Modal ที่เลื่อนดูได้ */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* ฟอร์มเขียนรีวิวและให้คะแนนดาว */}
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
                <h4 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-1.5">
                  <span>⭐</span> ให้คะแนนและเขียนรีวิวหนังสือเล่มนี้
                </h4>

                {reviewSuccessMsg && (
                  <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>{reviewSuccessMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSubmitReview} className="space-y-4">
                  {/* การเลือกคะแนนดาว 1-5 แบบ Interactive */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      ระดับความพึงพอใจ (เลือกจำนวนดาวเต็ม 5 ดาว):
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            type="button"
                            key={s}
                            onMouseEnter={() => setHoverRating(s)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => setUserRating(s)}
                            className="p-1 transition-transform hover:scale-125 focus:outline-none"
                            title={`${s} ดาว`}
                          >
                            <Star
                              className={`w-7 h-7 transition-colors ${
                                s <= (hoverRating || userRating)
                                  ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                                  : 'text-gray-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg">
                        {(hoverRating || userRating) === 5 ? '🤩 5 ดาว - ยอดเยี่ยมมาก' :
                         (hoverRating || userRating) === 4 ? '😊 4 ดาว - ดีมาก' :
                         (hoverRating || userRating) === 3 ? '😐 3 ดาว - ปานกลาง' :
                         (hoverRating || userRating) === 2 ? '😕 2 ดาว - พอใช้' :
                         '😡 1 ดาว - ต้องปรับปรุง'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      ชื่อผู้รีวิว:
                    </label>
                    <input
                      type="text"
                      value={reviewerName}
                      onChange={(e) => setReviewerName(e.target.value)}
                      placeholder="ระบุชื่อของคุณ หรือ นามแฝง"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      ความคิดเห็น / รีวิวเนื้อหา:
                    </label>
                    <textarea
                      rows={3}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="บอกความประทับใจ หรือข้อเสนอแนะเกี่ยวกับหนังสือเล่มนี้..."
                      className="w-full border border-gray-200 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-indigo-500 bg-white resize-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold text-xs transition shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    <span>⭐</span>
                    {submittingReview ? 'กำลังส่งรีวิว...' : 'บันทึกคะแนนรีวิว (Submit Rating)'}
                  </button>
                </form>
              </div>

              {/* รายการรีวิวทั้งหมด */}
              <div>
                <h4 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2">
                  <span>💬</span> รีวิวจากผู้อ่านทั้งหมด ({bookReviews.length})
                </h4>

                {loadingReviews ? (
                  <div className="text-center py-6 text-xs text-gray-400">กำลังโหลดรีวิว...</div>
                ) : bookReviews.length === 0 ? (
                  <p className="text-center py-6 text-xs text-gray-400 bg-gray-50 rounded-xl border border-dashed">
                    ยังไม่มีรีวิวสำหรับเล่มนี้ เป็นคนแรกที่ให้คะแนนเลย!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {bookReviews.map((rev, idx) => (
                      <div key={rev.review_id || idx} className="p-3.5 bg-white border border-gray-100 rounded-xl shadow-xs">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-semibold text-xs text-gray-800 flex items-center gap-1">
                            <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold">
                              {rev.user_name.charAt(0)}
                            </span>
                            {rev.user_name}
                          </span>
                          <div className="flex items-center text-amber-400">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3 h-3 ${
                                  s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed">{rev.comment}</p>
                        {rev.created_at && (
                          <span className="text-[10px] text-gray-400 mt-1 block">
                            {new Date(rev.created_at).toLocaleDateString('th-TH', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3D Interactive Page Flip Reader Modal */}
      <InteractivePageFlipReader
        book={readerBook}
        onClose={() => setReaderBook(null)}
        onAddToCart={(b) => addToCart({ ...b, category_id: 1, stock_status: 'พร้อมจำหน่าย' })}
      />

      {/* Lucky Mystery Box & Gamification Modal */}
      <MysteryBoxModal
        isOpen={showMysteryBox}
        onClose={() => setShowMysteryBox(false)}
        onApplyCoupon={(c) => alert('คัดลอกโค้ดส่วนลดแล้ว: ' + c)}
      />

      {/* AI Book Advisor Floating Chatbot */}
      <AiBookAdvisor
        onAddToCart={(b) => addToCart({ ...b, category_id: 1, stock_status: 'พร้อมจำหน่าย' })}
      />

      {/* AI 3-Line Summarizer Modal */}
      <AiBookSummarizerModal
        book={summaryBook}
        onClose={() => setSummaryBook(null)}
        onAddToCart={(b) => addToCart({ ...b, category_id: 1, stock_status: 'พร้อมจำหน่าย' })}
        onOpenReader={(b) => setReaderBook(b)}
      />
    </main>
  )
}