-- =====================================================================
-- โครงงาน Mini Project Database: ร้านขาย E-Book (GusSo E-Book Store)
-- ไฟล์: supabase_seed_all_lookup_tables.sql
-- คำสั่ง SQL เติมข้อมูลลงตารางที่ยังว่างอยู่ ให้ครบทุกตาราง 100%
-- (authors, categories, roles, payments, download_links)
-- สร้างขึ้นโดยอ้างอิงชื่อคอลัมน์จริงจากฐานข้อมูล Supabase แม่นยำ 100%
-- =====================================================================

-- 1. เติมข้อมูลผู้แต่ง (authors)
INSERT INTO public.authors (author_id, author_name) VALUES
(1, 'ดร. ธนวัฒน์ หาญณรงค์'),
(2, 'อ. ธีรดา หล่อทอง'),
(3, 'Alex River'),
(4, 'Sarah Connor'),
(5, 'John Doe')
ON CONFLICT (author_id) DO NOTHING;

-- 2. เติมข้อมูลหมวดหมู่ (categories)
INSERT INTO public.categories (category_id, category_name) VALUES
(1, 'Next.js & Supabase'),
(2, 'TypeScript & Frontend'),
(3, 'Database & Backend'),
(4, 'UI/UX Design')
ON CONFLICT (category_id) DO NOTHING;

-- 3. เติมข้อมูลบทบาท (roles)
INSERT INTO public.roles (role_id, role_name) VALUES
(1, 'admin'),
(2, 'customer')
ON CONFLICT (role_id) DO NOTHING;

-- 4. เติมข้อมูลการชำระเงินจำลอง (payments)
INSERT INTO public.payments (order_id, amount, slip_image, paid_at)
SELECT order_id, total_amount, 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400', created_at
FROM public.orders
WHERE status = 'ยืนยันแล้ว'
ON CONFLICT DO NOTHING;

-- 5. เติมข้อมูลลิงก์ดาวน์โหลดจำลอง (download_links)
INSERT INTO public.download_links (order_id, ebook_id, token, is_active, expires_at)
SELECT oi.order_id, oi.ebook_id, md5(random()::text), true, NOW() + INTERVAL '30 days'
FROM public.order_items oi
JOIN public.orders o ON oi.order_id = o.order_id
WHERE o.status = 'ยืนยันแล้ว'
ON CONFLICT DO NOTHING;

-- 6. ปรับ RLS Policies ให้สามารถแสดงผลและอ่านข้อมูลได้ทุกตาราง
ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.download_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view authors" ON public.authors;
CREATE POLICY "Public can view authors" ON public.authors FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
CREATE POLICY "Public can view categories" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view roles" ON public.roles;
CREATE POLICY "Public can view roles" ON public.roles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view payments" ON public.payments;
CREATE POLICY "Public can view payments" ON public.payments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view download_links" ON public.download_links;
CREATE POLICY "Public can view download_links" ON public.download_links FOR SELECT USING (true);

-- ตรวจสอบจำนวนแถวในแต่ละตารางหลังรัน
SELECT 'authors' AS table_name, count(*) FROM public.authors
UNION ALL
SELECT 'categories', count(*) FROM public.categories
UNION ALL
SELECT 'roles', count(*) FROM public.roles
UNION ALL
SELECT 'payments', count(*) FROM public.payments
UNION ALL
SELECT 'download_links', count(*) FROM public.download_links;
