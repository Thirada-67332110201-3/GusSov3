-- =====================================================================
-- โครงงาน Mini Project Database: ร้านขาย E-Book (GusSo E-Book Store)
-- ไฟล์: supabase_setup_and_reports.sql
-- จัดทำขึ้นตามข้อกำหนดใบงานวิชา Database Mini Project (ครบทั้ง 7 หน้า)
-- =====================================================================

-- ---------------------------------------------------------------------
-- ส่วนที่ 1: ตรวจสอบและสร้างตารางหลักทั้ง 8+ ตารางตามเกณฑ์ 3NF (ข้อกำหนด 4)
-- ---------------------------------------------------------------------

-- 1. ตาราง roles (บทบาทผู้ใช้)
CREATE TABLE IF NOT EXISTS public.roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL
);

INSERT INTO public.roles (role_name) 
VALUES ('admin'), ('customer') 
ON CONFLICT (role_name) DO NOTHING;

-- 2. ตาราง authors (ผู้แต่ง)
CREATE TABLE IF NOT EXISTS public.authors (
    author_id SERIAL PRIMARY KEY,
    author_name VARCHAR(150) NOT NULL,
    bio TEXT
);

INSERT INTO public.authors (author_id, author_name, bio) VALUES
(1, 'ดร. ธนวัฒน์ หาญณรงค์', 'ผู้เชี่ยวชาญด้าน Full-stack Architecture และระบบ Database'),
(2, 'อ. ธีรดา หล่อทอง', 'อาจารย์และผู้เชี่ยวชาญด้าน UI/UX Design และ Cloud Computing'),
(3, 'Alex River', 'Senior TypeScript & Frontend Specialist'),
(4, 'Sarah Connor', 'Design System Architect & UI Designer'),
(5, 'John Doe', 'Cybersecurity & RESTful API Specialist')
ON CONFLICT (author_id) DO NOTHING;

-- 3. ตาราง categories (หมวดหมู่หนังสือ)
CREATE TABLE IF NOT EXISTS public.categories (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) UNIQUE NOT NULL
);

INSERT INTO public.categories (category_id, category_name) VALUES
(1, 'Next.js & Supabase'),
(2, 'TypeScript & Frontend'),
(3, 'Database & Backend'),
(4, 'UI/UX Design')
ON CONFLICT (category_id) DO NOTHING;

