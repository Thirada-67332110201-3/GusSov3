'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Sun, Moon, Sparkles } from 'lucide-react'

export function ThemeToggleCyberpunk({ floating = false }: { floating?: boolean }) {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className={floating ? "w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse border border-slate-200 dark:border-slate-700 shadow-md" : "w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse border border-slate-200 dark:border-slate-700"} />
    )
  }

  const isDark = theme === 'dark'

  if (floating) {
    return (
      <button
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        title={isDark ? 'เปลี่ยนเป็น Light Mode (โหมดสว่าง)' : 'เปลี่ยนเป็น Dark Mode (โหมดมืด)'}
        className={`group flex items-center gap-2 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-full border transition-all duration-300 shadow-xl backdrop-blur-md cursor-pointer hover:scale-105 active:scale-95 ${
          isDark
            ? 'bg-slate-900/90 border-indigo-500/40 text-amber-300 shadow-indigo-500/20 hover:border-indigo-400 hover:bg-slate-900'
            : 'bg-white/95 border-slate-200/90 text-indigo-700 shadow-slate-300/50 hover:border-indigo-300 hover:bg-white'
        }`}
      >
        {isDark ? (
          <div className="flex items-center gap-1.5">
            <Moon className="w-4 h-4 text-indigo-400 transition transform group-hover:-rotate-12" />
            <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
            <span className="text-xs font-bold text-slate-200 hidden sm:inline">โหมดมืด</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <Sun className="w-4 h-4 text-amber-500 transition transform group-hover:rotate-45" />
            <span className="text-xs font-bold text-slate-700 hidden sm:inline">โหมดสว่าง</span>
          </div>
        )}
      </button>
    )
  }

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
