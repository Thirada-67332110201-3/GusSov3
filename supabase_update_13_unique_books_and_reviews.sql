-- =====================================================================
-- โครงงาน Mini Project Database: ร้านขาย E-Book (GusSo E-Book Store)
-- ไฟล์: supabase_update_13_unique_books_and_reviews.sql
-- วัตถุประสงค์:
-- 1. ปรับปรุงข้อมูลหนังสือ 13 เล่มให้หลากหลาย ไม่ซ้ำกัน มีรูปหน้าปกครบถ้วน
-- 2. ผูก author_id และ category_id ให้ตรงกับ Master Catalog
-- 3. สร้างตาราง book_reviews สำหรับระบบให้คะแนนดาว 1-5 ดาว
-- 4. เพิ่มคอลัมน์ rating และ total_reviews ในตาราง ebooks
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. เพิ่มคอลัมน์ rating ในตาราง ebooks (ถ้ายังไม่มี)
-- ---------------------------------------------------------------------
ALTER TABLE public.ebooks 
    ADD COLUMN IF NOT EXISTS rating NUMERIC(3, 2) DEFAULT 5.0,
    ADD COLUMN IF NOT EXISTS total_reviews INT DEFAULT 1;

-- ---------------------------------------------------------------------
-- 2. อัปเดตข้อมูลหนังสือทั้ง 13 เล่มให้มีเนื้อหาหลากหลาย ไม่ซ้ำกัน
-- ---------------------------------------------------------------------

-- เล่มที่ 1: หมวดหมู่ 1 (Next.js & Supabase) | ผู้แต่ง 1 (ดร. ธนวัฒน์)
UPDATE public.ebooks SET
    title = 'Next.js 15 App Router & Server Actions Guide',
    price = 350.00,
    author_id = 1,
    category_id = 1,
    cover_image = 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80',
    description = 'คู่มือเจาะลึก Next.js 15 ฉบับสมบูรณ์ เรียนรู้ App Router, Server Actions, Caching Strategy และการเชื่อมต่อ Supabase Database แบบ Step-by-Step',
    stock_status = 'พร้อมจำหน่าย',
    is_active = true,
    approval_status = 'approved',
    rating = 4.9,
    total_reviews = 38
WHERE ebook_id = 1;

-- เล่มที่ 2: หมวดหมู่ 1 (Next.js & Supabase) | ผู้แต่ง 2 (อ. ธีรดา)
UPDATE public.ebooks SET
    title = 'Supabase Architecture & PostgreSQL for Web Devs',
    price = 320.00,
    author_id = 2,
    category_id = 1,
    cover_image = 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80',
    description = 'เข้าใจโครงสร้าง Supabase อย่างมือโปร ทั้งระบบ Auth, Row Level Security (RLS), Realtime Subscriptions และการเขียน Function บน PostgreSQL',
    stock_status = 'พร้อมจำหน่าย',
    is_active = true,
    approval_status = 'approved',
    rating = 4.8,
    total_reviews = 29
WHERE ebook_id = 2;

-- เล่มที่ 3: หมวดหมู่ 1 (Next.js & Supabase) | ผู้แต่ง 1 (ดร. ธนวัฒน์)
UPDATE public.ebooks SET
    title = 'Building Modern E-Commerce with Next.js & Stripe',
    price = 390.00,
    author_id = 1,
    category_id = 1,
    cover_image = 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80',
    description = 'สร้างระบบร้านค้าออนไลน์เต็มรูปแบบ รองรับตะกร้าสินค้า คูปองส่วนลด ชำระเงินผ่าน PromptPay และระบบจัดการหลังบ้านที่พร้อมเปิดธุรกิจจริง',
    stock_status = 'พร้อมจำหน่าย',
    is_active = true,
    approval_status = 'approved',
    rating = 5.0,
    total_reviews = 45
WHERE ebook_id = 3;

-- เล่มที่ 4: หมวดหมู่ 2 (TypeScript & Frontend) | ผู้แต่ง 3 (Alex River)
UPDATE public.ebooks SET
    title = 'Advanced TypeScript & Clean Code Architecture',
    price = 290.00,
    author_id = 3,
    category_id = 2,
    cover_image = 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=600&auto=format&fit=crop&q=80',
    description = 'เจาะลึก TypeScript ระดับสูง เทคนิคการใช้ Generic Constraints, Conditional Types, Template Literal Types และการออกแบบ Design Patterns ในโปรเจกต์ขนาดใหญ่',
    stock_status = 'พร้อมจำหน่าย',
    is_active = true,
    approval_status = 'approved',
    rating = 4.9,
    total_reviews = 52
WHERE ebook_id = 4;

