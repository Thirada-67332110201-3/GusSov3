'use client'

import React, { useEffect, useState, useCallback, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import emailjs from '@emailjs/browser'
import { 
  ArrowLeft, CheckCircle2, ShieldCheck, QrCode, CreditCard, 
  Building2, Smartphone, Clock, Flame, ShoppingBag, 
  Download, Copy, Check, Upload, AlertCircle, ArrowRight,
  Sparkles, BookOpen, Coins
} from 'lucide-react'
import { UNIQUE_EBOOKS_METADATA } from '@/lib/books-data'
import { getGussoCoins, spendGussoCoins, addGussoCoins, unlockBadge } from '@/lib/gamification'
import { ThemeToggleCyberpunk } from '@/components/theme-toggle-cyberpunk'

export interface CheckoutCartItem {
  ebook_id: number
  title: string
  price: number
  original_price?: number
  quantity: number
  cover_image?: string
  author?: string
}

function CheckoutContent() {
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderIdParam = searchParams.get('order_id')

  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [cart, setCart] = useState<CheckoutCartItem[]>([])
  const [existingOrderId, setExistingOrderId] = useState<number | null>(null)
  
  // Payment Method selection: 'promptpay' | 'credit_card' | 'bank_transfer' | 'truemoney'
  const [paymentMethod, setPaymentMethod] = useState<'promptpay' | 'credit_card' | 'bank_transfer' | 'truemoney'>('promptpay')
  
  // Step: 1 = Review & Pay, 2 = Success
  const [checkoutStep, setCheckoutStep] = useState<1 | 2>(1)
  const [completedOrderNumber, setCompletedOrderNumber] = useState<string | number>('')

  // Credit Card Form State
  const [cardName, setCardName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExp, setCardExp] = useState('')
  const [cardCvv, setCardCvv] = useState('')

  // Slip upload preview state
  const [slipPreview, setSlipPreview] = useState<string | null>(null)
  const [copiedBank, setCopiedBank] = useState(false)

  // GusSo Coins Gamification state
  const [userCoins, setUserCoins] = useState(150)
  const [useCoinsDiscount, setUseCoinsDiscount] = useState(false)

  // Countdown timer for QR code (15 minutes = 900 seconds)
  const [timeLeft, setTimeLeft] = useState(900)

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  // ฟังก์ชันสลับกลับไปยังแท็บเดิมของเว็บไซต์หลัก (Smooth Multi-tab Experience)
  const handleReturnToMainTab = (e?: React.MouseEvent) => {
    if (e) e.preventDefault()
    if (typeof window !== 'undefined') {
      // 1. หากเปิดมาจากแท็บเดิมของหน้าร้าน ให้โฟกัสกลับไปยังแท็บเดิมและปิดแท็บชำระเงินนี้
      if (window.opener && !window.opener.closed) {
        try {
          window.opener.focus()
          window.close()
          return
        } catch (err) {
          console.warn('Could not focus opener:', err)
        }
      }
      
      // 2. พยายามปิดแท็บชำระเงิน เพื่อให้ผู้ใช้กลับไปสู่แท็บเดิมที่เปิดค้างอยู่
      try {
        window.close()
      } catch (err) {
        // ignore
      }

      // 3. Fallback หากเบราว์เซอร์ไม่อนุญาตให้สั่งปิดแท็บผ่าน JavaScript
      router.push('/')
    }
  }

  // 1. Initial Load: Check auth, query parameters (existing order) or localStorage cart
  const initializeCheckout = useCallback(async () => {
    setLoading(true)

    // Check user session
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user?.email) {
      setUserEmail(session.user.email)
    }

    // Check if an existing order_id is passed in the URL (e.g. from Orders Page)
    if (orderIdParam) {
      const parsedId = parseInt(orderIdParam, 10)
      if (!isNaN(parsedId)) {
        try {
          const { data: orderData } = await supabase
            .from('orders')
            .select(`
              order_id,
              customer_email,
              total_amount,
              status,
              order_items (
                ebook_id,
                quantity,
                unit_price
              )
            `)
            .eq('order_id', parsedId)
            .single()

          if (orderData) {
            setExistingOrderId(orderData.order_id)
            if (orderData.customer_email) {
              setUserEmail(orderData.customer_email)
            }

            // Map order_items to cart items
            if (orderData.order_items && orderData.order_items.length > 0) {
              const mappedItems: CheckoutCartItem[] = orderData.order_items.map((it: any) => {
                const meta = UNIQUE_EBOOKS_METADATA[it.ebook_id]
                return {
                  ebook_id: it.ebook_id,
                  title: meta?.title || `E-Book #${it.ebook_id}`,
                  price: Number(it.unit_price || meta?.price || 290),
                  original_price: meta?.price || Number(it.unit_price),
                  quantity: it.quantity || 1,
                  cover_image: meta?.cover_image,
                  author: meta?.author
                }
              })
              setCart(mappedItems)
              setLoading(false)
              return
            }
          }
        } catch (err) {
          console.warn('Could not fetch existing order:', err)
        }
      }
    }

    // If no existing order, load from localStorage
    try {
      const savedCart = localStorage.getItem('gusso_cart')
      if (savedCart) {
        const parsed = JSON.parse(savedCart)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCart(parsed)
        }
      }
    } catch (e) {
      console.warn('Error reading localStorage cart:', e)
    }

    setUserCoins(getGussoCoins())
    setLoading(false)
  }, [supabase, orderIdParam])

  useEffect(() => {
    initializeCheckout()
  }, [initializeCheckout])

  // Calculations
  const rawTotalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const totalSavings = cart.reduce((sum, item) => {
    const orig = item.original_price || item.price
    const diff = Math.max(0, orig - item.price)
    return sum + (diff * item.quantity)
  }, 0)

  // GusSo Coins Discount (10 Coins = 1 บาท, ใช้ลดได้สูงสุด 50% ของยอดรวม)
  const maxCoinDiscountBaht = Math.min(Math.floor(userCoins / 10), Math.floor(rawTotalPrice * 0.5))
  const coinsToSpend = useCoinsDiscount ? maxCoinDiscountBaht * 10 : 0
  const coinDiscountBaht = useCoinsDiscount ? maxCoinDiscountBaht : 0
  const totalPrice = Math.max(0, rawTotalPrice - coinDiscountBaht)

  // Handle Slip Upload preview
  const handleSlipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setSlipPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Copy bank account number
  const handleCopyBankAccount = () => {
    navigator.clipboard.writeText('123-4-56789-0')
    setCopiedBank(true)
    setTimeout(() => setCopiedBank(false), 2000)
  }

  // Complete Payment Action
  const handleConfirmPayment = async () => {
    const cleanEmail = userEmail.trim().toLowerCase()
    if (!cleanEmail) {
      alert('กรุณากรอกอีเมลสำหรับรับหนังสือ E-Book และใบเสร็จ')
      return
    }

    if (cart.length === 0) {
      alert('ไม่มีรายการสินค้าในขั้นตอนชำระเงิน')
      return
    }

    setPaying(true)

    try {
      let finalOrderId: number | string = existingOrderId || ''

      // 1. If this is a new order, insert into orders table
      if (!existingOrderId) {
        const { data: orderData, error: orderErr } = await supabase.from('orders').insert([
          {
            customer_email: cleanEmail,
            total_amount: totalPrice,
            status: 'ยืนยันแล้ว'
          }
        ]).select().single()

        if (orderErr) {
          console.warn('Orders insert error, fallback:', orderErr)
        }

        if (orderData?.order_id) {
          finalOrderId = orderData.order_id

          // Insert order_items
          for (const item of cart) {
            await supabase.from('order_items').insert([
              {
                order_id: finalOrderId,
                ebook_id: item.ebook_id,
                quantity: item.quantity,
                unit_price: item.price
              }
            ])
          }
        } else {
          finalOrderId = 'GS-' + Math.floor(100000 + Math.random() * 900000)
        }
      } else {
        // If updating existing order from pending to confirmed
        await supabase
          .from('orders')
          .update({ status: 'ยืนยันแล้ว' })
          .eq('order_id', existingOrderId)
      }

      // 2. Insert into purchases table (สิทธิ์การเข้าถึง & ดาวน์โหลด)
      for (const item of cart) {
        try {
          await supabase.from('purchases').insert([
            {
              user_email: cleanEmail,
              ebook_id: item.ebook_id
            }
          ])
        } catch (purchErr) {
          console.warn('Purchases insert warning:', purchErr)
        }
      }

      // 3. Insert into payments table (บันทึกธุรกรรมการชำระเงินตามหลัก Database 3NF)
      try {
        const methodName = paymentMethod === 'promptpay' ? 'PromptPay QR' :
          paymentMethod === 'credit_card' ? 'Credit Card' :
          paymentMethod === 'bank_transfer' ? 'Bank Transfer' : 'TrueMoney'

        await supabase.from('payments').insert([
          {
            order_id: typeof finalOrderId === 'number' ? finalOrderId : 1,
            amount: totalPrice,
            slip_image: slipPreview || 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400',
            payment_status: 'completed',
            paid_at: new Date().toISOString()
          }
        ])
      } catch (payErr) {
        console.warn('Payments table insert note (RLS/schema):', payErr)
      }

      // 4. Send EmailJS confirmation receipt
      const origin = window.location.origin
      const firstEbookId = cart[0]?.ebook_id || ''
      const defaultDownloadLink = `${origin}/download?ebook_id=${firstEbookId}`

      const itemsHtmlString = cart.map(item => {
        const downloadLink = `${origin}/download?ebook_id=${item.ebook_id}`
        return `<div style="margin-bottom: 12px; padding: 10px; background: #f9f9f9; border-radius: 6px;">
          • <b>${item.title}</b> (x${item.quantity}) : <b>฿${(item.price * item.quantity).toFixed(2)}</b><br/>
          <a href="${downloadLink}" style="display: inline-block; margin-top: 6px; padding: 6px 12px; background: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 4px; font-size: 12px;">📥 ดาวน์โหลดหนังสือเล่มนี้</a>
        </div>`
      }).join('')

      const templateParams = {
        to_email: cleanEmail,
        email: cleanEmail,
        user_email: cleanEmail,
        reply_to: cleanEmail,
        to_name: cleanEmail.split('@')[0],
        name: cleanEmail.split('@')[0],
        order_id: finalOrderId,
        receipt_no: 'REC-' + finalOrderId,
        date: new Date().toLocaleString('th-TH'),
        items_html: itemsHtmlString,
        total_price: totalPrice.toFixed(2),
        link: defaultDownloadLink,
        download_link: defaultDownloadLink
      }

      try {
        await emailjs.send(
          'service_5t8qqtj',
          'template_cudu5ko',
          templateParams,
          'rKpRB3YPhevxOZaEA'
        )
      } catch (mailErr) {
        console.warn('EmailJS delivery warning:', mailErr)
      }

      // 5. จัดการ GusSo Coins และเหรียญตราความสำเร็จ (Gamification)
      if (coinsToSpend > 0) {
        spendGussoCoins(coinsToSpend, `ใช้แลกส่วนลดคำสั่งซื้อ #${finalOrderId}`)
      }
      const earnedCoins = Math.round(totalPrice * 0.1)
      if (earnedCoins > 0) {
        addGussoCoins(earnedCoins, `เงินคืน 10% จากคำสั่งซื้อ #${finalOrderId}`)
      }
      unlockBadge('first_purchase')
      if (cart.length >= 3) {
        unlockBadge('book_collector')
      }
      if (cart.some(it => it.ebook_id === 1 || it.ebook_id === 4)) {
        unlockBadge('code_enthusiast')
      }

      // 6. Clear cart and set success step
      localStorage.removeItem('gusso_cart')
      setCompletedOrderNumber(finalOrderId)
      setCheckoutStep(2)

    } catch (err: any) {
      console.error('Checkout error:', err)
      alert('เกิดข้อผิดพลาดในการชำระเงิน: ' + (err.message || 'โปรดลองใหม่อีกครั้ง'))
    } finally {
      setPaying(false)
    }
  }

  // Save as Pending Order (บันทึกรอชำระ)
  const handleSavePending = async () => {
    const cleanEmail = userEmail.trim().toLowerCase()
    if (!cleanEmail) {
      alert('กรุณากรอกอีเมลสำหรับบันทึกคำสั่งซื้อ')
      return
    }

    setPaying(true)
    try {
      const { data: orderData } = await supabase.from('orders').insert([
        {
          customer_email: cleanEmail,
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

      localStorage.removeItem('gusso_cart')
      alert(`📋 บันทึกคำสั่งซื้อ #${orderData?.order_id || ''} เรียบร้อยแล้ว (สถานะ: "รอชำระ")\n\nคุณสามารถกลับมาเปิดชำระเงินได้ตลอดเวลาจากเมนู "คำสั่งซื้อของฉัน"`)
      router.push('/orders')
    } catch (e: any) {
      alert('ไม่สามารถบันทึกคำสั่งซื้อได้: ' + e.message)
    } finally {
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-3"></div>
          <p className="text-sm font-semibold text-slate-600">กำลังเตรียมหน้าชำระเงิน...</p>
        </div>
      </div>
    )
  }

  // Success Confirmation Screen (Step 2)
  if (checkoutStep === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 via-slate-50 to-white flex items-center justify-center p-4 py-12">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-emerald-100 p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <div>
            <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200">
              ชำระเงินสำเร็จ 100%
            </span>
            <h1 className="text-2xl font-black text-slate-900 mt-2">ขอบคุณสำหรับการสั่งซื้อ!</h1>
            <p className="text-xs text-slate-500 mt-1">
              คำสั่งซื้อหมายเลข <span className="font-bold text-slate-800">#{completedOrderNumber}</span> ได้รับการยืนยันแล้ว
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 text-left border border-slate-100 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>จัดส่ง E-Book ไปยัง:</span>
              <span className="font-bold text-slate-900">{userEmail}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>ช่องทางชำระเงิน:</span>
              <span className="font-bold text-indigo-700">
                {paymentMethod === 'promptpay' ? 'พร้อมเพย์ QR Code' :
                 paymentMethod === 'credit_card' ? 'บัตรเครดิต' :
                 paymentMethod === 'bank_transfer' ? 'โอนเงินผ่านธนาคาร' : 'TrueMoney'}
              </span>
            </div>
            <div className="flex justify-between text-slate-600 border-t pt-2">
              <span className="font-bold">ยอดเงินที่ชำระ:</span>
              <span className="font-black text-emerald-600 text-sm">฿{totalPrice.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <Link
              href="/download"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 px-4 rounded-2xl font-bold text-sm transition shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>ไปยังคลังหนังสือ & ดาวน์โหลด E-Book</span>
            </Link>

            <button
              type="button"
              onClick={handleReturnToMainTab}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 px-4 rounded-2xl font-semibold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>กลับสู่แท็บเดิมหน้าร้านค้า GusSo E-Book</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Empty Cart Screen
  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-slate-200 p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">ไม่มีรายการในขั้นตอนชำระเงิน</h2>
          <p className="text-xs text-slate-500">
            โปรดเลือกหนังสือ E-Book ที่คุณสนใจจากหน้าร้านค้าลงตะกร้าก่อนดำเนินการชำระเงิน
          </p>
          <button
            type="button"
            onClick={handleReturnToMainTab}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-indigo-700 transition shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับสู่แท็บเดิมหน้าร้าน</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Checkout Navbar */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <button
            type="button"
            onClick={handleReturnToMainTab}
            className="flex items-center gap-2 text-left cursor-pointer group"
            title="คลิกเพื่อกลับไปยังแท็บเดิมหน้าร้าน"
          >
            <span className="text-2xl group-hover:scale-110 transition">📚</span>
            <div>
              <span className="text-lg font-black bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                GusSo E-Book Store
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-bold border border-indigo-100">
                แท็บชำระเงิน (คลิกเพื่อกลับแท็บเดิม)
              </span>
            </div>
          </button>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <ThemeToggleCyberpunk />
            <ShieldCheck className="w-4 h-4 text-emerald-600 hidden sm:inline" />
            <span className="hidden md:inline">ระบบชำระเงินปลอดภัยมาตรฐาน 256-bit SSL</span>
            <button
              type="button"
              onClick={handleReturnToMainTab}
              className="ml-2 text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-bold text-xs cursor-pointer hover:underline"
              title="สลับกลับไปยังแท็บเดิมหน้าร้าน"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>กลับแท็บเดิมหน้าร้าน</span>
            </button>
          </div>
        </div>
      </header>

      {/* Step Progress Bar */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-2">
        <div className="flex items-center justify-center gap-3 sm:gap-6 text-xs font-bold">
          <div className="flex items-center gap-2 text-emerald-600">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">1</span>
            <span>ตะกร้าสินค้า</span>
          </div>
          <div className="w-8 sm:w-16 h-0.5 bg-indigo-600"></div>
          <div className="flex items-center gap-2 text-indigo-700">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs shadow-md shadow-indigo-300">2</span>
            <span>ชำระเงิน (Checkout)</span>
          </div>
          <div className="w-8 sm:w-16 h-0.5 bg-slate-200"></div>
          <div className="flex items-center gap-2 text-slate-400">
            <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs">3</span>
            <span>รับ E-Book ทันที</span>
          </div>
        </div>
      </div>

      {/* Main Checkout Layout: 2 Columns */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN (7 Cols): Payment Methods & QR / Slip */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Card: Payment Method Selection */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200 space-y-5">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>💳</span>
                  <span>เลือกช่องทางการชำระเงิน</span>
                </h2>
                <p className="text-xs text-slate-500">เลือกวิธีที่คุณสะดวกเพื่อยืนยันคำสั่งซื้อ</p>
              </div>
              <span className="text-[11px] font-mono font-bold bg-amber-50 text-amber-800 px-2.5 py-1 rounded-full border border-amber-200 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>หมดเวลาใน {formatTimer(timeLeft)}</span>
              </span>
            </div>

            {/* Payment Method Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={() => setPaymentMethod('promptpay')}
                className={`p-3.5 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 ${
                  paymentMethod === 'promptpay'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${paymentMethod === 'promptpay' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <QrCode className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold">พร้อมเพย์ QR</span>
                <span className="text-[10px] text-slate-400">แนะนำ / ทันที</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('credit_card')}
                className={`p-3.5 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 ${
                  paymentMethod === 'credit_card'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${paymentMethod === 'credit_card' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <CreditCard className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold">บัตรเครดิต/เดบิต</span>
                <span className="text-[10px] text-slate-400">Visa / Master</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('bank_transfer')}
                className={`p-3.5 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 ${
                  paymentMethod === 'bank_transfer'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${paymentMethod === 'bank_transfer' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <Building2 className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold">โอนเงินธนาคาร</span>
                <span className="text-[10px] text-slate-400">กสิกร / SCB</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('truemoney')}
                className={`p-3.5 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 ${
                  paymentMethod === 'truemoney'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${paymentMethod === 'truemoney' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <Smartphone className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold">ทรูมันนี่</span>
                <span className="text-[10px] text-slate-400">Wallet</span>
              </button>
            </div>

            {/* TAB CONTENT 1: PromptPay QR Code */}
            {paymentMethod === 'promptpay' && (
              <div className="bg-slate-50/80 rounded-2xl p-6 border border-slate-200/80 text-center space-y-4">
                <div className="inline-block bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200">
                  {/* PromptPay QR Logo & Mockup QR */}
                  <div className="bg-blue-900 text-white text-[10px] font-black py-1 px-3 rounded-lg mb-2 flex items-center justify-center gap-1">
                    <span>PROMPTPAY</span>
                    <span>พร้อมเพย์</span>
                  </div>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=PROMPTPAY-GUSSO-AMOUNT-${totalPrice}`}
                    alt="PromptPay QR Code"
                    className="w-40 h-40 object-contain mx-auto"
                  />
                  <span className="text-[11px] font-bold text-slate-700 block mt-2">
                    สแกนจ่าย ฿{totalPrice.toFixed(2)}
                  </span>
                </div>

                <div className="text-xs text-slate-500 space-y-1">
                  <p className="font-semibold text-slate-700">ชื่อบัญชี: ร้านหนังสือดิจิทัล GusSo E-Book Store</p>
                  <p>เปิดแอปธนาคารใดก็ได้ แล้วสแกนคิวอาร์โค้ดนี้เพื่อชำระเงินได้ทันที</p>
                </div>

                {/* Slip Upload Box */}
                <div className="pt-2 border-t border-slate-200 text-left">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-indigo-600" />
                    <span>แนบสลิปการโอนเงิน (ไม่บังคับ แต่ช่วยให้ตรวจสอบไวขึ้น):</span>
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSlipChange}
                    className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                  />
                  {slipPreview && (
                    <div className="mt-2 flex items-center gap-2 bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                      <img src={slipPreview} alt="Slip Preview" className="w-12 h-12 rounded-lg object-cover border" />
                      <span className="text-xs font-bold text-emerald-800">✓ แนบสลิปเรียบร้อย พร้อมส่งเข้าฐานข้อมูล</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: Credit Card */}
            {paymentMethod === 'credit_card' && (
              <div className="bg-slate-50/80 rounded-2xl p-6 border border-slate-200/80 space-y-4">
                <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-5 shadow-md max-w-sm mx-auto space-y-4 font-mono text-xs">
                  <div className="flex justify-between items-center text-slate-400">
                    <span>GusSo Virtual Card</span>
                    <span className="font-black text-sm italic text-amber-400">VISA</span>
                  </div>
                  <p className="text-base tracking-widest font-black text-slate-100">
                    {cardNumber ? cardNumber.replace(/(\d{4})/g, '$1 ').trim() : '•••• •••• •••• ••••'}
                  </p>
                  <div className="flex justify-between text-[10px] text-slate-300">
                    <div>
                      <span className="text-[8px] text-slate-500 block">CARD HOLDER</span>
                      <span className="font-bold">{cardName || 'YOUR NAME'}</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-slate-500 block">EXPIRES</span>
                      <span className="font-bold">{cardExp || 'MM/YY'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">ชื่อผู้ถือบัตร</label>
                    <input
                      type="text"
                      placeholder="Somchai Developer"
                      value={cardName}
                      onChange={e => setCardName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">หมายเลขบัตร 16 หลัก</label>
                    <input
                      type="text"
                      maxLength={16}
                      placeholder="4111 2222 3333 4444"
                      value={cardNumber}
                      onChange={e => setCardNumber(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">วันหมดอายุ</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        maxLength={5}
                        value={cardExp}
                        onChange={e => setCardExp(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">CVV / CVC</label>
                      <input
                        type="password"
                        placeholder="123"
                        maxLength={3}
                        value={cardCvv}
                        onChange={e => setCardCvv(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 3: Bank Transfer */}
            {paymentMethod === 'bank_transfer' && (
              <div className="bg-slate-50/80 rounded-2xl p-6 border border-slate-200/80 space-y-4">
                <div className="bg-white rounded-2xl p-4 border border-emerald-200 shadow-xs flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-black flex items-center justify-center text-sm shadow-xs">
                      K+
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">ธนาคารกสิกรไทย (KBANK)</p>
                      <p className="text-sm font-black font-mono text-emerald-700 mt-0.5">123-4-56789-0</p>
                      <p className="text-[10px] text-slate-500">ชื่อบัญชี: บจก. กัสโซ่ บุ๊คส์ สโตร์</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyBankAccount}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 text-xs font-bold flex items-center gap-1 transition"
                  >
                    {copiedBank ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedBank ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                  </button>
                </div>

                <div className="text-xs text-slate-600 bg-amber-50/80 border border-amber-200 p-3.5 rounded-xl space-y-1">
                  <p className="font-bold text-amber-900 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                    <span>คำแนะนำการโอนเงิน:</span>
                  </p>
                  <p className="text-amber-800">
                    โปรดโอนยอดเงินจำนวนพอดี <strong className="text-emerald-700 font-black">฿{totalPrice.toFixed(2)} บาท</strong> และกดปุ่มยืนยันด้านล่างนี้ ระบบจะตรวจสอบและส่งสิทธิ์ดาวน์โหลดให้ทันที
                  </p>
                </div>
              </div>
            )}

            {/* TAB CONTENT 4: TrueMoney */}
            {paymentMethod === 'truemoney' && (
              <div className="bg-slate-50/80 rounded-2xl p-6 border border-slate-200/80 text-center space-y-4">
                <div className="w-12 h-12 bg-orange-500 text-white rounded-2xl flex items-center justify-center font-black mx-auto text-lg shadow-sm">
                  TM
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">TrueMoney Wallet</h3>
                  <p className="text-xs text-slate-500 mt-1">ชำระเงินผ่านเบอร์ TrueMoney ของร้านค้า</p>
                  <p className="text-base font-black font-mono text-orange-600 mt-2">089-123-4567</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">ชื่อบัญชี: GusSo Store E-Commerce</p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons Box */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-3">
            <button
              type="button"
              disabled={paying}
              onClick={handleConfirmPayment}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-4 px-6 rounded-2xl font-black text-sm transition shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {paying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>กำลังประมวลผลคำสั่งซื้อ...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>ยืนยันการชำระเงิน ฿{totalPrice.toFixed(2)} (รับ E-Book ทันที)</span>
                </>
              )}
            </button>

            {!existingOrderId && (
              <button
                type="button"
                disabled={paying}
                onClick={handleSavePending}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-2xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>บันทึกรอชำระ (เก็บไว้ชำระภายหลังในแท็บคำสั่งซื้อ)</span>
              </button>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN (5 Cols): Order Summary & Customer Email */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Email Recipient Input Card */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>📧</span>
              <span>ข้อมูลผู้รับ E-Book และใบเสร็จ</span>
            </h3>
            <p className="text-xs text-slate-500">
              ระบบจะส่งไฟล์ E-Book และใบเสร็จภาษีอิเล็กทรอนิกส์ไปยังอีเมลนี้ทันที
            </p>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                อีเมลของคุณ (Customer Email) *
              </label>
              <input
                type="email"
                value={userEmail}
                onChange={e => setUserEmail(e.target.value)}
                placeholder="your.name@gmail.com"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
              />
            </div>
          </div>

          {/* Cart Items List Card */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>📚</span>
                <span>สรุปรายการสั่งซื้อ ({cart.length} รายการ)</span>
              </h3>
              {existingOrderId && (
                <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
                  บิล #{existingOrderId}
                </span>
              )}
            </div>

            {/* List of Books */}
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {cart.map((item, idx) => {
                const hasDiscount = item.original_price && item.original_price > item.price
                return (
                  <div key={idx} className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <img
                      src={item.cover_image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=120'}
                      alt={item.title}
                      className="w-12 h-16 object-cover rounded-xl shadow-xs shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{item.title}</p>
                      <p className="text-[10px] text-slate-500 truncate">✍️ {item.author || 'นักเขียนอิสระ'}</p>
                      <p className="text-[10px] font-semibold text-slate-600 mt-1">จำนวน: {item.quantity} เล่ม</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-black text-emerald-600">
                        ฿{(item.price * item.quantity).toFixed(2)}
                      </p>
                      {hasDiscount && (
                        <p className="text-[9px] text-slate-400 line-through">
                          ฿{(item.original_price! * item.quantity).toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* กล่องเลือกใช้แต้ม GusSo Coins */}
            <div className="bg-amber-50/70 border border-amber-200 p-3.5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={useCoinsDiscount}
                    disabled={userCoins < 10}
                    onChange={(e) => setUseCoinsDiscount(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded cursor-pointer"
                  />
                  <span className="flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-amber-500" />
                    <span>ใช้ GusSo Coins แลกส่วนลด</span>
                  </span>
                </label>
                <span className="text-xs font-extrabold text-amber-700">
                  🪙 {userCoins} Coins
                </span>
              </div>
              <p className="text-[10px] text-slate-500">
                (อัตรา 10 Coins = 1 บาท • สิทธิ์ลดได้สูงสุด ฿{maxCoinDiscountBaht.toFixed(2)} บาท)
              </p>
            </div>

            {/* Pricing Summary */}
            <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>ราคาปกติรวม:</span>
                <span>฿{(rawTotalPrice + totalSavings).toFixed(2)}</span>
              </div>

              {totalSavings > 0 && (
                <div className="flex justify-between text-red-600 font-bold bg-red-50 p-2 rounded-xl border border-red-100">
                  <span className="flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                    <span>ส่วนลดประจำสัปดาห์:</span>
                  </span>
                  <span>-฿{totalSavings.toFixed(2)}</span>
                </div>
              )}

              {useCoinsDiscount && coinDiscountBaht > 0 && (
                <div className="flex justify-between text-amber-700 font-bold bg-amber-50 p-2 rounded-xl border border-amber-200">
                  <span className="flex items-center gap-1">
                    <span>🪙</span>
                    <span>ส่วนลด GusSo Coins ({coinsToSpend} แต้ม):</span>
                  </span>
                  <span>-฿{coinDiscountBaht.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-500">
                <span>ค่าธรรมเนียมดาวน์โหลดดิจิทัล:</span>
                <span className="text-emerald-600 font-bold">ฟรี (฿0.00)</span>
              </div>

              <div className="flex justify-between items-center text-sm font-black text-slate-900 border-t border-slate-100 pt-3">
                <span className="text-base">ยอดชำระสุทธิ:</span>
                <span className="text-xl text-emerald-600 font-black">
                  ฿{totalPrice.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Security Guarantee Card */}
          <div className="bg-indigo-50/70 border border-indigo-100 rounded-3xl p-5 text-indigo-950 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-indigo-900">
              <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>การันตีความปลอดภัยและสิทธิ์การอ่าน</span>
            </div>
            <p className="text-[11px] text-indigo-800 leading-relaxed">
              หลังการชำระเงินสำเร็จ ระบบจะบันทึกสิทธิ์การเข้าถึงหนังสือเข้าตาราง <code>purchases</code> ทันที คุณสามารถเข้าอ่านและดาวน์โหลดไฟล์ E-Book ฉบับเต็มได้ตลอดชีพโดยไม่มีวันหมดอายุ
            </p>
          </div>

        </div>

      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-3"></div>
          <p className="text-sm font-semibold text-slate-600">กำลังโหลดระบบชำระเงิน...</p>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}