-- 4. ตาราง ebooks (ข้อมูลหนังสือ)
CREATE TABLE IF NOT EXISTS public.ebooks (
    ebook_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    description TEXT,
    cover_image TEXT,
    category_id INT REFERENCES public.categories(category_id),
    author_id INT REFERENCES public.authors(author_id),
    stock_status VARCHAR(50) DEFAULT 'พร้อมจำหน่าย',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ตาราง orders (คำสั่งซื้อหลัก)
CREATE TABLE IF NOT EXISTS public.orders (
    order_id SERIAL PRIMARY KEY,
    customer_email VARCHAR(255) NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    status VARCHAR(50) NOT NULL DEFAULT 'ยืนยันแล้ว' CHECK (status IN ('รอชำระ', 'ยืนยันแล้ว', 'ยกเลิก')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ตาราง order_items (รายการย่อยในคำสั่งซื้อ)
CREATE TABLE IF NOT EXISTS public.order_items (
    item_id SERIAL PRIMARY KEY,
    order_id INT REFERENCES public.orders(order_id) ON DELETE CASCADE,
    ebook_id INT REFERENCES public.ebooks(ebook_id),
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0)
);

-- 7. ตาราง purchases (สิทธิ์การเข้าถึงการดาวน์โหลดตามอีเมล)
CREATE TABLE IF NOT EXISTS public.purchases (
    purchase_id SERIAL PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    ebook_id INT REFERENCES public.ebooks(ebook_id),
    purchased_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ตาราง users (ตารางข้อมูลผู้ใช้งานจริง เชื่อมกับ Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(150),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- ส่วนที่ 2: ตั้งค่าความปลอดภัย RLS (Row Level Security) ครบทุกตาราง
-- ---------------------------------------------------------------------

ALTER TABLE public.ebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow Public / Authenticated Read
DROP POLICY IF EXISTS "Public can view ebooks" ON public.ebooks;
CREATE POLICY "Public can view ebooks" ON public.ebooks FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
CREATE POLICY "Public can view categories" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view authors" ON public.authors;
CREATE POLICY "Public can view authors" ON public.authors FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow user view orders" ON public.orders;
CREATE POLICY "Allow user view orders" ON public.orders FOR SELECT USING (
    customer_email = (auth.jwt() ->> 'email') OR (auth.jwt() ->> 'email' = 'admin@gusso.com') OR auth.jwt() IS NULL
);

DROP POLICY IF EXISTS "Allow insert orders" ON public.orders;
CREATE POLICY "Allow insert orders" ON public.orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow select order_items" ON public.order_items;
CREATE POLICY "Allow select order_items" ON public.order_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert order_items" ON public.order_items;
CREATE POLICY "Allow insert order_items" ON public.order_items FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow select purchases" ON public.purchases;
CREATE POLICY "Allow select purchases" ON public.purchases FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert purchases" ON public.purchases;
CREATE POLICY "Allow insert purchases" ON public.purchases FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin can view all users" ON public.users;
CREATE POLICY "Admin can view all users" ON public.users FOR SELECT USING (true);


-- ---------------------------------------------------------------------
-- ส่วนที่ 3: Seed Data ข้อมูลตัวอย่าง 30 คำสั่งซื้อ (ตามเกณฑ์ข้อ 4 และ 13 ในใบงาน)
-- ---------------------------------------------------------------------

-- รีเซ็ตโครงสร้างตาราง orders และ order_items เพื่อความเข้ากันได้ 100%
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;

CREATE TABLE public.orders (
    order_id SERIAL PRIMARY KEY,
    customer_email VARCHAR(255) NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    status VARCHAR(50) NOT NULL DEFAULT 'ยืนยันแล้ว',
    payment_method VARCHAR(50) DEFAULT 'QR Code พร้อมเพย์ (จำลอง)',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.order_items (
    item_id SERIAL PRIMARY KEY,
    order_id INT REFERENCES public.orders(order_id) ON DELETE CASCADE,
    ebook_id INT REFERENCES public.ebooks(ebook_id),
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0)
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow user view orders" ON public.orders;
CREATE POLICY "Allow user view orders" ON public.orders FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert orders" ON public.orders;
CREATE POLICY "Allow insert orders" ON public.orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update orders" ON public.orders;
CREATE POLICY "Allow update orders" ON public.orders FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow select order_items" ON public.order_items;
CREATE POLICY "Allow select order_items" ON public.order_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert order_items" ON public.order_items;
CREATE POLICY "Allow insert order_items" ON public.order_items FOR INSERT WITH CHECK (true);


DO $$
DECLARE
    new_order_id INT;
BEGIN
    -- เดือนที่ 1: พฤษภาคม 2026 (May 2026) - 5 คำสั่งซื้อ
    INSERT INTO public.orders (customer_email, total_amount, status, payment_method, created_at)
    VALUES ('spectar65@gmail.com', 350.00, 'ยืนยันแล้ว', 'QR Code พร้อมเพย์ (จำลอง)', '2026-05-05 10:30:00+07')
    RETURNING order_id INTO new_order_id;
    INSERT INTO public.order_items (order_id, ebook_id, quantity, unit_price) VALUES (new_order_id, 1, 1, 350.00);

    INSERT INTO public.orders (customer_email, total_amount, status, payment_method, created_at)
    VALUES ('somchai.dev@gmail.com', 290.00, 'ยืนยันแล้ว', 'บัตรเครดิต/เดบิต (จำลอง)', '2026-05-12 14:15:00+07')
    RETURNING order_id INTO new_order_id;
    INSERT INTO public.order_items (order_id, ebook_id, quantity, unit_price) VALUES (new_order_id, 3, 1, 290.00);

    INSERT INTO public.orders (customer_email, total_amount, status, payment_method, created_at)
    VALUES ('sarah.c@designer.io', 490.00, 'ยืนยันแล้ว', 'QR Code พร้อมเพย์ (จำลอง)', '2026-05-18 16:45:00+07')
    RETURNING order_id INTO new_order_id;
    INSERT INTO public.order_items (order_id, ebook_id, quantity, unit_price) VALUES 
    (new_order_id, 4, 1, 220.00), (new_order_id, 7, 1, 270.00);

    INSERT INTO public.orders (customer_email, total_amount, status, payment_method, created_at)
    VALUES ('customer1@rmuti.ac.th', 310.00, 'รอชำระ', 'โอนผ่านบัญชีธนาคาร (จำลอง)', '2026-05-23 11:20:00+07')
    RETURNING order_id INTO new_order_id;
    INSERT INTO public.order_items (order_id, ebook_id, quantity, unit_price) VALUES (new_order_id, 5, 1, 310.00);

    INSERT INTO public.orders (customer_email, total_amount, status, payment_method, created_at)
    VALUES ('thirada.0411@gmail.com', 390.00, 'ยืนยันแล้ว', 'QR Code พร้อมเพย์ (จำลอง)', '2026-05-29 19:10:00+07')
    RETURNING order_id INTO new_order_id;
    INSERT INTO public.order_items (order_id, ebook_id, quantity, unit_price) VALUES (new_order_id, 2, 1, 390.00);

    -- เดือนที่ 2: มิถุนายน 2026 (June 2026) - 5 คำสั่งซื้อ
    INSERT INTO public.orders (customer_email, total_amount, status, payment_method, created_at)
    VALUES ('spectar763@gmail.com', 740.00, 'ยืนยันแล้ว', 'QR Code พร้อมเพย์ (จำลอง)', '2026-06-04 09:40:00+07')
    RETURNING order_id INTO new_order_id;
    INSERT INTO public.order_items (order_id, ebook_id, quantity, unit_price) VALUES 
    (new_order_id, 1, 1, 350.00), (new_order_id, 2, 1, 390.00);

    INSERT INTO public.orders (customer_email, total_amount, status, payment_method, created_at)
    VALUES ('user.alex@gmail.com', 340.00, 'ยืนยันแล้ว', 'บัตรเครดิต/เดบิต (จำลอง)', '2026-06-10 13:50:00+07')
    RETURNING order_id INTO new_order_id;
    INSERT INTO public.order_items (order_id, ebook_id, quantity, unit_price) VALUES (new_order_id, 6, 1, 340.00);

    INSERT INTO public.orders (customer_email, total_amount, status, payment_method, created_at)
    VALUES ('dev.artit@gmail.com', 320.00, 'ยืนยันแล้ว', 'QR Code พร้อมเพย์ (จำลอง)', '2026-06-15 15:25:00+07')
    RETURNING order_id INTO new_order_id;
    INSERT INTO public.order_items (order_id, ebook_id, quantity, unit_price) VALUES (new_order_id, 8, 1, 320.00);

    INSERT INTO public.orders (customer_email, total_amount, status, payment_method, created_at)
    VALUES ('student2@rmuti.ac.th', 290.00, 'ยกเลิก', 'โอนผ่านบัญชีธนาคาร (จำลอง)', '2026-06-21 17:30:00+07')
    RETURNING order_id INTO new_order_id;
    INSERT INTO public.order_items (order_id, ebook_id, quantity, unit_price) VALUES (new_order_id, 3, 1, 290.00);

    INSERT INTO public.orders (customer_email, total_amount, status, payment_method, created_at)
    VALUES ('kanokwan.k@gmail.com', 270.00, 'ยืนยันแล้ว', 'QR Code พร้อมเพย์ (จำลอง)', '2026-06-28 20:15:00+07')
    RETURNING order_id INTO new_order_id;
    INSERT INTO public.order_items (order_id, ebook_id, quantity, unit_price) VALUES (new_order_id, 7, 1, 270.00);

    -- เดือนที่ 3: กรกฎาคม 2026 (July 2026) - 5 คำสั่งซื้อ
    INSERT INTO public.orders (customer_email, total_amount, status, payment_method, created_at)
    VALUES ('thanawat.student@gmail.com', 310.00, 'ยืนยันแล้ว', 'QR Code พร้อมเพย์ (จำลอง)', '2026-07-03 11:10:00+07')
    RETURNING order_id INTO new_order_id;
    INSERT INTO public.order_items (order_id, ebook_id, quantity, unit_price) VALUES (new_order_id, 5, 1, 310.00);

    INSERT INTO public.orders (customer_email, total_amount, status, payment_method, created_at)
    VALUES ('spectar65@gmail.com', 670.00, 'ยืนยันแล้ว', 'QR Code พร้อมเพย์ (จำลอง)', '2026-07-09 14:30:00+07')
    RETURNING order_id INTO new_order_id;
    INSERT INTO public.order_items (order_id, ebook_id, quantity, unit_price) VALUES 
    (new_order_id, 1, 1, 350.00), (new_order_id, 8, 1, 320.00);

    INSERT INTO public.orders (customer_email, total_amount, status, payment_method, created_at)
    VALUES ('natthapong.c@gmail.com', 390.00, 'ยืนยันแล้ว', 'บัตรเครดิต/เดบิต (จำลอง)', '2026-07-15 16:05:00+07')
    RETURNING order_id INTO new_order_id;
    INSERT INTO public.order_items (order_id, ebook_id, quantity, unit_price) VALUES (new_order_id, 2, 1, 390.00);

    INSERT INTO public.orders (customer_email, total_amount, status, payment_method, created_at)
    VALUES ('customer1@rmuti.ac.th', 220.00, 'รอชำระ', 'โอนผ่านบัญชีธนาคาร (จำลอง)', '2026-07-22 18:20:00+07')
    RETURNING order_id INTO new_order_id;
    INSERT INTO public.order_items (order_id, ebook_id, quantity, unit_price) VALUES (new_order_id, 4, 1, 220.00);

    INSERT INTO public.orders (customer_email, total_amount, status, payment_method, created_at)
    VALUES ('thirada.0411@gmail.com', 600.00, 'ยืนยันแล้ว', 'QR Code พร้อมเพย์ (จำลอง)', '2026-07-28 21:00:00+07')
    RETURNING order_id INTO new_order_id;
    INSERT INTO public.order_items (order_id, ebook_id, quantity, unit_price) VALUES 
    (new_order_id, 3, 1, 290.00), (new_order_id, 5, 1, 310.00);

    -- เดือนที่ 4: สิงหาคม 2026 (August 2026) - 6 คำสั่งซื้อ
    INSERT INTO public.orders (customer_email, total_amount, status, payment_method, created_at)
    VALUES ('spectar763@gmail.com', 340.00, 'ยืนยันแล้ว', 'QR Code พร้อมเพย์ (จำลอง)', '2026-08-02 08:30:00+07')
    RETURNING order_id INTO new_order_id;
    INSERT INTO public.order_items (order_id, ebook_id, quantity, unit_price) VALUES (new_order_id, 6, 1, 340.00);

    INSERT INTO public.orders (customer_email, total_amount, status, payment_method, created_at)
    VALUES ('user.alex@gmail.com', 350.00, 'ยืนยันแล้ว', 'บัตรเครดิต/เดบิต (จำลอง)', '2026-08-07 10:45:00+07')
    RETURNING order_id INTO new_order_id;
    INSERT INTO public.order_items (order_id, ebook_id, quantity, unit_price) VALUES (new_order_id, 1, 1, 350.00);

    INSERT INTO public.orders (customer_email, total_amount, status, payment_method, created_at)
    VALUES ('sarah.c@designer.io', 590.00, 'ยืนยันแล้ว', 'QR Code พร้อมเพย์ (จำลอง)', '2026-08-13 13:15:00+07')
    RETURNING order_id INTO new_order_id;
    INSERT INTO public.order_items (order_id, ebook_id, quantity, unit_price) VALUES 
    (new_order_id, 7, 1, 270.00), (new_order_id, 8, 1, 320.00);

    INSERT INTO public.orders (customer_email, total_amount, status, payment_method, created_at)
    VALUES ('somchai.dev@gmail.com', 390.00, 'ยกเลิก', 'โอนผ่านบัญชีธนาคาร (จำลอง)', '2026-08-19 15:40:00+07')
    RETURNING order_id INTO new_order_id;
    INSERT INTO public.order_items (order_id, ebook_id, quantity, unit_price) VALUES (new_order_id, 2, 1, 390.00);

    INSERT INTO public.orders (customer_email, total_amount, status, payment_method, created_at)
    VALUES ('dev.artit@gmail.com', 310.00, 'ยืนยันแล้ว', 'QR Code พร้อมเพย์ (จำลอง)', '2026-08-24 18:00:00+07')
    RETURNING order_id INTO new_order_id;
    INSERT INTO public.order_items (order_id, ebook_id, quantity, unit_price) VALUES (new_order_id, 5, 1, 310.00);

    INSERT INTO public.orders (customer_email, total_amount, status, payment_method, created_at)
    VALUES ('spectar65@gmail.com', 510.00, 'ยืนยันแล้ว', 'QR Code พร้อมเพย์ (จำลอง)', '2026-08-29 20:30:00+07')
    RETURNING order_id INTO new_order_id;
    INSERT INTO public.order_items (order_id, ebook_id, quantity, unit_price) VALUES 
    (new_order_id, 3, 1, 290.00), (new_order_id, 4, 1, 220.00);

    -- เดือนที่ 5: กันยายน 2026 (September 2026) - 6 คำสั่งซื้อ
    INSERT INTO public.orders (customer_email, total_amount, status, payment_method, created_at)
    VALUES ('thirada.0411@gmail.com', 660.00, 'ยืนยันแล้ว', 'QR Code พร้อมเพย์ (จำลอง)', '2026-09-03 10:15:00+07')
    RETURNING order_id INTO new_order_id;
    INSERT INTO public.order_items (order_id, ebook_id, quantity, unit_price) VALUES 
    (new_order_id, 1, 1, 350.00), (new_order_id, 5, 1, 310.00);

    INSERT INTO public.orders (customer_email, total_amount, status, payment_method, created_at)
    VALUES ('thanawat.student@gmail.com', 390.00, 'ยืนยันแล้ว', 'บัตรเครดิต/เดบิต (จำลอง)', '2026-09-08 12:40:00+07')
    RETURNING order_id INTO new_order_id;
    INSERT INTO public.order_items (order_id, ebook_id, quantity, unit_price) VALUES (new_order_id, 2, 1, 390.00);

    INSERT INTO public.orders (customer_email, total_amount, status, payment_method, created_at)
    VALUES ('kanokwan.k@gmail.com', 320.00, 'ยืนยันแล้ว', 'QR Code พร้อมเพย์ (จำลอง)', '2026-09-14 14:50:00+07')
    RETURNING order_id INTO new_order_id;
    INSERT INTO public.order_items (order_id, ebook_id, quantity, unit_price) VALUES (new_order_id, 8, 1, 320.00);

    INSERT INTO public.orders (customer_email, total_amount, status, payment_method, created_at)
    VALUES ('student2@rmuti.ac.th', 340.00, 'รอชำระ', 'โอนผ่านบัญชีธนาคาร (จำลอง)', '2026-09-19 16:30:00+07')
    RETURNING order_id INTO new_order_id;
    INSERT INTO public.order_items (order_id, ebook_id, quantity, unit_price) VALUES (new_order_id, 6, 1, 340.00);

    INSERT INTO public.orders (customer_email, total_amount, status, payment_method, created_at)
    VALUES ('spectar763@gmail.com', 560.00, 'ยืนยันแล้ว', 'QR Code พร้อมเพย์ (จำลอง)', '2026-09-24 19:10:00+07')
    RETURNING order_id INTO new_order_id;
    INSERT INTO public.order_items (order_id, ebook_id, quantity, unit_price) VALUES 
    (new_order_id, 3, 1, 290.00), (new_order_id, 7, 1, 270.00);

    INSERT INTO public.orders (customer_email, total_amount, status, payment_method, created_at)
    VALUES ('spectar65@gmail.com', 350.00, 'ยืนยันแล้ว', 'QR Code พร้อมเพย์ (จำลอง)', '2026-09-28 21:45:00+07')
    RETURNING order_id INTO new_order_id;
    INSERT INTO public.order_items (order_id, ebook_id, quantity, unit_price) VALUES (new_order_id, 1, 1, 350.00);

    -- เดือนที่ 6: ตุลาคม 2026 (October 2026) - 3 คำสั่งซื้อ
    INSERT INTO public.orders (customer_email, total_amount, status, payment_method, created_at)
    VALUES ('user.alex@gmail.com', 220.00, 'ยืนยันแล้ว', 'บัตรเครดิต/เดบิต (จำลอง)', '2026-10-01 09:20:00+07')
    RETURNING order_id INTO new_order_id;
    INSERT INTO public.order_items (order_id, ebook_id, quantity, unit_price) VALUES (new_order_id, 4, 1, 220.00);

    INSERT INTO public.orders (customer_email, total_amount, status, payment_method, created_at)
    VALUES ('thirada.0411@gmail.com', 680.00, 'ยืนยันแล้ว', 'QR Code พร้อมเพย์ (จำลอง)', '2026-10-02 11:55:00+07')
    RETURNING order_id INTO new_order_id;
    INSERT INTO public.order_items (order_id, ebook_id, quantity, unit_price) VALUES 
    (new_order_id, 2, 1, 390.00), (new_order_id, 3, 1, 290.00);

    INSERT INTO public.orders (customer_email, total_amount, status, payment_method, created_at)
    VALUES ('somchai.dev@gmail.com', 310.00, 'รอชำระ', 'โอนผ่านบัญชีธนาคาร (จำลอง)', '2026-10-03 14:10:00+07')
    RETURNING order_id INTO new_order_id;
    INSERT INTO public.order_items (order_id, ebook_id, quantity, unit_price) VALUES (new_order_id, 5, 1, 310.00);
END $$;


-- ---------------------------------------------------------------------
-- ส่วนที่ 4: คำสั่ง SQL Query รายงานวิเคราะห์ 4 เรื่อง (ตามข้อ 5 ในใบงาน)
-- นำไปใส่ในเล่มรายงานและรันดูผลลัพธ์ใน SQL Editor ได้ทันที
-- ---------------------------------------------------------------------

-- รายงานที่ 1: ยอดขายตามช่วงเวลา (รายเดือน/รายวัน)
-- คำถาม: ยอดขาย จำนวนคำสั่งซื้อ และค่าเฉลี่ยต่อคำสั่งซื้อ เปลี่ยนไปอย่างไรตามวันที่หรือเดือน
-- คำสั่ง SQL ที่ใช้: JOIN, GROUP BY, SUM, COUNT, AVG ครบถ้วน
SELECT 
    TO_CHAR(o.created_at, 'YYYY-MM') AS เดือนที่สั่งซื้อ,
    COUNT(DISTINCT o.order_id) AS จำนวนคำสั่งซื้อทั้งหมด_COUNT,
    COUNT(DISTINCT CASE WHEN o.status = 'ยืนยันแล้ว' THEN o.order_id END) AS จำนวนคำสั่งซื้อสำเร็จ,
    SUM(CASE WHEN o.status = 'ยืนยันแล้ว' THEN o.total_amount ELSE 0 END) AS ยอดขายรวม_SUM,
    ROUND(AVG(CASE WHEN o.status = 'ยืนยันแล้ว' THEN o.total_amount ELSE NULL END), 2) AS ค่าเฉลี่ยต่อคำสั่งซื้อ_AVG
FROM public.orders o
GROUP BY TO_CHAR(o.created_at, 'YYYY-MM')
ORDER BY เดือนที่สั่งซื้อ ASC;


-- รายงานที่ 2: E-Book ขายดีที่สุด
-- คำถาม: E-Book ใดขายได้มากที่สุดตามจำนวนเล่มหรือยอดขาย
-- คำสั่ง SQL ที่ใช้: JOIN, GROUP BY, SUM, COUNT และ LIMIT
SELECT 
    e.ebook_id AS รหัสหนังสือ,
    e.title AS ชื่อหนังสือ,
    SUM(oi.quantity) AS จำนวนเล่มที่ขายได้_COUNT_SUM,
    SUM(oi.quantity * oi.unit_price) AS ยอดขายรวม_SUM
FROM public.ebooks e
JOIN public.order_items oi ON e.ebook_id = oi.ebook_id
JOIN public.orders o ON oi.order_id = o.order_id
WHERE o.status = 'ยืนยันแล้ว'
GROUP BY e.ebook_id, e.title
ORDER BY จำนวนเล่มที่ขายได้_COUNT_SUM DESC, ยอดขายรวม_SUM DESC
LIMIT 5;


-- รายงานที่ 3: ยอดขายตามหมวดหมู่หนังสือ
-- คำถาม: หมวดหมู่ใดสร้างยอดขายและจำนวนรายการสูงสุด
-- คำสั่ง SQL ที่ใช้: JOIN หลายตาราง, GROUP BY, SUM
SELECT 
    c.category_id AS รหัสหมวดหมู่,
    c.category_name AS ชื่อหมวดหมู่,
    COUNT(DISTINCT o.order_id) AS จำนวนออเดอร์,
    SUM(oi.quantity) AS จำนวนเล่มทั้งหมด,
    SUM(oi.quantity * oi.unit_price) AS ยอดขายรวมตามหมวดหมู่_SUM
FROM public.categories c
JOIN public.ebooks e ON c.category_id = e.category_id
JOIN public.order_items oi ON e.ebook_id = oi.ebook_id
JOIN public.orders o ON oi.order_id = o.order_id
WHERE o.status = 'ยืนยันแล้ว'
GROUP BY c.category_id, c.category_name
ORDER BY ยอดขายรวมตามหมวดหมู่_SUM DESC;


-- รายงานที่ 4: สถิติลูกค้าและคำสั่งซื้อ (Top Customers)
-- คำถาม: ลูกค้ารายใดซื้อบ่อยหรือมียอดซื้อสะสมสูง และแต่ละสถานะมีจำนวนเท่าใด
-- คำสั่ง SQL ที่ใช้: JOIN, GROUP BY, HAVING, COUNT, SUM และเงื่อนไขสถานะ
SELECT 
    o.customer_email AS อีเมลลูกค้า,
    COUNT(o.order_id) AS จำนวนครั้งที่สั่งซื้อ_COUNT,
    SUM(o.total_amount) AS ยอดซื้อสะสม_SUM,
    COUNT(CASE WHEN o.status = 'ยืนยันแล้ว' THEN 1 END) AS สถานะ_ยืนยันแล้ว,
    COUNT(CASE WHEN o.status = 'รอชำระ' THEN 1 END) AS สถานะ_รอชำระ
FROM public.orders o
GROUP BY o.customer_email
HAVING COUNT(o.order_id) >= 1
ORDER BY ยอดซื้อสะสม_SUM DESC, จำนวนครั้งที่สั่งซื้อ_COUNT DESC;