-- เล่มที่ 5: หมวดหมู่ 2 (TypeScript & Frontend) | ผู้แต่ง 3 (Alex River)
UPDATE public.ebooks SET
    title = 'React 19 & State Management in Action',
    price = 280.00,
    author_id = 3,
    category_id = 2,
    cover_image = 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&auto=format&fit=crop&q=80',
    description = 'เตรียมความพร้อมสู่ React 19 ด้วย Use Hooks, Actions, Optimistic Updates พร้อมเทคนิคเปรียบเทียบ Zustand, Redux Toolkit และ React Query',
    stock_status = 'พร้อมจำหน่าย',
    is_active = true,
    approval_status = 'approved',
    rating = 4.7,
    total_reviews = 23
WHERE ebook_id = 5;

-- เล่มที่ 6: หมวดหมู่ 2 (TypeScript & Frontend) | ผู้แต่ง 5 (John Doe)
UPDATE public.ebooks SET
    title = 'Mastering Algorithms & Data Structures in JS',
    price = 260.00,
    author_id = 5,
    category_id = 2,
    cover_image = 'https://images.unsplash.com/photo-1516116211227-bbc13c744167?w=600&auto=format&fit=crop&q=80',
    description = 'ปูพื้นฐานอัลกอริทึมและโครงสร้างข้อมูลที่จำเป็นสำหรับการสัมภาษณ์งานโปรแกรมเมอร์ อธิบายเข้าใจง่ายด้วยโค้ด JavaScript/TypeScript พร้อมเฉลยแบบฝึกหัด',
    stock_status = 'พร้อมจำหน่าย',
    is_active = true,
    approval_status = 'approved',
    rating = 4.8,
    total_reviews = 31
WHERE ebook_id = 6;

-- เล่มที่ 7: หมวดหมู่ 3 (Database & Backend) | ผู้แต่ง 1 (ดร. ธนวัฒน์)
UPDATE public.ebooks SET
    title = 'Database Architecture, 3NF & Relational Systems',
    price = 310.00,
    author_id = 1,
    category_id = 3,
    cover_image = 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=600&auto=format&fit=crop&q=80',
    description = 'หลักการออกแบบฐานข้อมูลเชิงสัมพันธ์ตั้งแต่ระดับพื้นฐาน ER-Diagram, การแปลงเป็น Relational Schema, และการทำ Normalization จนถึงระดับ 3NF อย่างถูกต้อง',
    stock_status = 'พร้อมจำหน่าย',
    is_active = true,
    approval_status = 'approved',
    rating = 5.0,
    total_reviews = 64
WHERE ebook_id = 7;

-- เล่มที่ 8: หมวดหมู่ 3 (Database & Backend) | ผู้แต่ง 5 (John Doe)
UPDATE public.ebooks SET
    title = 'High-Performance SQL Optimization & Indexing',
    price = 340.00,
    author_id = 5,
    category_id = 3,
    cover_image = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=80',
    description = 'คู่มือเพิ่มความเร็วการทำงานของ SQL Query เทคนิคการวิเคราะห์ Execution Plan, การสร้าง Index ประเภทต่างๆ (B-Tree, GIN, GiST) และการจูนฐานข้อมูลขนาดใหญ่',
    stock_status = 'พร้อมจำหน่าย',
    is_active = true,
    approval_status = 'approved',
    rating = 4.9,
    total_reviews = 41
WHERE ebook_id = 8;

-- เล่มที่ 9: หมวดหมู่ 3 (Database & Backend) | ผู้แต่ง 5 (John Doe)
UPDATE public.ebooks SET
    title = 'Microservices & RESTful API Security',
    price = 360.00,
    author_id = 5,
    category_id = 3,
    cover_image = 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&auto=format&fit=crop&q=80',
    description = 'สร้าง API ที่ปลอดภัยและรองรับการขยายตัว ครอบคลุมการพิสูจน์ตัวตนด้วย OAuth2, JWT, Rate Limiting, CORS และการป้องกันช่องโหว่ OWASP Top 10',
    stock_status = 'พร้อมจำหน่าย',
    is_active = true,
    approval_status = 'approved',
    rating = 4.8,
    total_reviews = 27
WHERE ebook_id = 9;

-- เล่มที่ 10: หมวดหมู่ 3 (Database & Backend) | ผู้แต่ง 2 (อ. ธีรดา)
UPDATE public.ebooks SET
    title = 'Cloud Infrastructure & Docker for Developers',
    price = 330.00,
    author_id = 2,
    category_id = 3,
    cover_image = 'https://images.unsplash.com/photo-1618401471353-b98aedd04e11?w=600&auto=format&fit=crop&q=80',
    description = 'เปลี่ยนงานพัฒนาเว็บให้เป็นระบบคอนเทนเนอร์ด้วย Docker และ Docker Compose เรียนรู้การ Deploy บน AWS, Google Cloud และการทำ CI/CD ด้วย GitHub Actions',
    stock_status = 'พร้อมจำหน่าย',
    is_active = true,
    approval_status = 'approved',
    rating = 4.9,
    total_reviews = 35
WHERE ebook_id = 10;

