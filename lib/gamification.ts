// ระบบแต้มสะสม GusSo Coins, เหรียญตรา (Badges) และกล่องสุ่ม (Gamification System)

export type GussoCoinTransaction = {
  id: string
  amount: number
  type: 'earn' | 'spend'
  description: string
  timestamp: string
}

export type Badge = {
  id: string
  title: string
  description: string
  icon: string
  category: 'reader' | 'collector' | 'supporter' | 'special'
  isUnlocked: boolean
  unlockedAt?: string
}

export const ALL_BADGES: Badge[] = [
  {
    id: 'first_purchase',
    title: 'ก้าวแรกสู่นักอ่าน',
    description: 'สั่งซื้อหนังสือ E-Book เล่มแรกสำเร็จในระบบ',
    icon: '🌱',
    category: 'reader',
    isUnlocked: false
  },
  {
    id: 'code_enthusiast',
    title: 'แฟนพันธุ์แท้สายโค้ด',
    description: 'อ่านหรือสั่งซื้อหนังสือหมวด Next.js หรือ TypeScript',
    icon: '💻',
    category: 'reader',
    isUnlocked: false
  },
  {
    id: 'book_collector',
    title: 'นักสะสม E-Book',
    description: 'สะสมหนังสือในคลังตั้งแต่ 3 เล่มขึ้นไป',
    icon: '📚',
    category: 'collector',
    isUnlocked: false
  },
  {
    id: 'lucky_spinner',
    title: 'นักเสี่ยงโชคตัวยง',
    description: 'เปิดกล่องสุ่ม Mystery Box หรือหมุนวงล้อนำโชค',
    icon: '🎁',
    category: 'special',
    isUnlocked: false
  },
  {
    id: 'creator_patron',
    title: 'ผู้อุปถัมภ์นักเขียน',
    description: 'เลี้ยงกาแฟหรือโดเนทให้กำลังใจนักเขียนอย่างน้อย 1 ครั้ง',
    icon: '☕',
    category: 'supporter',
    isUnlocked: false
  },
  {
    id: 'ai_explorer',
    title: 'นักสำรวจ AI อัจฉริยะ',
    description: 'ใช้ AI Book Advisor หรือ AI Book Summarizer ช่วยเลือกหนังสือ',
    icon: '🤖',
    category: 'special',
    isUnlocked: false
  }
]

export type MysteryBoxPrize = {
  type: 'coins' | 'discount' | 'special'
  title: string
  value: number | string
  description: string
  icon: string
}

const STORAGE_KEYS = {
  COINS: 'gusso_coins',
  COIN_HISTORY: 'gusso_coin_history',
  BADGES: 'gusso_unlocked_badges',
  LAST_MYSTERY_SPIN: 'gusso_last_mystery_spin',
  ACTIVE_COUPONS: 'gusso_user_coupons'
}

// ----------------- COINS MANAGEMENT -----------------

export function getGussoCoins(): number {
  if (typeof window === 'undefined') return 150
  const saved = localStorage.getItem(STORAGE_KEYS.COINS)
  if (saved === null) {
    // โบนัสต้อนรับสมาชิกใหม่ 150 เหรียญ
    localStorage.setItem(STORAGE_KEYS.COINS, '150')
    return 150
  }
  return parseInt(saved, 10) || 0
}

export function addGussoCoins(amount: number, description: string): number {
  if (typeof window === 'undefined') return 0
  const current = getGussoCoins()
  const updated = current + amount
  localStorage.setItem(STORAGE_KEYS.COINS, updated.toString())

  // บันทึกประวัติ
  const history = getCoinHistory()
  const tx: GussoCoinTransaction = {
    id: 'tx_' + Date.now(),
    amount,
    type: 'earn',
    description,
    timestamp: new Date().toISOString()
  }
  localStorage.setItem(STORAGE_KEYS.COIN_HISTORY, JSON.stringify([tx, ...history].slice(0, 30)))

  // แจ้งเตือนทุก Component ผ่าน CustomEvent
  window.dispatchEvent(new CustomEvent('gusso_coins_updated', { detail: { coins: updated, delta: amount } }))
  return updated
}

export function spendGussoCoins(amount: number, description: string): boolean {
  if (typeof window === 'undefined') return false
  const current = getGussoCoins()
  if (current < amount) return false

  const updated = current - amount
  localStorage.setItem(STORAGE_KEYS.COINS, updated.toString())

  const history = getCoinHistory()
  const tx: GussoCoinTransaction = {
    id: 'tx_' + Date.now(),
    amount,
    type: 'spend',
    description,
    timestamp: new Date().toISOString()
  }
  localStorage.setItem(STORAGE_KEYS.COIN_HISTORY, JSON.stringify([tx, ...history].slice(0, 30)))

  window.dispatchEvent(new CustomEvent('gusso_coins_updated', { detail: { coins: updated, delta: -amount } }))
  return true
}

