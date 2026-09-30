-- =====================================================================
-- โครงงาน Mini Project Database: ร้านขาย E-Book (GusSo E-Book Store)
-- ไฟล์: supabase_enable_author_submissions_and_approvals.sql
-- คำสั่ง SQL สำหรับเพิ่มระบบตรวจอนุมัติเนื้อหา (Content Approval Workflow)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. เพิ่มคอลัมน์ระบบตรวจอนุมัติลงในตาราง ebooks (แยกคำสั่งเพื่อความสมบูรณ์ 100%)
-- ---------------------------------------------------------------------
ALTER TABLE public.ebooks ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'approved';
ALTER TABLE public.ebooks ADD COLUMN IF NOT EXISTS submitted_by UUID;
ALTER TABLE public.ebooks ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- ---------------------------------------------------------------------
-- 2. ปรับหนังสือเดิมทั้งหมดที่มีอยู่ให้เป็นสถานะ 'approved' (อนุมัติแล้ว) และเปิดขาย
-- ---------------------------------------------------------------------
UPDATE public.ebooks 
SET approval_status = 'approved', is_active = true 
WHERE approval_status IS NULL;

-- ---------------------------------------------------------------------
-- 3. ปลดล็อก RLS สำหรับตาราง ebooks (สิทธิ์ SELECT, INSERT, UPDATE)
-- ---------------------------------------------------------------------
ALTER TABLE public.ebooks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view ebooks" ON public.ebooks;
DROP POLICY IF EXISTS "Public can view approved active ebooks" ON public.ebooks;
DROP POLICY IF EXISTS "Allow all select on ebooks" ON public.ebooks;
CREATE POLICY "Allow all select on ebooks" 
    ON public.ebooks 
    FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Authors can insert ebooks for review" ON public.ebooks;
DROP POLICY IF EXISTS "Allow author inserts on ebooks" ON public.ebooks;
CREATE POLICY "Allow author inserts on ebooks" 
    ON public.ebooks 
    FOR INSERT 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Admins and authors can update ebooks" ON public.ebooks;
DROP POLICY IF EXISTS "Allow all update on ebooks" ON public.ebooks;
CREATE POLICY "Allow all update on ebooks" 
    ON public.ebooks 
    FOR UPDATE 
    USING (true);

-- ---------------------------------------------------------------------
-- 4. ปลดล็อก RLS สำหรับตาราง authors (ให้นักเขียนใหม่เพิ่มชื่อผู้แต่งได้)
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