-- เล่มที่ 11: หมวดหมู่ 4 (UI/UX Design) | ผู้แต่ง 4 (Sarah Connor)
UPDATE public.ebooks SET
    title = 'Tailwind CSS 4 Modern Design Systems',
    price = 220.00,
    author_id = 4,
    category_id = 4,
    cover_image = 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=600&auto=format&fit=crop&q=80',
    description = 'สร้าง Design System ที่ทันสมัยและยืดหยุ่นด้วย Tailwind CSS เวอร์ชันใหม่ล่าสุด เทคนิคการปรับแต่งธีม Dark Mode, Typography และการประกอบชิ้นส่วน UI อย่างรวดเร็ว',
    stock_status = 'พร้อมจำหน่าย',
    is_active = true,
    approval_status = 'approved',
    rating = 4.9,
    total_reviews = 48
WHERE ebook_id = 11;

-- เล่มที่ 12: หมวดหมู่ 4 (UI/UX Design) | ผู้แต่ง 4 (Sarah Connor)
UPDATE public.ebooks SET
    title = 'UI/UX Design Principles for Engineers',
    price = 270.00,
    author_id = 4,
    category_id = 4,
    cover_image = 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=600&auto=format&fit=crop&q=80',
    description = 'หลักการออกแบบที่โปรแกรมเมอร์ทุกคนต้องรู้ เรียนรู้เรื่อง Visual Hierarchy, การเลือกคู่สี, Micro-interactions และวิธีลดความซับซ้อนของหน้าจอเพื่อเพิ่มยอดขาย',
    stock_status = 'พร้อมจำหน่าย',
    is_active = true,
    approval_status = 'approved',
    rating = 4.8,
    total_reviews = 39
WHERE ebook_id = 12;

-- เล่มที่ 13: หมวดหมู่ 4 (UI/UX Design) | ผู้แต่ง 4 (Sarah Connor)
UPDATE public.ebooks SET
    title = 'Figma to Code: Responsive Web Blueprint',
    price = 250.00,
    author_id = 4,
    category_id = 4,
    cover_image = 'https://images.unsplash.com/photo-1542744094-24638eff58bb?w=600&auto=format&fit=crop&q=80',
    description = 'แปลงงานออกแบบจาก Figma ให้เป็นโค้ด HTML/CSS/Tailwind ที่ถูกต้อง แม่นยำระดับพิกเซล รองรับหน้าจอคอมพิวเตอร์ แท็บเล็ต และสมาร์ตโฟนได้อย่างสมบูรณ์',
    stock_status = 'พร้อมจำหน่าย',
    is_active = true,
    approval_status = 'approved',
    rating = 5.0,
    total_reviews = 58
WHERE ebook_id = 13;

-- ---------------------------------------------------------------------
-- 3. สร้างตาราง book_reviews สำหรับระบบให้คะแนนดาว 1-5 ดาว
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.book_reviews (
    review_id SERIAL PRIMARY KEY,
    ebook_id INT REFERENCES public.ebooks(ebook_id) ON DELETE CASCADE,
    user_name VARCHAR(150) NOT NULL DEFAULT 'ลูกค้าทั่วไป',
    user_email VARCHAR(255),
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ปลดล็อก RLS ให้ทุกคนสามารถอ่านและส่งคะแนนรีวิวได้
ALTER TABLE public.book_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view reviews" ON public.book_reviews;
CREATE POLICY "Public can view reviews" ON public.book_reviews 
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert review" ON public.book_reviews;
CREATE POLICY "Anyone can insert review" ON public.book_reviews 
    FOR INSERT WITH CHECK (true);

-- เติมรีวิวตัวอย่างเริ่มต้น
INSERT INTO public.book_reviews (ebook_id, user_name, user_email, rating, comment) VALUES
(1, 'สมเกียรติ พัฒนา', 'somkiat@test.com', 5, 'เนื้อหาดีมากครับ อธิบาย Next.js 15 ได้เข้าใจง่าย โค้ดเอาไปใช้งานจริงได้ทันที'),
(1, 'วิชัย โค้ดเดอร์', 'wichai@test.com', 5, 'แนะนำสำหรับคนที่อยากเข้าใจ Server Actions แบบลึกซึ้ง'),
(4, 'ธีระภัทร สุขใจ', 'teerapat@test.com', 5, 'TypeScript อธิบาย Generic ละเอียดมาก ช่วยแก้ปัญหา Types ในโปรเจกต์ได้เยอะ'),
(7, 'นพดล ฐานข้อมูล', 'nopadon@test.com', 5, 'เข้าใจ Normalization 1NF-3NF กระจ่างเลยครับ เอาไปส่งรายงานอาจารย์ได้คะแนนเต็ม')
ON CONFLICT DO NOTHING;

-- ตรวจสอบรายชื่อหนังสือ 13 เล่มที่อัปเดตใหม่
SELECT ebook_id, title, price, author_id, category_id, rating, total_reviews 
FROM public.ebooks 
ORDER BY ebook_id;
