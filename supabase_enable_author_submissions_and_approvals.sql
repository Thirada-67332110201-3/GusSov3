-- =====================================================================
-- โครงงาน Mini Project Database: ร้านขาย E-Book (GusSo E-Book Store)
-- ไฟล์: supabase_enable_author_submissions_and_approvals.sql
-- วัตถุประสงค์:
-- 1. เพิ่มคอลัมน์ระบบตรวจสอบและอนุมัติเนื้อหา (Content Approval Workflow)
--    - approval_status ('pending', 'approved', 'rejected')
--    - submitted_by (UUID ผู้ส่งผลงาน เชื่อมโยง users.id)
--    - rejection_reason (เหตุผลกรณีปฏิเสธผลงาน)
-- 2. ตั้งค่า RLS (Row Level Security) ให้ผู้แต่งสามารถส่งหนังสือใหม่ได้ (INSERT)
-- 3. ให้สิทธิ์แอดมินและผู้ใช้งานในการอัปเดตและตรวจอนุมัติหนังสือ (UPDATE)
-- 4. ตั้งค่าหนังสือเดิมทั้งหมด 13 เล่มให้เป็นสถานะ 'approved' (อนุมัติแล้ว)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. เพิ่มคอลัมน์ระบบตรวจอนุมัติลงในตาราง ebooks
-- ---------------------------------------------------------------------
ALTER TABLE public.ebooks 
    ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'approved',
    ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- ปรับให้หนังสือเดิมทั้งหมดที่ยังไม่มีสถานะ ให้เป็น 'approved' และเปิดขาย
UPDATE public.ebooks 
SET approval_status = 'approved', is_active = true 
WHERE approval_status IS NULL;

-- ---------------------------------------------------------------------
-- 2. ปลดล็อก RLS สำหรับตาราง ebooks (INSERT, UPDATE, SELECT)
-- ---------------------------------------------------------------------
ALTER TABLE public.ebooks ENABLE ROW LEVEL SECURITY;

-- 2.1 สิทธิ์การอ่าน: อนุญาตให้อ่านหนังสือทั้งหมด (เพื่อแสดงผลบนหน้าร้านและหน้าแอดมิน)
DROP POLICY IF EXISTS "Public can view ebooks" ON public.ebooks;
DROP POLICY IF EXISTS "Public can view approved active ebooks" ON public.ebooks;
DROP POLICY IF EXISTS "Allow all select on ebooks" ON public.ebooks;
CREATE POLICY "Allow all select on ebooks" 
    ON public.ebooks 
    FOR SELECT 
    USING (true);

-- 2.2 สิทธิ์การเพิ่มหนังสือใหม่ (INSERT): ให้นักเขียนทุกคนสามารถส่งผลงานได้
DROP POLICY IF EXISTS "Authors can insert ebooks for review" ON public.ebooks;
DROP POLICY IF EXISTS "Allow author inserts on ebooks" ON public.ebooks;
CREATE POLICY "Allow author inserts on ebooks" 
    ON public.ebooks 
    FOR INSERT 
    WITH CHECK (true);

-- 2.3 สิทธิ์การอัปเดต (UPDATE): ให้แอดมินตรวจอนุมัติ (approved / rejected) และแก้ไขได้
DROP POLICY IF EXISTS "Admins and authors can update ebooks" ON public.ebooks;
DROP POLICY IF EXISTS "Allow all update on ebooks" ON public.ebooks;
CREATE POLICY "Allow all update on ebooks" 
    ON public.ebooks 
    FOR UPDATE 
    USING (true);

-- ---------------------------------------------------------------------
-- 3. ปลดล็อก RLS สำหรับตาราง authors (ให้สามารถเพิ่มผู้แต่งใหม่ได้)
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

-- ---------------------------------------------------------------------
-- 4. ตรวจสอบข้อมูลผลการทำงาน
-- ---------------------------------------------------------------------
SELECT 
    ebook_id, 
    title, 
    price, 
    approval_status, 
    is_active, 
    submitted_by 
FROM public.ebooks 
ORDER BY ebook_id ASC;
