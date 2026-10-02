'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, User, Lock, Eye, EyeOff, Save, CheckCircle, Shield, Award, Coins, Sparkles, Gift } from 'lucide-react'
import { getGussoCoins, getUserBadges, getCoinHistory, Badge, GussoCoinTransaction } from '@/lib/gamification'
import { ThemeToggleCyberpunk } from '@/components/theme-toggle-cyberpunk'

export default function ProfilePage() {
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [username, setUsername] = useState<string>('')
  const [createdAt, setCreatedAt] = useState<string>('')
  const [roleId, setRoleId] = useState<number>(2)

  // เปลี่ยนรหัสผ่าน
  const [newPassword, setNewPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  // Gamification state
  const [userCoins, setUserCoins] = useState(150)
  const [badges, setBadges] = useState<Badge[]>([])
  const [coinHistory, setCoinHistory] = useState<GussoCoinTransaction[]>([])

  const fetchUserProfile = useCallback(async () => {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      setLoading(false)
      return
    }

    const u = session.user
    setUserId(u.id)
    setEmail(u.email || '')
    setCreatedAt(u.created_at || '')

    const currentName = u.user_metadata?.username || u.user_metadata?.full_name || u.email?.split('@')[0] || ''
    setUsername(currentName)

    // ตรวจสอบบทบาทจากตาราง public.users
    let currentRoleId = 2
    if (u.email === 'admin@gusso.com') {
      currentRoleId = 1
    } else {
      try {
        const { data: dbUser } = await supabase.from('users').select('role_id, role').eq('id', u.id).single()
        if (dbUser?.role_id) {
          currentRoleId = dbUser.role_id
        } else if (dbUser?.role === 'author') {
          currentRoleId = 3
        } else if (dbUser?.role === 'admin') {
          currentRoleId = 1
        }
      } catch (err) {
        console.warn('Fetch role from users table:', err)
      }

      // ตรวจสอบ fallback จาก localStorage
      try {
        const customRoles = JSON.parse(localStorage.getItem('gusso_custom_user_roles') || '{}')
        const override = customRoles[u.id] || (u.email ? customRoles[u.email] : undefined)
        if (override?.role_id) {
          currentRoleId = override.role_id
        }
      } catch (e) {
        // ignore
      }
    }
    setRoleId(currentRoleId)

    // โหลดข้อมูลเหรียญและเหรียญตรา
    setUserCoins(getGussoCoins())
    setBadges(getUserBadges())
    setCoinHistory(getCoinHistory())

    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchUserProfile()
  }, [fetchUserProfile])

  // บันทึกแก้ไขชื่อผู้ใช้
  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) {
      alert('กรุณากรอกชื่อผู้ใช้')
      return
    }

    setSavingProfile(true)
    try {
      const cleanName = username.trim()

      // อัปเดตใน Supabase Auth metadata
      const { error: authErr } = await supabase.auth.updateUser({
        data: {
          username: cleanName,
          full_name: cleanName
        }
      })

      if (authErr) throw authErr

      // อัปเดตในตาราง public.users ถ้ามี
      try {
        await supabase.from('users').update({ name: cleanName }).eq('id', userId)
      } catch (e) {
        // ignore
      }

      alert('✅ บันทึกชื่อผู้ใช้เรียบร้อยแล้ว!')
    } catch (err: unknown) {
      const error = err as { message?: string }
      alert('เกิดข้อผิดพลาด: ' + (error.message || 'โปรดลองใหม่อีกครั้ง'))
    } finally {
      setSavingProfile(false)
    }
  }

  // เปลี่ยนรหัสผ่านใหม่
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword.length < 6) {
      alert('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษรขึ้นไป')
      return
    }

    if (newPassword !== confirmPassword) {
      alert('รหัสผ่านทั้งสองช่องไม่ตรงกัน')
      return
    }

    setSavingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      alert('🔒 เปลี่ยนรหัสผ่านใหม่สำเร็จแล้ว!')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: unknown) {
      const error = err as { message?: string }
      alert('เปลี่ยนรหัสผ่านไม่สำเร็จ: ' + (error.message || 'โปรดลองใหม่อีกครั้ง'))
    } finally {
      setSavingPassword(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-3"></div>
      </main>
    )
  }

  if (!email) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-gray-100 text-center">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
            👤
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">กรุณาเข้าสู่ระบบก่อน</h1>
          <p className="text-sm text-gray-600 mb-6">คุณต้องเข้าสู่ระบบเพื่อแก้ไขข้อมูลส่วนตัวของคุณ</p>
          <div className="space-y-3">
            <Link
              href="/login"
              className="w-full block bg-indigo-600 text-white py-3 rounded-xl font-medium text-sm hover:bg-indigo-700 transition"
            >
              🔐 ไปยังหน้าเข้าสู่ระบบ
            </Link>
            <Link
              href="/"
              className="w-full block bg-gray-100 text-gray-600 py-3 rounded-xl font-medium text-sm hover:bg-gray-200 transition"
            >
              ← กลับสู่หน้าร้านค้า
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10 px-6 py-4 border-b border-gray-100">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition"
              title="กลับหน้าร้าน"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-600" />
              แก้ไขข้อมูลพื้นฐานของสมาชิก
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggleCyberpunk />
            <span className={`text-xs px-3 py-1 rounded-full font-semibold border ${
              roleId === 1 || email === 'admin@gusso.com'
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : roleId === 3
                ? 'bg-purple-50 text-purple-800 border-purple-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}>
              {roleId === 1 || email === 'admin@gusso.com'
                ? '🛡️ ผู้ดูแลระบบ (Admin)'
                : roleId === 3
                ? '✍️ นักเขียน / ผู้แต่ง (Author)'
                : '👤 สมาชิกทั่วไป (Customer)'}
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* การ์ดสรุปแต้ม GusSo Coins & เหรียญตราความสำเร็จ (Gamification Showcase) */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-500/20 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-2xl">
                🪙
              </div>
              <div>
                <h2 className="text-lg font-black text-amber-300">กระเป๋าเหรียญสะสม (GusSo Wallet)</h2>
                <p className="text-xs text-slate-300">แต้มสะสมจากคำสั่งซื้อและกล่องสุ่มรายวัน ใช้แลกส่วนลดได้ 10 Coins = 1 บาท</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-2xl sm:text-3xl font-black text-amber-400">{userCoins.toLocaleString()}</span>
                <span className="text-xs text-slate-400 block font-normal">Coins คงเหลือ</span>
              </div>
              <Link
                href="/"
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black px-4 py-2.5 rounded-xl transition shadow-md cursor-pointer shrink-0"
              >
                + ช้อปหนังสือสะสมเพิ่ม
              </Link>
            </div>
          </div>

          {/* ตู้โชว์เหรียญตรา (Badges Showcase) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-purple-200 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-purple-400" />
                <span>เหรียญตราความสำเร็จของฉัน ({badges.filter(b => b.isUnlocked).length}/{badges.length})</span>
              </h3>
              <span className="text-[11px] text-slate-400">ปลดล็อกเพื่อรับ GusSo Coins เพิ่ม</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {badges.map(b => (
                <div
                  key={b.id}
                  className={`p-3 rounded-2xl border flex items-center gap-3 transition ${
                    b.isUnlocked
                      ? 'bg-purple-950/40 border-purple-500/40 shadow-sm'
                      : 'bg-slate-950/30 border-white/5 opacity-40'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                    b.isUnlocked ? 'bg-purple-500/20 border border-purple-400/40' : 'bg-slate-800'
                  }`}>
                    {b.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs text-white truncate">{b.title}</p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{b.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* ข้อมูลพื้นฐาน & แก้ไขชื่อ */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6 border-b pb-4">
              <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
                👤
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">ข้อมูลบัญชีผู้ใช้งาน</h2>
                <p className="text-xs text-gray-400">แก้ไขชื่อแสดงผลของคุณในระบบ</p>
              </div>
            </div>

            <form onSubmit={handleUpdateName} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  อีเมล (แก้ไขไม่ได้)
                </label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full bg-gray-100 border border-gray-200 rounded-xl p-3 text-sm text-gray-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  ชื่อผู้ใช้ / ชื่อแสดงผล (Username)
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="กรอกชื่อผู้ใช้ของคุณ"
                  className="w-full border rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  สถานะบทบาทในระบบ (Role)
                </label>
                <div className={`p-3 rounded-xl border text-sm font-semibold flex items-center gap-2 ${
                  roleId === 1 || email === 'admin@gusso.com'
                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : roleId === 3
                    ? 'bg-purple-50 border-purple-200 text-purple-800'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}>
                  {roleId === 1 || email === 'admin@gusso.com'
                    ? '🛡️ ผู้ดูแลระบบ (Admin)'
                    : roleId === 3
                    ? '✍️ นักเขียน / ผู้แต่ง (Author)'
                    : '👤 สมาชิกทั่วไป (Customer)'}
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  * หากต้องการปรับบทบาทเป็นนักเขียนหรือผู้ดูแล สามารถติดต่อผู้ดูแลระบบเพื่อปรับสิทธิ์ได้
                </p>
              </div>

              <div>
                <span className="text-xs text-gray-400 block mb-1">
                  วันที่สมัครสมาชิก:
                </span>
                <span className="text-xs font-medium text-gray-600">
                  {createdAt ? new Date(createdAt).toLocaleString('th-TH') : '-'}
                </span>
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {savingProfile ? 'กำลังบันทึก...' : 'บันทึกการแก้ไขข้อมูล'}
              </button>
            </form>
          </div>

          {/* ฟอร์มเปลี่ยนรหัสผ่าน */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6 border-b pb-4">
              <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center font-bold">
                🔒
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">เปลี่ยนรหัสผ่านใหม่</h2>
                <p className="text-xs text-gray-400">รักษาความปลอดภัยของบัญชีคุณ</p>
              </div>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full border rounded-xl p-3 pr-10 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  ยืนยันรหัสผ่านใหม่อีกครั้ง
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full border rounded-xl p-3 pr-10 text-sm outline-none focus:ring-2 focus:ring-amber-500"
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
                disabled={savingPassword}
                className="w-full bg-amber-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-amber-700 transition shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Lock className="w-4 h-4" />
                {savingPassword ? 'กำลังอัปเดตรหัสผ่าน...' : 'อัปเดตรหัสผ่านใหม่'}
              </button>
            </form>
          </div>

        </div>
      </div>
    </main>
  )
}
