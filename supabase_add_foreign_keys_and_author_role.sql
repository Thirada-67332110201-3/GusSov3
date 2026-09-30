-- =====================================================================
-- โครงงาน Mini Project Database: ร้านขาย E-Book (GusSo E-Book Store)
-- ไฟล์: supabase_add_foreign_keys_and_author_role.sql
-- 1. เพิ่มบทบาท 'author' (ผู้แต่ง/นักเขียน) ในตาราง roles
-- 2. สร้าง Foreign Key เชื่อมโยงตาราง users -> roles
-- 3. สร้าง Foreign Key เชื่อมโยงตาราง purchases -> ebooks
-- 4. สร้าง Foreign Key เชื่อมโยงตาราง download_links -> ebooks
-- ทำให้ใน Schema Visualizer ของ Supabase มีเส้นเชื่อมโยงสัมพันธ์ครบทุกตาราง!
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. เพิ่มบทบาท 'author' (นักเขียน/ผู้แต่ง) ลงในตาราง roles
-- ---------------------------------------------------------------------
INSERT INTO public.roles (role_id, role_name) VALUES (3, 'author')
ON CONFLICT (role_id) DO NOTHING;

-- ---------------------------------------------------------------------
-- 2. เชื่อมโยงตาราง users เข้ากับ roles (สร้างเส้น users -> roles)
-- ---------------------------------------------------------------------
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role_id INT;

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS fk_users_role;
ALTER TABLE public.users 
    ADD CONSTRAINT fk_users_role 
    FOREIGN KEY (role_id) 
    REFERENCES public.roles(role_id) 
    ON DELETE SET NULL;

-- กำหนดบทบาทเริ่มต้น: admin ให้แอดมิน, customer ให้ผู้ใช้ทั่วไป
UPDATE public.users SET role_id = 1 WHERE email = 'admin@gusso.com';
UPDATE public.users SET role_id = 2 WHERE role_id IS NULL;

-- ---------------------------------------------------------------------
-- 3. เชื่อมโยงตาราง purchases เข้ากับ ebooks (สร้างเส้น purchases -> ebooks)
-- ---------------------------------------------------------------------
ALTER TABLE public.purchases DROP CONSTRAINT IF EXISTS fk_purchases_ebook;
ALTER TABLE public.purchases 
    ADD CONSTRAINT fk_purchases_ebook 
    FOREIGN KEY (ebook_id) 
    REFERENCES public.ebooks(ebook_id) 
    ON DELETE CASCADE;

-- ---------------------------------------------------------------------
-- 4. เชื่อมโยงตาราง download_links เข้ากับ ebooks (สร้างเส้น download_links -> ebooks)
-- ---------------------------------------------------------------------
ALTER TABLE public.download_links DROP CONSTRAINT IF EXISTS fk_download_links_ebook;
ALTER TABLE public.download_links 
    ADD CONSTRAINT fk_download_links_ebook 
    FOREIGN KEY (ebook_id) 
    REFERENCES public.ebooks(ebook_id) 
    ON DELETE CASCADE;

-- ตรวจสอบข้อมูลในตาราง roles
SELECT * FROM public.roles ORDER BY role_id;
