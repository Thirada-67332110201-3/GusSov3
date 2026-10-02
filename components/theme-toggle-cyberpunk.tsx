'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Sun, Moon, Sparkles } from 'lucide-react'

export function ThemeToggleCyberpunk() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse border border-slate-200 dark:border-slate-700" />
    )
  }

  const isDark = theme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      title={isDark ? 'เปลี่ยนเป็น Light Mode' : 'เปลี่ยนเป็น Dark Mode (Cyberpunk & Neon)'}
      className={`relative p-2 rounded-xl border transition-all duration-300 flex items-center justify-center cursor-pointer group ${
        isDark
          ? 'bg-slate-900 border-indigo-500/40 text-amber-300 shadow-md shadow-indigo-500/10 hover:border-indigo-400'
          : 'bg-white border-slate-200 text-indigo-600 shadow-xs hover:border-indigo-300 hover:bg-indigo-50/50'
      }`}
    >
      {isDark ? (
        <div className="flex items-center gap-1">
          <Moon className="w-4 h-4 text-indigo-400 transition transform group-hover:-rotate-12" />
          <Sparkles className="w-2.5 h-2.5 text-amber-400 animate-pulse" />
        </div>
      ) : (
        <Sun className="w-4 h-4 text-amber-500 transition transform group-hover:rotate-45" />
      )}
    </button>
  )
}
