'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert('เข้าสู่ระบบไม่สำเร็จ: ' + error.message)
      setLoading(false)
    } else {
      alert('เข้าสู่ระบบสำเร็จ!')
      if (email === 'admin@gusso.com') {
        router.push('/admin') // ถ้าเป็นแอดมินพาไปหน้าหลังบ้าน
      } else {
        router.push('/') // ถ้าเป็นลูกค้าทั่วไปกลับหน้าแรก
      }
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-800 text-center mb-6">🔐 เข้าสู่ระบบ GusSo Store</h1>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="admin@gusso.com"
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
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition font-medium text-sm disabled:opacity-50 shadow-sm"
          >
            {loading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href="/" className="text-sm text-gray-500 hover:text-indigo-600 transition">
            ← กลับสู่หน้าแรก
          </a>
        </div>
      </div>
    </main>
  )
}