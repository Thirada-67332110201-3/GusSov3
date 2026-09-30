export type UniqueBookMeta = {
  title: string
  author: string
  author_id: number
  price: number
  category_id: number
  description: string
  cover_image: string
  rating: number
  total_reviews: number
}

export const UNIQUE_EBOOKS_METADATA: Record<number, UniqueBookMeta> = {
  1: {
    title: 'Next.js 15 App Router & Server Actions Guide',
    author: 'ดร. ธนวัฒน์ หาญณรงค์',
    author_id: 1,
    price: 350,
    category_id: 1,
    description: 'คู่มือเจาะลึก Next.js 15 ฉบับสมบูรณ์ เรียนรู้ App Router, Server Actions, Caching Strategy และการเชื่อมต่อ Supabase Database แบบ Step-by-Step',
    cover_image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80',
    rating: 4.9,
    total_reviews: 38
  },
  2: {
    title: 'Supabase Architecture & PostgreSQL for Web Devs',
    author: 'อ. ธีรดา หล่อทอง',
    author_id: 2,
    price: 320,
    category_id: 1,
    description: 'เข้าใจโครงสร้าง Supabase อย่างมือโปร ทั้งระบบ Auth, Row Level Security (RLS), Realtime Subscriptions และการเขียน Function บน PostgreSQL',
    cover_image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80',
    rating: 4.8,
    total_reviews: 29
  },
  3: {
    title: 'Building Modern E-Commerce with Next.js & Stripe',
    author: 'ดร. ธนวัฒน์ หาญณรงค์',
    author_id: 1,
    price: 390,
    category_id: 1,
    description: 'สร้างระบบร้านค้าออนไลน์เต็มรูปแบบ รองรับตะกร้าสินค้า คูปองส่วนลด ชำระเงินผ่าน PromptPay และระบบจัดการหลังบ้านที่พร้อมเปิดธุรกิจจริง',
    cover_image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80',
    rating: 5.0,
    total_reviews: 45
  },
  4: {
    title: 'Advanced TypeScript & Clean Code Architecture',
    author: 'Alex River',
    author_id: 3,
    price: 290,
    category_id: 2,
    description: 'เจาะลึก TypeScript ระดับสูง เทคนิคการใช้ Generic Constraints, Conditional Types, Template Literal Types และการออกแบบ Design Patterns ในโปรเจกต์ขนาดใหญ่',
    cover_image: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=600&auto=format&fit=crop&q=80',
    rating: 4.9,
    total_reviews: 52
  },
  5: {
    title: 'React 19 & State Management in Action',
    author: 'Alex River',
    author_id: 3,
    price: 280,
    category_id: 2,
    description: 'เตรียมความพร้อมสู่ React 19 ด้วย Use Hooks, Actions, Optimistic Updates พร้อมเทคนิคเปรียบเทียบ Zustand, Redux Toolkit และ React Query',
    cover_image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&auto=format&fit=crop&q=80',
    rating: 4.7,
    total_reviews: 23
  },
  6: {
    title: 'Mastering Algorithms & Data Structures in JS',
    author: 'John Doe',
    author_id: 5,
    category_id: 2,
    price: 260,
    description: 'ปูพื้นฐานอัลกอริทึมและโครงสร้างข้อมูลที่จำเป็นสำหรับการสัมภาษณ์งานโปรแกรมเมอร์ อธิบายเข้าใจง่ายด้วยโค้ด JavaScript/TypeScript พร้อมเฉลยแบบฝึกหัด',
    cover_image: 'https://images.unsplash.com/photo-1516116211227-bbc13c744167?w=600&auto=format&fit=crop&q=80',
    rating: 4.8,
    total_reviews: 31
  },
  7: {
    title: 'Database Architecture, 3NF & Relational Systems',
    author: 'ดร. ธนวัฒน์ หาญณรงค์',
    author_id: 1,
    category_id: 3,
    price: 310,
    description: 'หลักการออกแบบฐานข้อมูลเชิงสัมพันธ์ตั้งแต่ระดับพื้นฐาน ER-Diagram, การแปลงเป็น Relational Schema, และการทำ Normalization จนถึงระดับ 3NF อย่างถูกต้อง',
    cover_image: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=600&auto=format&fit=crop&q=80',
    rating: 5.0,
    total_reviews: 64
  },
  8: {
    title: 'High-Performance SQL Optimization & Indexing',
    author: 'John Doe',
    author_id: 5,
    category_id: 3,
    price: 340,
    description: 'คู่มือเพิ่มความเร็วการทำงานของ SQL Query เทคนิคการวิเคราะห์ Execution Plan, การสร้าง Index ประเภทต่างๆ (B-Tree, GIN, GiST) และการจูนฐานข้อมูลขนาดใหญ่',
    cover_image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=80',
    rating: 4.9,
    total_reviews: 41
  },
  9: {
    title: 'Microservices & RESTful API Security',
    author: 'John Doe',
    author_id: 5,
    category_id: 3,
    price: 360,
    description: 'สร้าง API ที่ปลอดภัยและรองรับการขยายตัว ครอบคลุมการพิสูจน์ตัวตนด้วย OAuth2, JWT, Rate Limiting, CORS และการป้องกันช่องโหว่ OWASP Top 10',
    cover_image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&auto=format&fit=crop&q=80',
    rating: 4.8,
    total_reviews: 27
  },
  10: {
    title: 'Cloud Infrastructure & Docker for Developers',
    author: 'อ. ธีรดา หล่อทอง',
    author_id: 2,
    category_id: 3,
    price: 330,
    description: 'เปลี่ยนงานพัฒนาเว็บให้เป็นระบบคอนเทนเนอร์ด้วย Docker และ Docker Compose เรียนรู้การ Deploy บน AWS, Google Cloud และการทำ CI/CD ด้วย GitHub Actions',
    cover_image: 'https://images.unsplash.com/photo-1618401471353-b98aedd04e11?w=600&auto=format&fit=crop&q=80',
    rating: 4.9,
    total_reviews: 35
  },
  11: {
    title: 'Tailwind CSS 4 Modern Design Systems',
    author: 'Sarah Connor',
    author_id: 4,
    category_id: 4,
    price: 220,
    description: 'สร้าง Design System ที่ทันสมัยและยืดหยุ่นด้วย Tailwind CSS เวอร์ชันใหม่ล่าสุด เทคนิคการปรับแต่งธีม Dark Mode, Typography และการประกอบชิ้นส่วน UI อย่างรวดเร็ว',
    cover_image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=600&auto=format&fit=crop&q=80',
    rating: 4.9,
    total_reviews: 48
  },
  12: {
    title: 'UI/UX Design Principles for Engineers',
    author: 'Sarah Connor',
    author_id: 4,
    category_id: 4,
    price: 270,
    description: 'หลักการออกแบบที่โปรแกรมเมอร์ทุกคนต้องรู้ เรียนรู้เรื่อง Visual Hierarchy, การเลือกคู่สี, Micro-interactions และวิธีลดความซับซ้อนของหน้าจอเพื่อเพิ่มยอดขาย',
    cover_image: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=600&auto=format&fit=crop&q=80',
    rating: 4.8,
    total_reviews: 39
  },
  13: {
    title: 'Figma to Code: Responsive Web Blueprint',
    author: 'Sarah Connor',
    author_id: 4,
    category_id: 4,
    price: 250,
    description: 'แปลงงานออกแบบจาก Figma ให้เป็นโค้ด HTML/CSS/Tailwind ที่ถูกต้อง แม่นยำระดับพิกเซล รองรับหน้าจอคอมพิวเตอร์ แท็บเล็ต และสมาร์ตโฟนได้อย่างสมบูรณ์',
    cover_image: 'https://images.unsplash.com/photo-1542744094-24638eff58bb?w=600&auto=format&fit=crop&q=80',
    rating: 5.0,
    total_reviews: 58
  }
}

export type BookReview = {
  review_id?: number
  ebook_id: number
  user_name: string
  user_email?: string
  rating: number
  comment: string
  created_at?: string
}
