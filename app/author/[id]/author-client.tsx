'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check, Coffee, Heart, Share2, Globe, Github, Twitter, Linkedin, BookOpen, Star, ShoppingBag, Sparkles, QrCode, Coins, MessageSquare, ShieldCheck } from 'lucide-react'
import { AuthorProfile } from '@/lib/authors-data'
import { UNIQUE_EBOOKS_METADATA } from '@/lib/books-data'
import { getGussoCoins, spendGussoCoins, unlockBadge } from '@/lib/gamification'
import { InteractivePageFlipReader } from '@/components/interactive-page-flip-reader'
import { AiBookSummarizerModal } from '@/components/ai-book-summarizer-modal'
import { ThemeToggleCyberpunk } from '@/components/theme-toggle-cyberpunk'

type TipItem = {
  id: string
  name: string
  amount: number
  message: string
  timestamp: string
  cups: number
}

interface AuthorClientProps {
  author: AuthorProfile
}

export function AuthorClient({ author }: AuthorClientProps) {
  const router = useRouter()
  const [isFollowing, setIsFollowing] = useState(false)
  const [followersCount, setFollowersCount] = useState(author.initialFollowers)
  const [showTipModal, setShowTipModal] = useState(false)
  const [tipCups, setTipCups] = useState(1)
  const [tipCustomAmount, setTipCustomAmount] = useState<number | ''>('')
  const [supporterName, setSupporterName] = useState('')
  const [supporterMsg, setSupporterMsg] = useState('')
  const [tipPaymentMethod, setTipPaymentMethod] = useState<'promptpay' | 'coins'>('promptpay')
  const [tipSuccess, setTipSuccess] = useState(false)
  const [userCoins, setUserCoins] = useState(150)

  // Modals for book preview and AI
  const [activeReaderBook, setActiveReaderBook] = useState<{ ebook_id: number; title: string; price: number; cover_image: string; description: string } | null>(null)
  const [activeSummaryBook, setActiveSummaryBook] = useState<{ ebook_id: number; title: string; price: number; cover_image: string; description: string } | null>(null)

  // หนังสือของนักเขียนคนนี้
  const authorBooks = Object.entries(UNIQUE_EBOOKS_METADATA)
    .filter(([_, meta]) => meta.author_id === author.author_id)
    .map(([id, meta]) => ({
      ebook_id: Number(id),
      ...meta
    }))

  // รายการผู้สนับสนุน (Wall of Supporters)
  const [tipsList, setTipsList] = useState<TipItem[]>([
    {
      id: 'tip_1',
      name: 'กิตติศักดิ์ พ.',
      amount: 100,
      cups: 2,
      message: 'ขอบคุณสำหรับคู่มือ Next.js เล่มนี้มากครับ ช่วยงานโปรเจกต์บริษัทได้ทันเดดไลน์พอดี!',
      timestamp: '2 วันที่แล้ว'
    },
    {
      id: 'tip_2',
      name: 'น้องบี สายโค้ด',
      amount: 50,
      cups: 1,
      message: 'เลี้ยงกาแฟอาจารย์ครับ รอติดตามผลงานเล่มต่อไปเสมอนะครับ ☕',
      timestamp: '4 วันที่แล้ว'
    }
  ])

  useEffect(() => {
    setUserCoins(getGussoCoins())

    // โหลดสถานะการติดตาม
    const followed = localStorage.getItem(`gusso_follow_author_${author.author_id}`)
    if (followed === 'true') {
      setIsFollowing(true)
      setFollowersCount(author.initialFollowers + 1)
    }

    // โหลดประวัติการโดเนทเฉพาะของนักเขียนคนนี้
    const savedTips = localStorage.getItem(`gusso_author_tips_${author.author_id}`)
    if (savedTips) {
      try {
        setTipsList(JSON.parse(savedTips))
      } catch {
        // ignore
      }
    }
  }, [author.author_id, author.initialFollowers])

  const toggleFollow = () => {
    if (isFollowing) {
      setIsFollowing(false)
      setFollowersCount(prev => prev - 1)
      localStorage.removeItem(`gusso_follow_author_${author.author_id}`)
    } else {
      setIsFollowing(true)
      setFollowersCount(prev => prev + 1)
      localStorage.setItem(`gusso_follow_author_${author.author_id}`, 'true')
    }
  }

  const calculatedTipPrice = tipCustomAmount !== '' ? Number(tipCustomAmount) : tipCups * 50

  const handleSendTip = () => {
    if (tipPaymentMethod === 'coins') {
      const requiredCoins = calculatedTipPrice * 10
      if (userCoins < requiredCoins) {
        alert(`แต้ม GusSo Coins ไม่พอ (ต้องการ ${requiredCoins} Coins แต่คุณมี ${userCoins} Coins)`)
        return
      }
      spendGussoCoins(requiredCoins, `เลี้ยงกาแฟ ${author.name} (${tipCups} แก้ว)`)
      setUserCoins(getGussoCoins())
    }

    const newTip: TipItem = {
      id: 'tip_' + Date.now(),
      name: supporterName.trim() || 'ผู้ไม่ประสงค์ออกนาม',
      amount: calculatedTipPrice,
      cups: tipCustomAmount !== '' ? 1 : tipCups,
      message: supporterMsg.trim() || 'ขอเป็นกำลังใจให้นักเขียนสร้างสรรค์ผลงานดีๆ ต่อไปครับ!',
      timestamp: 'เมื่อสักครู่'
    }

    const updated = [newTip, ...tipsList]
    setTipsList(updated)
    localStorage.setItem(`gusso_author_tips_${author.author_id}`, JSON.stringify(updated))

    // ปลดล็อกเหรียญตราผู้อุปถัมภ์นักเขียน
    unlockBadge('creator_patron')

    setTipSuccess(true)
    setTimeout(() => {
      setTipSuccess(false)
      setShowTipModal(false)
      setSupporterName('')
      setSupporterMsg('')
    }, 2200)
  }

  const handleAddToCart = (book: { ebook_id: number; title: string; price: number; cover_image: string; description: string }) => {
    try {
      const savedCart = localStorage.getItem('gusso_cart')
      const currentCart = savedCart ? JSON.parse(savedCart) : []
      const existing = currentCart.find((item: { ebook_id: number }) => item.ebook_id === book.ebook_id)
      let nextCart = []
      if (existing) {
        nextCart = currentCart.map((item: { ebook_id: number; quantity: number }) =>
          item.ebook_id === book.ebook_id ? { ...item, quantity: item.quantity + 1 } : item
        )
      } else {
        nextCart = [...currentCart, { ...book, quantity: 1, stock_status: 'พร้อมจำหน่าย', category_id: 1 }]
      }
      localStorage.setItem('gusso_cart', JSON.stringify(nextCart))
      alert(`เพิ่ม "${book.title}" ลงในตะกร้าเรียบร้อยแล้ว!`)
    } catch {
      alert(`เพิ่มสินค้าลงในตะกร้าเรียบร้อยแล้ว`)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Navbar ด้านบน */}
      <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับสู่หน้าร้านหนังสือ</span>
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggleCyberpunk />
            <Link
              href="/checkout"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>ชำระเงิน</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* ภาพ Banner ด้านหลัง */}
      <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-slate-900">
        <img
          src={author.banner}
          alt={author.name}
          className="w-full h-full object-cover opacity-75"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
      </div>

      {/* ส่วนข้อมูลโปรไฟล์หลัก (Profile Header Info) */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative -mt-24 sm:-mt-28 space-y-8 pb-16">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative z-10 flex flex-col sm:flex-row gap-6 items-start">
          {/* รูปอวาตาร์ */}
          <div className="relative mx-auto sm:mx-0">
            <img
              src={author.avatar}
              alt={author.name}
              className="w-28 sm:w-36 h-28 sm:h-36 rounded-2xl object-cover border-4 border-white dark:border-slate-900 shadow-2xl"
            />
            <span className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-1.5 rounded-xl shadow-md border-2 border-white dark:border-slate-900" title="นักเขียนที่ผ่านการรับรอง">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>

          {/* รายละเอียดผู้แต่ง */}
          <div className="flex-1 space-y-2.5 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                    {author.name}
                  </h1>
                </div>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold mt-0.5">{author.handle}</p>
              </div>

              {/* ปุ่ม Follow & Tip */}
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={toggleFollow}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer ${
                    isFollowing
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-rose-50 hover:text-rose-600'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${isFollowing ? 'fill-rose-500 text-rose-500' : ''}`} />
                  <span>{isFollowing ? 'กำลังติดตาม' : 'ติดตาม'}</span>
                  <span className="ml-1 opacity-75 font-mono text-[11px]">({followersCount})</span>
                </button>

                <button
                  onClick={() => setShowTipModal(true)}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs transition flex items-center gap-1.5 shadow-md shadow-orange-500/20 cursor-pointer transform hover:scale-105"
                >
                  <Coffee className="w-3.5 h-3.5" />
                  <span>เลี้ยงกาแฟ ☕</span>
                </button>
              </div>
            </div>

            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">{author.role}</p>
            <p className="text-xs text-slate-500 dark:text-slate-300 leading-relaxed max-w-2xl">{author.bio}</p>

            {/* ช่องทาง Social Links */}
            <div className="flex items-center justify-center sm:justify-start gap-2 pt-2 text-slate-500 dark:text-slate-400">
              {author.social.github && (
                <a href={author.social.github} target="_blank" rel="noreferrer" className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:text-indigo-500 transition">
                  <Github className="w-4 h-4" />
                </a>
              )}
              {author.social.twitter && (
                <a href={author.social.twitter} target="_blank" rel="noreferrer" className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:text-sky-500 transition">
                  <Twitter className="w-4 h-4" />
                </a>
              )}
              {author.social.linkedin && (
                <a href={author.social.linkedin} target="_blank" rel="noreferrer" className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:text-blue-600 transition">
                  <Linkedin className="w-4 h-4" />
                </a>
              )}
              {author.social.website && (
                <a href={author.social.website} target="_blank" rel="noreferrer" className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:text-emerald-500 transition">
                  <Globe className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* รายการผลงาน E-Books ของนักเขียนคนนี้ */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black flex items-center gap-2 text-slate-900 dark:text-white">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              ผลงานหนังสือทั้งหมด ({authorBooks.length} เล่ม)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {authorBooks.map(book => (
              <div
                key={book.ebook_id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs hover:shadow-lg transition flex flex-col justify-between group"
              >
                <div>
                  <div className="relative rounded-2xl overflow-hidden aspect-4/3 mb-4 bg-slate-100 dark:bg-slate-800">
                    <img
                      src={book.cover_image}
                      alt={book.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute top-2.5 right-2.5 bg-slate-900/90 backdrop-blur-xs text-amber-300 font-extrabold text-xs px-2.5 py-1 rounded-lg border border-amber-400/30">
                      ฿{book.price}
                    </div>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2 leading-snug">
                    {book.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {book.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 font-bold text-amber-500">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {book.rating} ({book.total_reviews} รีวิว)
                    </span>
                    <button
                      onClick={() => setActiveSummaryBook(book)}
                      className="text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>สรุป AI</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setActiveReaderBook(book)}
                      className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>เปิดอ่าน 3D</span>
                    </button>

                    <button
                      onClick={() => handleAddToCart(book)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>ใส่ตะกร้า</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* กำแพงแฟนคลับผู้สนับสนุน (Wall of Supporters) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black flex items-center gap-2 text-slate-900 dark:text-white">
                <Coffee className="w-5 h-5 text-amber-500" />
                กำแพงแฟนคลับผู้สนับสนุน (Wall of Backers)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                รายนามผู้อ่านใจดีที่ร่วมเลี้ยงกาแฟเป็นกำลังใจแก่นักเขียน
              </p>
            </div>
            <button
              onClick={() => setShowTipModal(true)}
              className="text-xs bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40 px-3.5 py-1.5 rounded-xl font-bold hover:bg-amber-500/30 transition cursor-pointer"
            >
              + เลี้ยงกาแฟตอนนี้
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tipsList.map(tip => (
              <div
                key={tip.id}
                className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 p-4 rounded-2xl space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    ☕ <strong>{tip.name}</strong> เลี้ยงกาแฟ {tip.cups} แก้ว (฿{tip.amount})
                  </span>
                  <span className="text-[10px] text-slate-400">{tip.timestamp}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 italic">"{tip.message}"</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal เลี้ยงกาแฟนักเขียน (Buy Me a Coffee Modal) */}
      {showTipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden p-6 text-white space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-xl">
                  ☕
                </div>
                <div>
                  <h4 className="font-black text-base text-amber-300">เลี้ยงกาแฟ {author.name}</h4>
                  <p className="text-xs text-slate-400">ส่งต่อกำลังใจให้นักเขียนสร้างสรรค์ผลงาน</p>
                </div>
              </div>
              <button
                onClick={() => setShowTipModal(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            {tipSuccess ? (
              <div className="py-8 text-center space-y-2 animate-in zoom-in-95">
                <div className="w-14 h-14 bg-emerald-500/20 border border-emerald-400 text-emerald-400 rounded-full mx-auto flex items-center justify-center text-2xl">
                  ✓
                </div>
                <h5 className="font-bold text-lg text-emerald-300">ขอบคุณสำหรับกำลังใจครับ!</h5>
                <p className="text-xs text-slate-300">ข้อความของคุณถูกบันทึกขึ้นบนกำแพงแฟนคลับเรียบร้อยแล้ว</p>
              </div>
            ) : (
              <>
                {/* เลือกจำนวนแก้วกาแฟ */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300">เลือกจำนวนกาแฟ:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { cups: 1, price: 50, label: '1 แก้ว' },
                      { cups: 2, price: 100, label: '2 แก้ว' },
                      { cups: 5, price: 250, label: '5 แก้ว' }
                    ].map(item => (
                      <button
                        key={item.cups}
                        type="button"
                        onClick={() => {
                          setTipCups(item.cups)
                          setTipCustomAmount('')
                        }}
                        className={`p-3 rounded-2xl border text-center transition cursor-pointer ${
                          tipCups === item.cups && tipCustomAmount === ''
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm'
                            : 'bg-slate-800/80 border-white/10 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="text-base">☕ x {item.cups}</div>
                        <div className="text-xs font-black mt-1">฿{item.price}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* วิธีการชำระเงิน */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300">ช่องทางชำระเงิน:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTipPaymentMethod('promptpay')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        tipPaymentMethod === 'promptpay'
                          ? 'bg-indigo-600 border-indigo-400 text-white'
                          : 'bg-slate-800 border-white/10 text-slate-400'
                      }`}
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>PromptPay QR</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTipPaymentMethod('coins')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        tipPaymentMethod === 'coins'
                          ? 'bg-amber-600 border-amber-400 text-white'
                          : 'bg-slate-800 border-white/10 text-slate-400'
                      }`}
                    >
                      <Coins className="w-3.5 h-3.5" />
                      <span>ตัด GusSo Coins ({userCoins})</span>
                    </button>
                  </div>
                </div>

                {/* ฟอร์มกรอกชื่อและข้อความ */}
                <div className="space-y-2.5">
                  <input
                    type="text"
                    value={supporterName}
                    onChange={e => setSupporterName(e.target.value)}
                    placeholder="ชื่อหรือนามแฝงของคุณ..."
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
                  />
                  <textarea
                    rows={2}
                    value={supporterMsg}
                    onChange={e => setSupporterMsg(e.target.value)}
                    placeholder="พิมพ์ข้อความให้กำลังใจนักเขียน..."
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400 resize-none"
                  />
                </div>

                {/* ปุ่มยืนยันโดเนท */}
                <button
                  type="button"
                  onClick={handleSendTip}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black py-3 rounded-2xl text-xs transition shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Coffee className="w-4 h-4" />
                  <span>
                    ยืนยันเลี้ยงกาแฟ {calculatedTipPrice} บาท ({tipPaymentMethod === 'coins' ? `${calculatedTipPrice * 10} Coins` : 'สแกน QR Code'})
                  </span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Reader Modal */}
      <InteractivePageFlipReader
        book={activeReaderBook}
        onClose={() => setActiveReaderBook(null)}
        onAddToCart={handleAddToCart}
      />

      {/* AI Summarizer Modal */}
      <AiBookSummarizerModal
        book={activeSummaryBook}
        onClose={() => setActiveSummaryBook(null)}
        onAddToCart={handleAddToCart}
        onOpenReader={b => setActiveReaderBook(b)}
      />
    </div>
  )
}
