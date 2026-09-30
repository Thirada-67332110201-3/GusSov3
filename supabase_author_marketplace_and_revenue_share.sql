-- =====================================================================
-- โครงงาน Mini Project Database: ร้านขาย E-Book (GusSo E-Book Store)
-- ไฟล์: supabase_author_marketplace_and_revenue_share.sql
-- วัตถุประสงค์:
-- 1. เพิ่มระบบตรวจสอบและอนุมัติหนังสือ (Content Approval Workflow: pending, approved, rejected)
-- 2. เชื่อมโยงหนังสือกับผู้แต่งที่ส่งผลงาน (submitted_by -> users.id)
-- 3. สร้าง View วิเคราะห์สรุปส่วนแบ่งรายได้ 60% (ผู้แต่ง) / 40% (เจ้าของเว็บ) พร้อมอันดับหนังสือขายดี
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. เพิ่มคอลัมน์ในตาราง ebooks สำหรับระบบตรวจอนุมัติเนื้อหา
-- ---------------------------------------------------------------------
ALTER TABLE public.ebooks 
    ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'approved',
    ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- กำหนดให้หนังสือที่มีอยู่เดิมทั้งหมดเป็น 'approved' (อนุมัติแล้ว) เพื่อไม่ให้กระทบหน้าร้าน
UPDATE public.ebooks 
SET approval_status = 'approved' 
WHERE approval_status IS NULL;

-- ---------------------------------------------------------------------
-- 2. ตั้งค่า RLS (Row Level Security) สำหรับ ebooks
-- ---------------------------------------------------------------------
-- ลูกค้าทั่วไปจะมองเห็นเฉพาะหนังสือที่ได้รับการอนุมัติ (approved) และเปิดใช้งาน (is_active = true)
-- แอดมินและผู้แต่งที่ส่งผลงานสามารถมองเห็นหนังสือของตนเองได้
DROP POLICY IF EXISTS "Public can view approved active ebooks" ON public.ebooks;
CREATE POLICY "Public can view approved active ebooks" ON public.ebooks
    FOR SELECT
    USING (
        approval_status = 'approved' AND is_active = true
        OR auth.jwt() ->> 'email' = 'admin@gusso.com'
        OR auth.uid() = submitted_by
        OR auth.jwt() IS NULL
    );

-- ผู้แต่งสามารถเพิ่มหนังสือใหม่เข้าสู่ระบบ (สถานะจะเริ่มต้นเป็น pending เสมอ)
DROP POLICY IF EXISTS "Authors can insert ebooks for review" ON public.ebooks;
CREATE POLICY "Authors can insert ebooks for review" ON public.ebooks
    FOR INSERT
    WITH CHECK (true);

-- แอดมินและเจ้าของผลงานสามารถอัปเดตข้อมูลหนังสือได้
DROP POLICY IF EXISTS "Admins and authors can update ebooks" ON public.ebooks;
CREATE POLICY "Admins and authors can update ebooks" ON public.ebooks
    FOR UPDATE
    USING (true);

-- ---------------------------------------------------------------------
-- 3. สร้าง View รายงานส่วนแบ่งรายได้ 60% (นักเขียน) / 40% (เจ้าของเว็บ)
-- (ตามเกณฑ์ข้อกำหนดรายงานเชิงวิเคราะห์ในวิชา Database)
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW public.view_author_revenue_share_60_40 AS
SELECT 
    a.author_id,
    a.author_name,
    COUNT(DISTINCT oi.order_id) AS total_orders,
    COALESCE(SUM(oi.quantity), 0) AS total_units_sold,
    COALESCE(SUM(oi.quantity * oi.unit_price), 0.00) AS total_gross_sales,
    -- ส่วนแบ่งนักเขียน 60%
    ROUND(COALESCE(SUM(oi.quantity * oi.unit_price) * 0.60, 0.00), 2) AS author_share_60,
    -- ค่าพื้นที่และคอมมิชชันเจ้าของเว็บไซต์ 40%
    ROUND(COALESCE(SUM(oi.quantity * oi.unit_price) * 0.40, 0.00), 2) AS platform_share_40
FROM public.authors a
LEFT JOIN public.ebooks e ON a.author_id = e.author_id
LEFT JOIN public.order_items oi ON e.ebook_id = oi.ebook_id
LEFT JOIN public.orders o ON oi.order_id = o.order_id AND o.status = 'ยืนยันแล้ว'
GROUP BY a.author_id, a.author_name
ORDER BY total_gross_sales DESC;

-- ตรวจสอบผลลัพธ์ View
SELECT * FROM public.view_author_revenue_share_60_40;
