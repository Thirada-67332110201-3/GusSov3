'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'

export default function ResetPasswordPage() {
  const supabase = createClient()
  const router = useRouter()
  
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      alert('รหัสผ่านทั้งสองช่องไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง')
      return
    }

    if (password.length < 6) {
      alert('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษรขึ้นไป')
      return
    }

    setLoading(true)

    // อัปเดตรหัสผ่านใหม่เข้าสู่ระบบ Supabase Auth
    const { error } = await supabase.auth.updateUser({
      password: password
    })

    if (error) {
      alert('เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน: ' + error.message)
      setLoading(false)
    } else {
      alert('เปลี่ยนรหัสผ่านสำเร็จ! ระบบได้บันทึกรหัสผ่านใหม่ของคุณเรียบร้อยแล้ว กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่')
      router.push('/login')
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        
        <h1 className="text-2xl font-bold text-gray-800 text-center mb-2">
          🔒 ตั้งรหัสผ่านใหม่
        </h1>
        <p className="text-xs text-gray-500 text-center mb-6">
          กรุณากรอกรหัสผ่านใหม่ที่คุณต้องการใช้งานสำหรับบัญชี GusSo Store
        </p>
        
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่านใหม่</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border rounded-lg p-3 pr-10 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="••••••••"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ยืนยันรหัสผ่านใหม่อีกครั้ง</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border rounded-lg p-3 pr-10 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="••••••••"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition font-medium text-sm disabled:opacity-50 shadow-sm"
          >
            {loading ? 'กำลังบันทึกรหัสผ่าน...' : '💾 บันทึกรหัสผ่านใหม่'}
          </button>
        </form>

        <div className="mt-6 text-center border-t pt-4">
          <a href="/login" className="text-sm text-gray-500 hover:text-indigo-600 transition">
            ← กลับไปหน้าเข้าสู่ระบบ
          </a>
        </div>
      </div>
    </main>
  )
}