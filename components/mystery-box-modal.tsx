'use client'

import React, { useState, useEffect } from 'react'
import { Gift, Sparkles, Coins, Award, Clock, Check, Copy, X } from 'lucide-react'
import { canOpenMysteryBox, openMysteryBox, MysteryBoxPrize, getGussoCoins, getUserBadges, Badge } from '@/lib/gamification'

interface MysteryBoxModalProps {
  isOpen: boolean
  onClose: () => void
  onApplyCoupon?: (code: string) => void
}

export function MysteryBoxModal({ isOpen, onClose, onApplyCoupon }: MysteryBoxModalProps) {
  const [activeTab, setActiveTab] = useState<'box' | 'badges'>('box')
  const [isOpening, setIsOpening] = useState(false)
  const [prize, setPrize] = useState<MysteryBoxPrize | null>(null)
  const [cooldown, setCooldown] = useState({ canOpen: true, remainingHours: 0, remainingMinutes: 0 })
  const [coins, setCoins] = useState(150)
  const [badges, setBadges] = useState<Badge[]>([])
  const [copiedCode, setCopiedCode] = useState(false)

  const refreshState = () => {
    setCooldown(canOpenMysteryBox())
    setCoins(getGussoCoins())
    setBadges(getUserBadges())
  }

  useEffect(() => {
    if (isOpen) {
      refreshState()
      setPrize(null)
      setCopiedCode(false)
    }
  }, [isOpen])

  const handleOpenBox = () => {
    if (!cooldown.canOpen || isOpening) return
    setIsOpening(true)
    setPrize(null)

    // เอฟเฟกต์หมุนสุ่ม 2.2 วินาที
    setTimeout(() => {
      const wonPrize = openMysteryBox()
      setPrize(wonPrize)
      setIsOpening(false)
      refreshState()
    }, 2200)
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(true)
    if (onApplyCoupon) {
      onApplyCoupon(code)
    }
    setTimeout(() => setCopiedCode(false), 2500)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-white">
        {/* หัวโมดัลพร้อมสลับแท็บ */}
        <div className="p-5 bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-xl">
              🎁
            </div>
            <div>
              <h3 className="font-black text-lg text-amber-300">กล่องสุ่ม & เหรียญตรา (Lucky Box)</h3>
              <p className="text-xs text-slate-300">
                เหรียญของคุณ: <strong className="text-amber-400 font-extrabold">{coins.toLocaleString()} Coins</strong> (🪙 10 Coins = 1 บาท)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* เมนูสลับแท็บ */}
        <div className="flex border-b border-white/10 bg-slate-950/60 p-1">
          <button
            onClick={() => setActiveTab('box')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'box'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Gift className="w-4 h-4" />
            <span>กล่องสุ่มรายวัน (Daily Mystery Box)</span>
          </button>
          <button
            onClick={() => setActiveTab('badges')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'badges'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>เหรียญตราความสำเร็จ ({badges.filter(b => b.isUnlocked).length}/{badges.length})</span>
          </button>
        </div>

        {/* เนื้อหาแต่ละแท็บ */}
        <div className="p-6">
          {activeTab === 'box' ? (
            <div className="flex flex-col items-center text-center space-y-6">
              {/* อนิเมชันกล่องสุ่ม */}
              <div className="relative">
                {/* แสงออร่าหมุน */}
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/30 to-purple-500/30 rounded-full blur-2xl animate-pulse"></div>

                <div
                  className={`w-36 h-36 rounded-3xl bg-gradient-to-br from-amber-400 via-orange-500 to-amber-700 flex items-center justify-center text-6xl shadow-2xl border-4 border-amber-300/80 relative z-10 transition-all duration-300 ${
                    isOpening ? 'animate-bounce scale-110 rotate-6' : 'hover:scale-105'
                  }`}
                >
                  {isOpening ? '✨' : prize ? prize.icon : '🎁'}
                </div>
              </div>

              {/* ข้อความบอกผลหรือสถานะ */}
              {isOpening ? (
                <div className="space-y-1">
                  <h4 className="text-lg font-black text-amber-300 animate-pulse">กำลังเปิดกล่องสุ่มนำโชค...</h4>
                  <p className="text-xs text-slate-400">ลุ้นรับส่วนลดสูงสุด 50% หรือ GusSo Coins มากมาย!</p>
                </div>
              ) : prize ? (
                <div className="bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-amber-500/10 border border-amber-400/40 p-5 rounded-2xl w-full space-y-3 animate-in zoom-in-95">
                  <span className="text-xs uppercase font-extrabold tracking-widest text-amber-300 bg-amber-500/20 px-3 py-1 rounded-full border border-amber-400/30">
                    ยินดีด้วย! คุณได้รับรางวัล
                  </span>
                  <div className="text-2xl font-black text-white">{prize.title}</div>
                  <p className="text-xs text-slate-300">{prize.description}</p>

                  {prize.type === 'discount' && (
                    <div className="pt-2 flex items-center justify-center gap-2">
                      <span className="px-4 py-2 rounded-xl bg-slate-950 font-mono text-sm font-black text-amber-300 border border-dashed border-amber-500/60">
                        {String(prize.value)}
                      </span>
                      <button
                        onClick={() => handleCopyCode(String(prize.value))}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition flex items-center gap-1.5 shadow-md cursor-pointer"
                      >
                        {copiedCode ? <Check className="w-4 h-4 text-emerald-800" /> : <Copy className="w-4 h-4" />}
                        <span>{copiedCode ? 'คัดลอกและใช้แล้ว!' : 'คัดลอกโค้ด'}</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <h4 className="text-lg font-black text-white">เปิดกล่องสุ่มรับโชคฟรีวันละ 1 ครั้ง!</h4>
                  <p className="text-xs text-slate-400 max-w-sm">
                    ลุ้นรับ GusSo Coins แต้มสะสมใช้แทนเงินสด หรือคูปองส่วนลดพิเศษ 15%, 25%, สูงสุด 50%
                  </p>
                </div>
              )}

              {/* ปุ่มกดเปิดกล่องสุ่ม */}
              {!prize && (
                <div>
                  {cooldown.canOpen ? (
                    <button
                      onClick={handleOpenBox}
                      disabled={isOpening}
                      className="bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black px-8 py-3.5 rounded-2xl text-sm transition shadow-xl shadow-amber-500/20 cursor-pointer transform hover:scale-105 active:scale-95 disabled:opacity-50"
                    >
                      {isOpening ? 'กำลังเปิด...' : '✨ แตะเพื่อเปิดกล่องสุ่มฟรี!'}
                    </button>
                  ) : (
                    <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-800/80 border border-white/10 text-xs text-slate-400">
                      <Clock className="w-4 h-4 text-amber-400" />
                      <span>เปิดได้อีกครั้งใน: <strong className="text-amber-300">{cooldown.remainingHours} ชม. {cooldown.remainingMinutes} นาที</strong></span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* แท็บเหรียญตราความสำเร็จ (Badges) */
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {badges.map(b => (
                <div
                  key={b.id}
                  className={`p-3.5 rounded-2xl border flex items-center gap-3.5 transition ${
                    b.isUnlocked
                      ? 'bg-purple-950/40 border-purple-500/40 shadow-sm'
                      : 'bg-slate-950/40 border-white/5 opacity-50'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${
                      b.isUnlocked
                        ? 'bg-purple-500/20 border border-purple-400/40 shadow-md shadow-purple-500/20'
                        : 'bg-slate-800 text-slate-600'
                    }`}
                  >
                    {b.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h5 className="font-bold text-sm text-white truncate">{b.title}</h5>
                      {b.isUnlocked ? (
                        <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          ปลดล็อกแล้ว
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                          ล็อกอยู่
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{b.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
