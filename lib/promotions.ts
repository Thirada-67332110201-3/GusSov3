// ========================================================
// lib/promotions.ts - ระบบโปรโมชั่นเปลี่ยนรายอาทิตย์ (Weekly Promotion Engine)
// GusSo E-Book Store
//
// ข้อกำหนดสำคัญ:
// 1. เปลี่ยนโปรโมชั่นอัตโนมัติรายอาทิตย์ (ตามสัปดาห์ปฏิทิน รีเซ็ตทุกเที่ยงคืนวันอาทิตย์)
// 2. ห้ามลดจนติดลบ หรือราคา 0 บาท เด็ดขาด (Minimum Price Guarantee)
// ========================================================

export interface WeeklyPromotionCampaign {
  id: string
  title: string
  badge: string
  description: string
  targetCategoryId?: number // หมวดหมู่ที่ได้โปรโมชั่น (ถ้ามี)
  featuredBookId?: number // เล่มไฮไลท์ประจำสัปดาห์
  categoryDiscountPercent: number // ส่วนลดหมวดหมู่ (เช่น 20%)
  featuredDiscountPercent: number // ส่วนลดเล่มไฮไลท์ (เช่น 30%)
  gradient: string
  themeColor: string
}

// แคมเปญโปรโมชั่น 4 สัปดาห์ หมุนเวียนรายอาทิตย์
export const WEEKLY_CAMPAIGNS: WeeklyPromotionCampaign[] = [
  {
    id: 'week-nextjs-fullstack',
    title: '🚀 Next.js & Fullstack Super Week',
    badge: 'ดีลเด็ดประจำสัปดาห์: สัปดาห์ฟูลสแต็ก',
    description: 'ลดพิเศษ 20% สำหรับหนังสือหมวด Next.js & Supabase พร้อมลดเล่มไฮไลท์ 30%!',
    targetCategoryId: 1,
    featuredBookId: 1, // Next.js 15 Guide
    categoryDiscountPercent: 20,
    featuredDiscountPercent: 30,
    gradient: 'from-indigo-600 via-purple-600 to-pink-500',
    themeColor: 'indigo'
  },
  {
    id: 'week-frontend-ts',
    title: '⚡ Frontend & TypeScript Fest',
    badge: 'ดีลเด็ดประจำสัปดาห์: เทศกาลฟรอนต์เอนด์',
    description: 'ลดกระหน่ำ 25% สำหรับหนังสือหมวด TypeScript & Frontend สกิลขั้นเทพ!',
    targetCategoryId: 2,
    featuredBookId: 4, // Advanced TypeScript
    categoryDiscountPercent: 25,
    featuredDiscountPercent: 35,
    gradient: 'from-blue-600 via-cyan-600 to-teal-500',
    themeColor: 'blue'
  },
  {
    id: 'week-database-backend',
    title: '🗄️ Database & Backend Architecture Week',
    badge: 'ดีลเด็ดประจำสัปดาห์: สถาปัตยกรรมข้อมูล',
    description: 'ลดจุใจ 20% เจาะลึก Database, PostgreSQL และ Cloud Architecture!',
    targetCategoryId: 3,
    featuredBookId: 7, // PostgreSQL Deep Dive
    categoryDiscountPercent: 20,
    featuredDiscountPercent: 30,
    gradient: 'from-emerald-600 via-teal-600 to-cyan-700',
    themeColor: 'emerald'
  },
  {
    id: 'week-uiux-design',
    title: '🎨 UI/UX Design & User Delight Week',
    badge: 'ดีลเด็ดประจำสัปดาห์: ดีไซน์ระดับโลก',
    description: 'ลดสะท้าน 25% หนังสือ UI/UX Design, Figma & Design System!',
    targetCategoryId: 4,
    featuredBookId: 10, // UI/UX Modern Design
    categoryDiscountPercent: 25,
    featuredDiscountPercent: 35,
    gradient: 'from-fuchsia-600 via-rose-600 to-amber-500',
    themeColor: 'rose'
  }
]

// วันที่คงที่อ้างอิงสำหรับการ Render ฝั่ง Server / Static Prerender ของ Next.js
export const DEFAULT_ANCHOR_DATE = new Date('2026-09-28T00:00:00.000Z')

/**
 * คำนวณข้อมูลสัปดาห์ปัจจุบัน (ISO Week Number และ วันที่เริ่มต้น-สิ้นสุดสัปดาห์)
 */
