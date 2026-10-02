-- =====================================================================
-- โครงงาน Mini Project Database: ร้านขาย E-Book (GusSo E-Book Store)
-- ไฟล์: supabase_enable_categories_and_fix_sequences.sql
-- คำสั่ง SQL สำหรับปลดล็อกสิทธิ์ RLS ให้จัดการ Categories และซิงค์ Sequence
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. ปลดล็อกสิทธิ์ RLS สำหรับตาราง categories (Insert, Update, Delete)
-- ---------------------------------------------------------------------
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
CREATE POLICY "Public can view categories" 
    ON public.categories 
    FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Allow insert categories" ON public.categories;
CREATE POLICY "Allow insert categories" 
    ON public.categories 
    FOR INSERT 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update categories" ON public.categories;
CREATE POLICY "Allow update categories" 
    ON public.categories 
    FOR UPDATE 
    USING (true);

DROP POLICY IF EXISTS "Allow delete categories" ON public.categories;
CREATE POLICY "Allow delete categories" 
    ON public.categories 
    FOR DELETE 
    USING (true);

-- ---------------------------------------------------------------------
-- 2. ปลดล็อกสิทธิ์ RLS สำหรับตาราง authors (Insert, Update)
-- ---------------------------------------------------------------------
ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select authors" ON public.authors;
CREATE POLICY "Allow select authors" 
    ON public.authors 
    FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Allow insert authors" ON public.authors;
CREATE POLICY "Allow insert authors" 
    ON public.authors 
    FOR INSERT 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update authors" ON public.authors;
CREATE POLICY "Allow update authors" 
    ON public.authors 
    FOR UPDATE 
    USING (true);

-- ---------------------------------------------------------------------
-- 3. ซิงค์ค่า Auto-Increment Sequence ของตารางหลักเพื่อป้องกัน Primary Key ซ้ำ
-- ---------------------------------------------------------------------
SELECT setval(pg_get_serial_sequence('public.categories', 'category_id'), COALESCE((SELECT MAX(category_id) FROM public.categories), 1));
SELECT setval(pg_get_serial_sequence('public.authors', 'author_id'), COALESCE((SELECT MAX(author_id) FROM public.authors), 1));
SELECT setval(pg_get_serial_sequence('public.ebooks', 'ebook_id'), COALESCE((SELECT MAX(ebook_id) FROM public.ebooks), 1));

-- ---------------------------------------------------------------------
-- 4. ตรวจสอบผลลัพธ์
-- ---------------------------------------------------------------------
SELECT 'categories count' as tbl, count(*) from public.categories
UNION ALL
SELECT 'authors count' as tbl, count(*) from public.authors
UNION ALL
SELECT 'ebooks count' as tbl, count(*) from public.ebooks;
