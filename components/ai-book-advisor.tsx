'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Bot, Sparkles, Send, X, ShoppingBag, ArrowRight, BookOpen, Minimize2 } from 'lucide-react'
import { UNIQUE_EBOOKS_METADATA, UniqueBookMeta } from '@/lib/books-data'
import { unlockBadge } from '@/lib/gamification'

type ChatMessage = {
  id: string
  sender: 'ai' | 'user'
  text: string
  recommendedBookIds?: number[]
  timestamp: string
}

const PRESET_PROMPTS = [
  'อยากเป็นโปรแกรมเมอร์เงินเดือนแสน ต้องอ่านเล่มไหนก่อน?',
  'เพิ่งเริ่มต้นเขียนเว็บปี 2026 แนะนำหนังสือพื้นฐานที',
  'อยากเชี่ยวชาญ Database, SQL และ Supabase',
  'มีงบประมาณ 500 บาท แนะนำเซ็ตที่คุ้มที่สุดหน่อย',
  'แนะนำหนังสือขายดีอันดับ 1 และรีวิว 5 ดาว'
]

interface AiBookAdvisorProps {
  onAddToCart?: (book: { ebook_id: number; title: string; price: number; cover_image: string; description: string }) => void
}

export function AiBookAdvisor({ onAddToCart }: AiBookAdvisorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_welcome',
      sender: 'ai',
      text: 'สวัสดีครับ! ผมคือ 🤖 AI GusSo Advisor ผู้ช่วยค้นหาและแนะนำ E-Book อัจฉริยะ คุณกำลังมองหาหนังสือแนวไหน หรือมีเป้าหมายสายงานพัฒนาซอฟต์แวร์อย่างไร ปรึกษาผมได้เลยครับ!',
      timestamp: 'ตอนนี้'
    }
  ])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      unlockBadge('ai_explorer')
    }
  }, [isOpen, messages, isTyping])

  const findRecommendations = (query: string): { responseText: string; bookIds: number[] } => {
    const q = query.toLowerCase()

    if (q.includes('เงินเดือนแสน') || q.includes('โปรแกรมเมอร์') || q.includes('รายได้สูง') || q.includes('ทำงานจริง')) {
      return {
        responseText: 'สำหรับเป้าหมายสู่การเป็น Software Engineer เงินเดือนแสน เส้นทางที่ตลาดต้องการตัวสูงสุดคือ Modern Full-Stack (Next.js 15 + TypeScript + Cloud Architecture) ครับ ผมขอแนะนำ 2 เล่มระดับมาตรฐานนี้เลยครับ:',
        bookIds: [1, 4, 3]
      }
    }

    if (q.includes('เริ่มต้น') || q.includes('พื้นฐาน') || q.includes('มือใหม่') || q.includes('2026') || q.includes('แรก')) {
      return {
        responseText: 'ยินดีต้อนรับสู่เส้นทางการเป็นนักพัฒนาเว็บครับ! สำหรับผู้เริ่มต้น แนะนำให้เริ่มจากสถาปัตยกรรม React & TypeScript เพื่อสร้างรากฐานที่แข็งแรง และต่อยอดด้วย Next.js 15 ครับ:',
        bookIds: [5, 4, 1]
      }
    }

    if (q.includes('database') || q.includes('sql') || q.includes('supabase') || q.includes('ฐานข้อมูล') || q.includes('backend')) {
      return {
        responseText: 'สาย Backend & Data Management ต้องห้ามพลาดครับ! เล่มที่ช่วยเจาะลึกโครงสร้างฐานข้อมูลเชิงสัมพันธ์, Normalization 3NF และ Supabase RLS โดยเฉพาะ:',
        bookIds: [2, 7, 8]
      }
    }

    if (q.includes('500') || q.includes('งบ') || q.includes('คุ้ม') || q.includes('ประหยัด')) {
      return {
        responseText: 'ด้วยงบประมาณ 500 บาท คุณสามารถเลือกซื้อเล่มดีไซน์ระบบร่วมกับเล่มฟรอนต์เอนด์ได้คุ้มค่ามาก พร้อมรับ GusSo Coins สะสมคืนอีก 10% ครับ:',
        bookIds: [11, 13]
      }
    }

    if (q.includes('ขายดี') || q.includes('ยอดนิยม') || q.includes('5 ดาว') || q.includes('รีวิว')) {
      return {
        responseText: 'นี่คือหนังสือ E-Book ระดับ Best Seller ที่ได้รับคะแนนรีวิว 5.0 เต็มจากผู้อ่านมากกว่า 50+ คนครับ:',
        bookIds: [3, 7, 13]
      }
    }

    if (q.includes('design') || q.includes('figma') || q.includes('ux') || q.includes('ui') || q.includes('tailwind')) {
      return {
        responseText: 'สำหรับสาย Design & Frontend UI/UX แนะนำชุดคู่มือที่จะเปลี่ยนงานดีไซน์บน Figma สู่โค้ด Tailwind CSS ที่สวยงามและตอบสนองได้ทุกขนาดหน้าจอครับ:',
        bookIds: [11, 12, 13]
      }
    }

    // Default recommendation
    return {
      responseText: `จากที่คุณสอบถาม "${query}" ผมขอแนะนำหนังสือที่มีเนื้อหาครอบคลุมและได้รับความนิยมสูงในการพัฒนาซอฟต์แวร์ระดับมืออาชีพตามนี้ครับ:`,
      bookIds: [1, 2]
    }
  }

  const handleSend = (textToSend?: string) => {
    const query = (textToSend || input).trim()
    if (!query || isTyping) return

    const userMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      sender: 'user',
      text: query,
      timestamp: 'ตอนนี้'
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    // สังเคราะห์การประมวลผลคำตอบแบบเป็นธรรมชาติ
    setTimeout(() => {
      const { responseText, bookIds } = findRecommendations(query)
      const aiMsg: ChatMessage = {
        id: 'msg_ai_' + Date.now(),
        sender: 'ai',
        text: responseText,
        recommendedBookIds: bookIds,
        timestamp: 'ตอนนี้'
      }
      setMessages(prev => [...prev, aiMsg])
      setIsTyping(false)
    }, 900)
  }

  return (
    <>
      {/* ปุ่มลอยเรียก AI Assistant ด้านล่างขวา (Floating Launcher Button) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white p-3.5 sm:px-5 sm:py-3.5 rounded-full shadow-2xl shadow-indigo-500/40 flex items-center gap-2.5 transition transform hover:scale-105 active:scale-95 cursor-pointer border border-white/20 group"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-amber-300 animate-bounce" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-indigo-950 animate-ping"></span>
          </div>
          <span className="font-extrabold text-xs sm:text-sm tracking-wide hidden sm:inline">
            ถาม AI GusSo Advisor
          </span>
          <span className="bg-amber-400 text-indigo-950 text-[10px] font-black px-2 py-0.5 rounded-full">
            AI 24/7
          </span>
        </button>
      )}

      {/* หน้าต่าง AI Chat Drawer */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[95vw] sm:w-[420px] h-[580px] max-h-[90vh] bg-slate-900 border border-indigo-500/40 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white animate-in slide-in-from-bottom-5 duration-200">
          {/* ส่วนหัวหน้าต่างแชต */}
          <div className="p-4 bg-gradient-to-r from-indigo-950 via-purple-950 to-slate-950 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                <Bot className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                  AI Book Advisor
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                </h4>
                <p className="text-[11px] text-purple-200">ผู้ช่วยวิเคราะห์และจับคู่หนังสือที่เหมาะกับคุณ</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>

          {/* รายการข้อความแชต */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 leading-relaxed shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-xs'
                      : 'bg-slate-800 text-slate-200 border border-white/10 rounded-tl-xs'
                  }`}
                >
                  <p>{msg.text}</p>

                  {/* แสดงการ์ดหนังสือที่แนะนำในข้อความแชต */}
                  {msg.recommendedBookIds && msg.recommendedBookIds.length > 0 && (
                    <div className="mt-3 space-y-2 pt-2 border-t border-white/10">
                      {msg.recommendedBookIds.map(id => {
                        const book = UNIQUE_EBOOKS_METADATA[id]
                        if (!book) return null
                        return (
                          <div
                            key={id}
                            className="bg-slate-900/90 p-2.5 rounded-xl border border-indigo-500/20 flex items-center gap-2.5"
                          >
                            <img
                              src={book.cover_image}
                              alt={book.title}
                              className="w-10 h-14 object-cover rounded-md shadow-xs border border-white/10 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <h5 className="font-bold text-[11px] text-white truncate">{book.title}</h5>
                              <p className="text-[10px] text-amber-300 font-extrabold mt-0.5">฿{book.price} บาท</p>
                            </div>
                            {onAddToCart && (
                              <button
                                onClick={() =>
                                  onAddToCart({
                                    ebook_id: id,
                                    title: book.title,
                                    price: book.price,
                                    cover_image: book.cover_image,
                                    description: book.description
                                  })
                                }
                                title="ใส่ตะกร้าทันที"
                                className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition shrink-0 cursor-pointer shadow-xs"
                              >
                                <ShoppingBag className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-slate-400 text-xs italic">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                <span>AI กำลังวิเคราะห์หนังสือที่ตรงกับคุณ...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ชิปคำถามตัวอย่างด่วน (Quick Prompt Chips) */}
          <div className="px-3 py-2 bg-slate-950/70 border-t border-white/5 flex gap-1.5 overflow-x-auto no-scrollbar">
            {PRESET_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-800 hover:bg-indigo-900/40 text-[10px] text-purple-200 border border-purple-500/20 transition cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* ช่องพิมพ์ข้อความ (Input Bar) */}
          <div className="p-3 bg-slate-950 border-t border-white/10 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="พิมพ์คำถามหรือเป้าหมายที่อยากเรียนรู้..."
              className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