export function getWeeklyPeriodInfo(targetDate?: Date) {
  const now = targetDate ? new Date(targetDate) : new Date(DEFAULT_ANCHOR_DATE)

  // หาวันจันทร์ของสัปดาห์ปัจจุบัน (Monday = Start of week)
  const day = now.getDay() // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const diffToMonday = (day === 0 ? -6 : 1) - day
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() + diffToMonday)
  startOfWeek.setHours(0, 0, 0, 0)

  // หาวันอาทิตย์สิ้นสุดสัปดาห์ (Sunday 23:59:59)
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  endOfWeek.setHours(23, 59, 59, 999)

  // คำนวณ ISO Week Number (1-53)
  const target = new Date(now.valueOf())
  const dayNr = (now.getDay() + 6) % 7
  target.setDate(target.getDate() - dayNr + 3)
  const firstThursday = target.valueOf()
  target.setMonth(0, 1)
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7))
  }
  const weekNumber = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000)

  // หาแคมเปญประจำสัปดาห์จากดัชนี (0..3)
  const campaignIndex = (weekNumber - 1) % WEEKLY_CAMPAIGNS.length
  const activeCampaign = WEEKLY_CAMPAIGNS[campaignIndex]

  return {
    weekNumber,
    year: now.getFullYear(),
    startOfWeek,
    endOfWeek,
    campaignIndex,
    activeCampaign
  }
}

/**
 * กฎเหล็ก: คำนวณราคาส่วนลด โดยการันตีว่า
 * "ห้ามลดจนติดลบ หรือ ราคา 0 บาท เด็ดขาด"
 *
 * @param originalPrice ราคาปกติของหนังสือ
 * @param discountPercent เปอร์เซ็นต์ส่วนลด (เช่น 20)
 * @returns ข้อมูลราคาหลังหักส่วนลด และสถานะความถูกต้อง
 */
export function calculateDiscountPrice(
  originalPrice: number,
  discountPercent: number
): {
  originalPrice: number
  finalPrice: number
  discountAmount: number
  discountPercent: number
  isDiscounted: boolean
  isFloorGuarded: boolean
} {
  const validOriginal = Math.max(1, Number(originalPrice) || 0)

  // บังคับขีดจำกัดเปอร์เซ็นต์ส่วนลด: ขั้นต่ำ 0%, สูงสุดไม่เกิน 85%
  // (เพื่อป้องกันการลด 100% หรือลดติดลบเด็ดขาด)
  const safeDiscountPercent = Math.min(Math.max(0, discountPercent), 85)

  if (safeDiscountPercent <= 0) {
    return {
      originalPrice: validOriginal,
      finalPrice: validOriginal,
      discountAmount: 0,
      discountPercent: 0,
      isDiscounted: false,
      isFloorGuarded: false
    }
  }

  // คำนวณยอดเงินส่วนลด
  const rawDiscount = (validOriginal * safeDiscountPercent) / 100
  let calculatedPrice = Math.round(validOriginal - rawDiscount)

  // กำหนดราคาขั้นต่ำ (Floor Price): ต้องอย่างน้อย 9 บาท และห้ามเกินราคาเดิม
  // ป้องกันราคา 0 บาท และป้องกันราคาติดลบ 100%
  const MIN_FLOOR_PRICE = Math.min(validOriginal, 9)
  let finalPrice = Math.max(MIN_FLOOR_PRICE, calculatedPrice)
  let isFloorGuarded = false

  if (finalPrice < 1) {
    finalPrice = 1
    isFloorGuarded = true
  }

  const actualDiscountAmount = Math.max(0, validOriginal - finalPrice)
  const actualDiscountPercent = Math.round((actualDiscountAmount / validOriginal) * 100)

  return {
    originalPrice: validOriginal,
    finalPrice,
    discountAmount: actualDiscountAmount,
    discountPercent: actualDiscountPercent,
    isDiscounted: actualDiscountAmount > 0,
    isFloorGuarded
  }
}

/**
 * คำนวณราคาสุทธิของหนังสือแต่ละเล่มตามโปรโมชั่นประจำสัปดาห์
 */
export function getBookPromotionPricing(
  book: { ebook_id: number; price: number; category_id?: number },
  campaign: WeeklyPromotionCampaign,
  isPromotionActive: boolean = true
) {
  if (!isPromotionActive) {
    return {
      originalPrice: book.price,
      finalPrice: book.price,
      discountAmount: 0,
      discountPercent: 0,
      isDiscounted: false,
      badgeText: null,
      isFeatured: false
    }
  }

  // ตรวจสอบว่าตรงกับเล่มไฮไลท์ประจำสัปดาห์หรือไม่
  const isFeatured = campaign.featuredBookId === book.ebook_id
  const isCategoryEligible = campaign.targetCategoryId === book.category_id

  let discountPercent = 0
  let badgeText: string | null = null

  if (isFeatured) {
    discountPercent = campaign.featuredDiscountPercent
    badgeText = `🔥 ดีลเด่น -${discountPercent}%`
  } else if (isCategoryEligible) {
    discountPercent = campaign.categoryDiscountPercent
    badgeText = `⚡ ประจำสัปดาห์ -${discountPercent}%`
  }

  const pricing = calculateDiscountPrice(book.price, discountPercent)

  return {
    ...pricing,
    badgeText: pricing.isDiscounted ? badgeText : null,
    isFeatured
  }
}
