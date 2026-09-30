'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import emailjs from '@emailjs/browser'
import { useRouter } from 'next/navigation'

type Mode = 'login' | 'signup' | 'forgot'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('login')
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  // จัดการเข้าสู่ระบบ
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      alert('เข้าสู่ระบบไม่สำเร็จ: ' + error.message)
      setLoading(false)
    } else {
      alert('เข้าสู่ระบบสำเร็จ!')
      if (email === 'admin@gusso.com') {
        router.push('/admin')
      } else {
        router.push('/')
      }
    }
  }

  // จัดการสมัครสมาชิก
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signUp({ email, password })

    if (error) {
      alert('สมัครสมาชิกไม่สำเร็จ: ' + error.message)
    } else {
      alert('สมัครสมาชิกสำเร็จ! สามารถเข้าสู่ระบบได้ทันที')
      setMode('login')
    }
    setLoading(false)
  }

  // จัดการส่งอีเมลรีเซ็ตรหัสผ่านผ่าน EmailJS (ใช้ตัวแปร link ให้ตรงกับ Template ของคุณ)
  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      alert('กรุณากรอกอีเมลของคุณ')
      return
    }

    setLoading(true)

    const resetLink = `${window.location.origin}/reset-password`

    const templateParams = {
      email: email,
      name: email.split('@')[0],
      link: resetLink // ตรงกับตัวแปร {{link}} ใน EmailJS Template ของคุณ
    }

    try {
      await emailjs.send(
        'service_5t8qqtj',          // Service ID
        'template_1ln8ve7',         // Template ID: Password Reset
        templateParams,
        'rKpRB3YPhevxOZaEA'         // Public Key
      )

      alert(`🔑 ระบบได้ส่งอีเมลรีเซ็ตรหัสผ่านไปที่ ${email} เรียบร้อยแล้ว! กรุณาตรวจสอบกล่องข้อความของคุณ`)
      setMode('login')
    } catch (error: unknown) {
      const err = error as { text?: string; message?: string }
      alert('ส่งอีเมลไม่สำเร็จ: ' + (err.text || err.message || 'กรุณาตรวจสอบการเชื่อมต่อ'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        
        <h1 className="text-2xl font-bold text-gray-800 text-center mb-6">
          {mode === 'login' && '🔐 เข้าสู่ระบบ GusSo Store'}
          {mode === 'signup' && '📝 สมัครสมาชิกใหม่'}
          {mode === 'forgot' && '🔑 ลืมรหัสผ่าน / รีเซ็ต'}
        </h1>
        
        {/* FORM LOGIN */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="example@email.com"
                autoComplete="email"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>
            <div className="flex justify-between items-center text-sm">
              <button
                type="button"
                onClick={() => setMode('forgot')}
                className="text-indigo-600 hover:underline font-medium"
              >
                ลืมรหัสผ่าน?
              </button>
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="text-indigo-600 hover:underline font-medium"
              >
                สมัครสมาชิก
              </button>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition font-medium text-sm disabled:opacity-50 shadow-sm"
            >
              {loading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
            </button>
          </form>
        )}

        {/* FORM SIGNUP */}
        {mode === 'signup' && (
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="example@email.com"
                autoComplete="email"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="••••••••"
                autoComplete="new-password"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 transition font-medium text-sm disabled:opacity-50 shadow-sm"
            >
              {loading ? 'กำลังสมัครสมาชิก...' : 'ยืนยันการสมัครสมาชิก'}
            </button>
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-sm text-gray-600 hover:underline"
              >
                มีบัญชีอยู่แล้ว? เข้าสู่ระบบ
              </button>
            </div>
          </form>
        )}

        {/* FORM FORGOT PASSWORD */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgot} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">อีเมลที่ใช้สมัคร</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="example@email.com"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-600 text-white py-3 rounded-lg hover:bg-amber-700 transition font-medium text-sm disabled:opacity-50 shadow-sm"
            >
              {loading ? 'กำลังส่งอีเมลรีเซ็ต...' : '🔑 ส่งลิงก์รีเซ็ตรหัสผ่าน'}
            </button>
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-sm text-gray-600 hover:underline"
              >
                ← กลับไปหน้าเข้าสู่ระบบ
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 text-center border-t pt-4">
          <a href="/" className="text-sm text-gray-500 hover:text-indigo-600 transition">
            ← กลับสู่หน้าแรก
          </a>
        </div>
      </div>
    </main>
  )
}