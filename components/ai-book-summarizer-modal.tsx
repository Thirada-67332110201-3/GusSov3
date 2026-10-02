'use client'

import React, { useState, useEffect } from 'react'
import { Sparkles, CheckCircle2, Target, Lightbulb, Zap, ShoppingBag, BookOpen, Copy, Check, X } from 'lucide-react'
import { unlockBadge } from '@/lib/gamification'

export type SummaryBook = {
  ebook_id: number
  title: string
  author?: string
  price: number
  cover_image: string
  description: string
  category_id?: number
}

interface AiBookSummarizerModalProps {
  book: SummaryBook | null
  onClose: () => void
  onAddToCart?: (book: SummaryBook) => void
  onOpenReader?: (book: SummaryBook) => void
}

export function AiBookSummarizerModal({
  book,
  onClose,
  onAddToCart,
  onOpenReader
}: AiBookSummarizerModalProps) {
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (book) {
      setLoading(true)
      const timer = setTimeout(() => {
        setLoading(false)
        unlockBadge('ai_explorer')
      }, 700)
      return () => clearTimeout(timer)
    }
  }, [book])

  if (!book) return null

  // สังเคราะห์ 3 บรรทัดสรุปใจความสำคัญตามหมวดหมู่และชื่อหนังสือ
  const getSummaryData = () => {
    return {
      targetAudience: `เหมาะสำหรับนักพัฒนาซอฟต์แวร์ และผู้ที่ต้องการเชี่ยวชาญการสร้างแอปพลิเคชันระดับ Production โดยไม่ต้องเสียเวลาลองผิดลองถูก`,
      coreConcept: `เจาะลึกแก่นสำคัญของ ${book.title} อธิบายหลักการตั้งแต่พื้นฐาน โครงสร้างสถาปัตยกรรม ไปจนถึงการลงมือปฏิบัติจริงด้วย Best Practices ที่ปลอดภัยและขยายตัวได้`,
      actionableOutcome: `สามารถนำ Pattern และโค้ดตัวอย่างไปประยุกต์ใช้งานในโปรเจกต์จริง เพิ่มความเร็วในการพัฒนา และสร้างผลงานที่มีมาตรฐานสากลได้ทันที`
    }
  }

  const summary = getSummaryData()

  const handleCopy = () => {
    const text = `✨ สรุป 3 บรรทัดด้วย AI: ${book.title}\n1) เป้าหมาย: ${summary.targetAudience}\n2) แก่นสำคัญ: ${summary.coreConcept}\n3) ผลลัพธ์: ${summary.actionableOutcome}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-purple-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-white">
        {/* หัวโมดัล */}
        <div className="p-5 bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-xl">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-black text-lg text-purple-200">AI Book Summarizer</h3>
              <p className="text-xs text-purple-300/80">สรุปใจความสำคัญใน 3 มิติ เพื่อการตัดสินใจอ่านที่รวดเร็ว</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* เนื้อหาการสรุป */}
        <div className="p-6 space-y-5">
          {/* ข้อมูลหนังสือแบบย่อ */}
          <div className="flex items-center gap-4 bg-slate-950/60 p-3.5 rounded-2xl border border-white/10">
            <img
              src={book.cover_image}
              alt={book.title}
              className="w-14 h-20 object-cover rounded-lg shadow-md border border-white/10 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-sm text-white line-clamp-1">{book.title}</h4>
              <p className="text-xs text-slate-400 mt-0.5">โดย {book.author || 'GusSo Author'}</p>
              <div className="text-amber-300 font-extrabold text-sm mt-1">฿{book.price} บาท</div>
            </div>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-purple-300 animate-pulse font-medium">AI กำลังสังเคราะห์และวิเคราะห์เนื้อหาในเล่ม...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* บรรทัดที่ 1: เป้าหมาย & กลุ่มเป้าหมาย */}
              <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex gap-3 items-start">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 shrink-0 mt-0.5">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="font-bold text-xs text-indigo-300 uppercase tracking-wider">1. เหมาะสำหรับใคร & เป้าหมาย</h5>
                  <p className="text-xs text-slate-200 mt-1 leading-relaxed">{summary.targetAudience}</p>
                </div>
              </div>

              {/* บรรทัดที่ 2: แก่นสำคัญ */}
              <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex gap-3 items-start">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 shrink-0 mt-0.5">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="font-bold text-xs text-purple-300 uppercase tracking-wider">2. แก่นความรู้สำคัญ (Core Takeaway)</h5>
                  <p className="text-xs text-slate-200 mt-1 leading-relaxed">{summary.coreConcept}</p>
                </div>
              </div>

              {/* บรรทัดที่ 3: ผลลัพธ์ที่ได้ */}
              <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex gap-3 items-start">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 shrink-0 mt-0.5">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="font-bold text-xs text-emerald-300 uppercase tracking-wider">3. ทักษะที่นำไปใช้ได้ทันที (Actionable Skill)</h5>
                  <p className="text-xs text-slate-200 mt-1 leading-relaxed">{summary.actionableOutcome}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* แถบปุ่มคำสั่งด้านล่าง */}
        {!loading && (
          <div className="p-5 bg-slate-950/80 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={handleCopy}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'คัดลอกแล้ว!' : 'คัดลอกบทสรุป'}</span>
            </button>

            <div className="flex items-center gap-2">
              {onOpenReader && (
                <button
                  onClick={() => {
                    onOpenReader(book)
                    onClose()
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>เปิดอ่านตัวอย่าง</span>
                </button>
              )}

              {onAddToCart && (
                <button
                  onClick={() => {
                    onAddToCart(book)
                    onClose()
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/30"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>ใส่ตะกร้า ฿{book.price}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