export function getCoinHistory(): GussoCoinTransaction[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COIN_HISTORY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

// ----------------- BADGES MANAGEMENT -----------------

export function getUserBadges(): Badge[] {
  if (typeof window === 'undefined') return ALL_BADGES
  try {
    const unlockedRaw = localStorage.getItem(STORAGE_KEYS.BADGES)
    const unlockedMap: Record<string, string> = unlockedRaw ? JSON.parse(unlockedRaw) : {}
    return ALL_BADGES.map(b => ({
      ...b,
      isUnlocked: !!unlockedMap[b.id],
      unlockedAt: unlockedMap[b.id]
    }))
  } catch {
    return ALL_BADGES
  }
}

export function unlockBadge(badgeId: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    const unlockedRaw = localStorage.getItem(STORAGE_KEYS.BADGES)
    const unlockedMap: Record<string, string> = unlockedRaw ? JSON.parse(unlockedRaw) : {}
    if (unlockedMap[badgeId]) return false // ปลดล็อกแล้ว

    unlockedMap[badgeId] = new Date().toISOString()
    localStorage.setItem(STORAGE_KEYS.BADGES, JSON.stringify(unlockedMap))

    // มอบรางวัล Coins พิเศษเมื่อปลดล็อกเหรียญตราได้สำเร็จ (+50 เหรียญ)
    addGussoCoins(50, `ปลดล็อกเหรียญตรา: ${ALL_BADGES.find(b => b.id === badgeId)?.title || badgeId}`)

    window.dispatchEvent(new CustomEvent('gusso_badge_unlocked', { detail: { badgeId } }))
    return true
  } catch {
    return false
  }
}

// ----------------- MYSTERY BOX & DAILY SPIN -----------------

export function canOpenMysteryBox(): { canOpen: boolean; remainingHours: number; remainingMinutes: number } {
  if (typeof window === 'undefined') return { canOpen: true, remainingHours: 0, remainingMinutes: 0 }
  const lastSpin = localStorage.getItem(STORAGE_KEYS.LAST_MYSTERY_SPIN)
  if (!lastSpin) return { canOpen: true, remainingHours: 0, remainingMinutes: 0 }

  const lastSpinTime = parseInt(lastSpin, 10)
  const now = Date.now()
  const cooldownMs = 24 * 60 * 60 * 1000 // 24 ชม.
  const diff = now - lastSpinTime

  if (diff >= cooldownMs) {
    return { canOpen: true, remainingHours: 0, remainingMinutes: 0 }
  }

  const remainingMs = cooldownMs - diff
  const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60))
  const remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60))
  return { canOpen: false, remainingHours, remainingMinutes }
}

export function openMysteryBox(): MysteryBoxPrize {
  const prizes: MysteryBoxPrize[] = [
    { type: 'coins', title: '50 GusSo Coins', value: 50, description: 'แต้มสะสมใช้เป็นส่วนลดเงินสดได้ทันที', icon: '🪙' },
    { type: 'coins', title: '100 GusSo Coins', value: 100, description: 'แต้มสะสมรางวัลใหญ่เข้ากระเป๋าของคุณ', icon: '💰' },
    { type: 'discount', title: 'คูปองลด 15%', value: 'LUCKY15', description: 'ใช้ลดเพิ่มได้ในหน้าชำระเงินทุกรายการ', icon: '🎟️' },
    { type: 'discount', title: 'คูปองลด 25%', value: 'LUCKY25', description: 'คูปองพิเศษสำหรับหนังสือที่คุณชื่นชอบ', icon: '⚡' },
    { type: 'discount', title: 'Super Jackpot ลด 50%', value: 'JACKPOT50', description: 'ลดราคาสูงสุด 50% สำหรับ 1 รายการสั่งซื้อ', icon: '🔥' },
    { type: 'coins', title: '250 GusSo Coins', value: 250, description: 'แจ็กพอตเหรียญสะสมจุใจ!', icon: '👑' }
  ]

  // สุ่มรางวัลตามน้ำหนัก
  const selectedIndex = Math.floor(Math.random() * prizes.length)
  const prize = prizes[selectedIndex]

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.LAST_MYSTERY_SPIN, Date.now().toString())

    // บันทึกผลรางวัล
    if (prize.type === 'coins') {
      addGussoCoins(Number(prize.value), `รางวัลจากกล่องสุ่ม Mystery Box (${prize.title})`)
    } else if (prize.type === 'discount') {
      try {
        const savedCoupons = localStorage.getItem(STORAGE_KEYS.ACTIVE_COUPONS)
        const coupons: string[] = savedCoupons ? JSON.parse(savedCoupons) : []
        if (!coupons.includes(String(prize.value))) {
          coupons.push(String(prize.value))
          localStorage.setItem(STORAGE_KEYS.ACTIVE_COUPONS, JSON.stringify(coupons))
        }
      } catch {
        // fallback
      }
    }

    // ปลดล็อกเหรียญตราเปิดกล่องสุ่ม
    unlockBadge('lucky_spinner')
  }

  return prize
}
