'use client'

import React, { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, Volume2, VolumeX, Maximize2, Minimize2, BookOpen, Sparkles, ShoppingBag, X } from 'lucide-react'

export type ReaderBook = {
  ebook_id: number
  title: string
  author?: string
  price: number
  cover_image: string
  description: string
}

interface PageFlipReaderProps {
  book: ReaderBook | null
  onClose: () => void
  onAddToCart?: (book: ReaderBook) => void
}

export function InteractivePageFlipReader({ book, onClose, onAddToCart }: PageFlipReaderProps) {
  const [currentPage, setCurrentPage] = useState(0)
  const [isFlipping, setIsFlipping] = useState(false)
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev'>('next')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [readerTheme, setReaderTheme] = useState<'sepia' | 'light' | 'dark'>('sepia')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // สังเคราะห์เสียงพลิกหน้ากระดาษ (Web Audio API Synthesizer)
  const playPageTurnSound = () => {
    if (!soundEnabled) return
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()
      const bufferSize = Math.floor(ctx.sampleRate * 0.12)
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const output = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25))
      }
      const whiteNoise = ctx.createBufferSource()
      whiteNoise.buffer = buffer
      const filter = ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.value = 1400
      filter.Q.value = 2.5

      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)

      whiteNoise.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)
      whiteNoise.start()
    } catch {
      // ignore
    }
  }

  // เนื้อหาตัวอย่างของหนังสือแบ่งเป็นหน้าๆ (Sample Pages)
  const pages = book ? [
    {
      type: 'cover',
      title: book.title,
      author: book.author || 'GusSo Publishing',
      content: (
        <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
          <img
            src={book.cover_image}
            alt={book.title}
            className="w-48 h-64 object-cover rounded-xl shadow-2xl border-2 border-amber-900/30 mb-2"
          />
          <h2 className="text-xl font-black text-slate-900 line-clamp-2 max-w-sm">{book.title}</h2>
          <p className="text-sm text-slate-600 font-medium">โดย {book.author || 'GusSo Publishing'}</p>
          <span className="text-xs uppercase font-extrabold tracking-widest px-3 py-1 bg-amber-100 text-amber-900 rounded-full border border-amber-300">
            ฉบับทดลองอ่าน (Free Sample Preview)
          </span>
        </div>
      )
    },
    {
      type: 'toc',
      title: 'สารบัญ & โครงสร้างเล่ม',
      content: (
        <div className="h-full flex flex-col justify-start p-6 space-y-4 text-left">
          <h3 className="text-xl font-black text-slate-900 pb-2 border-b border-stone-300 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" /> สารบัญเนื้อหา (Table of Contents)
          </h3>
          <ul className="space-y-3 text-sm text-slate-700">
            <li className="flex justify-between items-center py-1 border-b border-stone-200 border-dashed">
              <span>บทที่ 1: ภาพรวมสถาปัตยกรรมและเทคโนโลยีหลัก</span>
              <span className="font-mono text-xs text-slate-500">หน้า 1 - 25</span>
            </li>
            <li className="flex justify-between items-center py-1 border-b border-stone-200 border-dashed">
              <span>บทที่ 2: การออกแบบฐานข้อมูลและ API Security</span>
              <span className="font-mono text-xs text-slate-500">หน้า 26 - 68</span>
            </li>
            <li className="flex justify-between items-center py-1 border-b border-stone-200 border-dashed">
              <span>บทที่ 3: State Management & Modern Patterns</span>
              <span className="font-mono text-xs text-slate-500">หน้า 69 - 110</span>
            </li>
            <li className="flex justify-between items-center py-1 border-b border-stone-200 border-dashed">
              <span>บทที่ 4: การนำไปใช้งานจริงบน Cloud (Deployment)</span>
              <span className="font-mono text-xs text-slate-500">หน้า 111 - 150</span>
            </li>
          </ul>
          <div className="mt-auto bg-amber-50 p-4 rounded-xl border border-amber-200 text-xs text-amber-900">
            💡 <strong>คำแนะนำจากผู้เขียน:</strong> หนังสือเล่มนี้เขียนขึ้นจากประสบการณ์จริง เน้นโค้ดที่พร้อมใช้งานใน Production ได้ทันที
          </div>
        </div>
      )
    },
    {
      type: 'content',
      title: 'บทที่ 1: บทนำและการติดตั้ง',
      content: (
        <div className="h-full flex flex-col justify-start p-6 space-y-4 text-left text-sm text-slate-800 leading-relaxed overflow-y-auto">
          <div className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Chapter 1 Preview</div>
          <h3 className="text-xl font-black text-slate-900">1.1 เริ่มต้นความเข้าใจและสถาปัตยกรรม</h3>
          <p>
            {book.description}
          </p>
          <p>
            การออกแบบระบบที่ดีไม่ได้ขึ้นอยู่กับเทคโนโลยีล่าสุดเพียงอย่างเดียว แต่เริ่มต้นจากการกำหนดขอบเขตปัญหา (Domain Modeling) และการแบ่งแยกภาระหน้าที่ของแต่ละโมดูลอย่างเป็นระเบียบ
          </p>
          <div className="bg-slate-900 text-emerald-400 p-3.5 rounded-xl font-mono text-xs shadow-inner">
            <span className="text-slate-500">// ตัวอย่างคำสั่งเตรียม Environment</span><br />
            $ npx create-gusso-app@latest my-awesome-project<br />
            $ cd my-awesome-project<br />
            $ npm run dev
          </div>
        </div>
      )
    },
    {
      type: 'cta',
      title: 'สนใจอ่านเนื้อหาฉบับเต็ม?',
      content: (
        <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-5">
          <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-3xl flex items-center justify-center text-3xl shadow-md">
            🎉
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-black text-slate-900">เพลิดเพลินกับตัวอย่างแล้วใช่ไหม?</h3>
            <p className="text-xs text-slate-600 max-w-sm">
              ปลดล็อกเนื้อหาฉบับเต็มมากกว่า 150+ หน้า พร้อมแบบฝึกหัด ไฟล์โค้ดโปรเจกต์ และสิทธิ์อัปเดตฟรีตลอดชีพ
            </p>
          </div>
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-4 rounded-2xl w-full max-w-sm">
            <span className="text-xs text-slate-500 line-through">ราคาปกติ ฿{Math.round(book.price * 1.3)}</span>
            <div className="text-2xl font-black text-amber-600">฿{book.price} บาท</div>
            <p className="text-[11px] text-emerald-700 font-bold mt-1">ได้รับ GusSo Coins สะสมทันที {Math.round(book.price * 0.1)} แต้ม</p>
          </div>
          {onAddToCart && (
            <button
              onClick={() => {
                onAddToCart(book)
                onClose()
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-2xl text-sm transition shadow-lg shadow-emerald-200 flex items-center gap-2 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>สั่งซื้อเล่มเต็มตอนนี้</span>
            </button>
          )}
        </div>
      )
    }
  ] : []

  const handleNextPage = () => {
    if (currentPage < pages.length - 1 && !isFlipping) {
      playPageTurnSound()
      setFlipDirection('next')
      setIsFlipping(true)
      setTimeout(() => {
        setCurrentPage(prev => prev + 1)
        setIsFlipping(false)
      }, 260)
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 0 && !isFlipping) {
      playPageTurnSound()
      setFlipDirection('prev')
      setIsFlipping(true)
      setTimeout(() => {
        setCurrentPage(prev => prev - 1)
        setIsFlipping(false)
      }, 260)
    }
  }

  // รองรับการกดปุ่มลูกศรซ้าย/ขวาบนคีย์บอร์ด
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        handleNextPage()
      } else if (e.key === 'ArrowLeft') {
        handlePrevPage()
      } else if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentPage, isFlipping])

  if (!book) return null

  // สไตล์พื้นหลังสมุดตามธีมที่เลือก
  const themeClasses = {
    sepia: 'bg-[#f8f5eb] text-slate-800 border-[#e5dec9]',
    light: 'bg-white text-slate-900 border-slate-200',
    dark: 'bg-slate-900 text-slate-100 border-slate-800'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        ref={containerRef}
        className={`relative w-full ${
          isFullscreen ? 'max-w-none h-full' : 'max-w-3xl h-[85vh] max-h-[720px]'
        } bg-slate-950 rounded-3xl border border-amber-500/30 shadow-2xl flex flex-col overflow-hidden`}
      >
        {/* แถบควบคุมด้านบน (Reader Header Toolbar) */}
        <div className="px-5 py-3.5 bg-slate-900/90 border-b border-white/10 flex items-center justify-between gap-3 text-white shrink-0">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="p-1.5 rounded-lg bg-indigo-600/30 text-indigo-400 text-sm">📖</span>
            <div className="truncate">
              <h4 className="text-xs sm:text-sm font-bold truncate text-slate-200">{book.title}</h4>
              <p className="text-[11px] text-slate-400">หน้า {currentPage + 1} จาก {pages.length}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* สลับธีมถนอมสายตา */}
            <div className="flex items-center bg-slate-800 rounded-xl p-1 border border-white/10 text-xs">
              <button
                onClick={() => setReaderTheme('sepia')}
                title="ธีมสีถนอมสายตา (Sepia)"
                className={`w-5 h-5 rounded-lg bg-[#f8f5eb] transition ${readerTheme === 'sepia' ? 'ring-2 ring-amber-400' : 'opacity-70'}`}
              />
              <button
                onClick={() => setReaderTheme('light')}
                title="ธีมสีสว่าง (Light)"
                className={`w-5 h-5 rounded-lg bg-white ml-1 transition ${readerTheme === 'light' ? 'ring-2 ring-indigo-400' : 'opacity-70'}`}
              />
              <button
                onClick={() => setReaderTheme('dark')}
                title="ธีมสีมืด (Dark)"
                className={`w-5 h-5 rounded-lg bg-slate-950 ml-1 transition ${readerTheme === 'dark' ? 'ring-2 ring-purple-400' : 'opacity-70'}`}
              />
            </div>

            {/* ปุ่มเปิด/ปิดเสียงกระดาษ */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'ปิดเสียงเอฟเฟกต์พลิกกระดาษ' : 'เปิดเสียงเอฟเฟกต์พลิกกระดาษ'}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>

            {/* ปุ่มขยายเต็มจอ */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'ย่อหน้าต่าง' : 'แสดงเต็มหน้าจอ'}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition hidden sm:block"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* ปุ่มปิด */}
            <button
              onClick={onClose}
              title="ปิดหน้าต่างอ่าน"
              className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ตัวเล่มหนังสือจำลอง 3D Page View */}
        <div className="flex-1 relative flex items-center justify-center p-3 sm:p-6 overflow-hidden bg-gradient-to-b from-stone-900 via-slate-950 to-stone-900">
          {/* ขอบสันหนังสือตรงกลาง (Book Spine Center) */}
          <div className="relative w-full max-w-2xl h-full rounded-2xl shadow-2xl overflow-hidden border border-black/50 flex">
            {/* สันหนังสือกดร่องตรงกลาง (Center Spine Shadow) */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/30 via-black/10 to-transparent pointer-events-none z-20"></div>

            {/* หน้ากระดาษปัจจุบัน พร้อม Animation พลิกหน้า (3D Page Flip Animation) */}
            <div
              className={`w-full h-full ${themeClasses[readerTheme]} p-4 sm:p-8 rounded-2xl shadow-inner transition-transform duration-300 ${
                isFlipping
                  ? flipDirection === 'next'
                    ? 'scale-95 opacity-80 -rotate-y-12'
                    : 'scale-95 opacity-80 rotate-y-12'
                  : 'scale-100 opacity-100 rotate-y-0'
              }`}
              style={{ perspective: '1200px' }}
            >
              {pages[currentPage]?.content}
            </div>
          </div>

          {/* ปุ่มพลิกไปหน้าก่อนหน้า (Previous Page Button) */}
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 0 || isFlipping}
            title="หน้าก่อนหน้า (หรือกดลูกศรซ้าย)"
            className="absolute left-2 sm:left-4 p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-white/20 shadow-xl transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer z-30"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* ปุ่มพลิกไปหน้าถัดไป (Next Page Button) */}
          <button
            onClick={handleNextPage}
            disabled={currentPage === pages.length - 1 || isFlipping}
            title="หน้าถัดไป (หรือกดลูกศรขวา)"
            className="absolute right-2 sm:right-4 p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-white/20 shadow-xl transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer z-30"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* แถบความคืบหน้าด้านล่าง (Page Progress Bar) */}
        <div className="px-6 py-3 bg-slate-900/90 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-1.5">
            {pages.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  playPageTurnSound()
                  setCurrentPage(i)
                }}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentPage ? 'w-8 bg-amber-400' : 'w-2 bg-slate-700 hover:bg-slate-500'
                }`}
                title={`ไปหน้าที่ ${i + 1}`}
              />
            ))}
          </div>

          <div className="text-[11px] text-slate-400">
            💡 กดปุ่ม <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">←</kbd> หรือ <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">→</kbd> บนคีย์บอร์ดเพื่อพลิกหน้า
          </div>
        </div>
      </div>
    </div>
  )
}
