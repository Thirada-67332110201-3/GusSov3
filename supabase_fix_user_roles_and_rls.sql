-- =====================================================================
-- โครงงาน Mini Project Database: ร้านขาย E-Book (GusSo E-Book Store)
-- ไฟล์: supabase_fix_user_roles_and_rls.sql
-- วัตถุประสงค์:
-- 1. แก้ไขปัญหา RLS บล็อกการ UPDATE ตาราง users ทำให้เปลี่ยน Role ไม่ได้
-- 2. เพิ่มคอลัมน์ role และ role_id ให้สมบูรณ์ครบถ้วน
-- 3. ปลดล็อกสิทธิ์ให้ผู้ดูแลระบบ (Admin) สามารถอัปเดตบทบาทของสมาชิกทุกคนได้
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. ตรวจสอบและเพิ่มคอลัมน์ในตาราง users ให้รองรับทั้ง role_id และ role
-- ---------------------------------------------------------------------
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role_id INT DEFAULT 2;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'customer';

-- ---------------------------------------------------------------------
-- 2. สร้าง Foreign Key เชื่อมโยง users -> roles (ถ้ายังไม่มี)
-- ---------------------------------------------------------------------
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS fk_users_role;
ALTER TABLE public.users 
    ADD CONSTRAINT fk_users_role 
    FOREIGN KEY (role_id) 
    REFERENCES public.roles(role_id) 
    ON DELETE SET NULL;

-- ---------------------------------------------------------------------
-- 3. อัปเดตข้อมูลบทบาทเริ่มต้น
-- ---------------------------------------------------------------------
UPDATE public.users SET role_id = 1, role = 'admin' WHERE email = 'admin@gusso.com';
UPDATE public.users SET role_id = 2, role = 'customer' WHERE role_id IS NULL;

-- ---------------------------------------------------------------------
-- 4. ปลดล็อกสิทธิ์ RLS บนตาราง users ให้สามารถ SELECT, INSERT, UPDATE ได้
-- (นี่คือสาเหตุหลักที่ทำให้ก่อนหน้านี้กดเปลี่ยนแล้วไม่บันทึกลงฐานข้อมูล)
-- ---------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view users" ON public.users;
DROP POLICY IF EXISTS "Admin can view all users" ON public.users;
DROP POLICY IF EXISTS "Allow all on users" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated to update users" ON public.users;
DROP POLICY IF EXISTS "Allow all operations on users" ON public.users;

-- สร้างนโยบายอนุญาตให้ทุกคนสามารถอ่านและอัปเดตข้อมูลผู้ใช้ได้ (เพื่อการจัดการบทบาท)
CREATE POLICY "Allow all operations on users" 
    ON public.users 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

-- ---------------------------------------------------------------------
-- 5. ตรวจสอบผลลัพธ์รายชื่อผู้ใช้และบทบาทปัจจุบัน
-- ---------------------------------------------------------------------
SELECT id, email, name, role_id, role, created_at 
FROM public.users 
ORDER BY created_at DESC;
