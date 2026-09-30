-- =====================================================================
-- โครงงาน Mini Project Database: ร้านขาย E-Book (GusSo E-Book Store)
-- ไฟล์: supabase_seed_30_orders_monthly.sql
-- คำสั่ง SQL นำเข้าข้อมูลตัวอย่าง 30 คำสั่งซื้อ (Orders & Order Items)
-- ครอบคลุมหลายเดือน หลายหมวดหมู่ หลายสถานะ (ยืนยันแล้ว, รอชำระ, ยกเลิก)
-- สำหรับสร้างรายงานวิเคราะห์ยอดขายรายเดือน (Monthly Analytics) ตามใบงานวิชา Database
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. ล้างข้อมูลคำสั่งซื้อเดิมออกก่อน (เพื่อให้ข้อมูลใหม่ 30 รายการไม่ซ้ำซ้อน)
-- ---------------------------------------------------------------------
DELETE FROM public.order_items;
DELETE FROM public.orders;

-- ---------------------------------------------------------------------
-- 2. นำเข้า 30 คำสั่งซื้อ กระจาย 6 เดือน (พ.ค. 2026 - ต.ค. 2026)
-- ---------------------------------------------------------------------
DO $$
DECLARE
    new_order_id INT;
BEGIN
    -- =================================================================
    -- เดือนที่ 1: พฤษภาคม 2026 (May 2026) - 5 คำสั่งซื้อ
    -- =================================================================
    -- Order 1: ยืนยันแล้ว
    INSERT INTO public.orders (customer_email, total_amount, status, payment_method, created_at)
    VALUES ('spectar65@gmail.com', 350.00, 'ยืนยันแล้ว', 'QR Code พร้อมเพย์ (จำลอง)', '2026-05-05 10:30:00+07')
    RETURNING order_id INTO new_order_id;
    INSERT INTO public.order_items (order_id, ebook_id, quantity, unit_price) VALUES (new_order_id, 1, 1, 350.00);

    -- Order 2: ยืนยันแล้ว
    INSERT INTO public.orders (customer_email, total_amount, status, payment_method, created_at)
    VALUES ('somchai.dev@gmail.com', 290.00, 'ยืนยันแล้ว', 'บัตรเครดิต/เดบิต (จำลอง)', '2026-05-12 14:15:00+07')
    RETURNING order_id INTO new_order_id;
    INSERT INTO public.order_items (order_id, ebook_id, quantity, unit_price) VALUES (new_order_id, 3, 1, 290.00);

    -- Order 3: ยืนยันแล้ว (ซื้อ 2 เล่ม)
    INSERT INTO public.orders (customer_email, total_amount, status, payment_method, created_at)
    VALUES ('sarah.c@designer.io', 490.00, 'ยืนยันแล้ว', 'QR Code พร้อมเพย์ (จำลอง)', '2026-05-18 16:45:00+07')
    RETURNING order_id INTO new_order_id;
    INSERT INTO public.order_items (order_id, ebook_id, quantity, unit_price) VALUES 
    (new_order_id, 4, 1, 220.00),
    (new_order_id, 7, 1, 270.00);

    -- Order 4: รอชำระ
    INSERT INTO public.orders (customer_email, total_amount, status, payment_method, created_at)
    VALUES ('customer1@rmuti.ac.th', 310.00, 'รอชำระ', 'โอนผ่านบัญชีธนาคาร (จำลอง)', '2026-05-23 11:20:00+07')
    RETURNING order_id INTO new_order_id;
    INSERT INTO public.order_items (order_id, ebook_id, quantity, unit_price) VALUES (new_order_id, 5, 1, 310.00);

    -- Order 5: ยืนยันแล้ว
    INSERT INTO public.orders (customer_email, total_amount, status, payment_method, created_at)
    VALUES ('thirada.0411@gmail.com', 390.00, 'ยืนยันแล้ว', 'QR Code พร้อมเพย์ (จำลอง)', '2026-05-29 19:10:00+07')
    RETURNING order_id INTO new_order_id;
    INSERT INTO public.order_items (order_id, ebook_id, quantity, unit_price) VALUES (new_order_id, 2, 1, 390.00);

    -- =================================================================
    -- เดือนที่ 2: มิถุนายน 2026 (June 2026) - 5 คำสั่งซื้อ
    -- =================================================================
    -- Order 6: ยืนยันแล้ว (ซื้อ 2 เล่ม)
    INSERT INTO public.orders (customer_email, total_amount, status, payment_method, created_at)
    VALUES ('spectar763@gmail.com', 740.00, 'ยืนยันแล้ว', 'QR Code พร้อมเพย์ (จำลอง)', '2026-06-04 09:40:00+07')
    RETURNING order_id INTO new_order_id;
    INSERT INTO public.order_items (order_id, ebook_id, quantity, unit_price) VALUES 
    (new_order_id, 1, 1, 350.00),
    (new_order_id, 2, 1, 390.00);

    -- Order 7: ยืนยันแล้ว
    INSERT INTO public.orders (customer_email, total_amount, status, payment_method, created_at)
    VALUES ('user.alex@gmail.com', 340.00, 'ยืนยันแล้ว', 'บัตรเครดิต/เดบิต (จำลอง)', '2026-06-10 13:50:00+07')
    RETURNING order_id INTO new_order_id;
    INSERT INTO public.order_items (order_id, ebook_id, quantity, unit_price) VALUES (new_order_id, 6, 1, 340.00);

    -- Order 8: ยืนยันแล้ว
    INSERT INTO public.orders (customer_email, total_amount, status, payment_method, created_at)
    VALUES ('dev.artit@gmail.com', 320.00, 'ยืนยันแล้ว', 'QR Code พร้อมเพย์ (จำลอง)', '2026-06-15 15:25:00+07')
    RETURNING order_id INTO new_order_id;
    INSERT INTO public.order_items (order_id, ebook_id, quantity, unit_price) VALUES (new_order_id, 8, 1, 320.00);

    -- Order 9: ยกเลิก
    INSERT INTO public.orders (customer_email, total_amount, status, payment_method, created_at)
    VALUES ('student2@rmuti.ac.th', 290.00, 'ยกเลิก', 'โอนผ่านบัญชีธนาคาร (จำลอง)', '2026-06-21 17:30:00+07')
    RETURNING order_id INTO new_order_id;
    INSERT INTO public.order_items (order_id, ebook_id, quantity, unit_price) VALUES (new_order_id, 3, 1, 290.00);

    -- Order 10: ยืนยันแล้ว
    INSERT INTO public.orders (customer_email, total_amount, status, payment_method, created_at)
    VALUES ('kanokwan.k@gmail.com', 270.00, 'ยืนยันแล้ว', 'QR Code พร้อมเพย์ (จำลอง)', '2026-06-28 20:15:00+07')
    RETURNING order_id INTO new_order_id;
    INSERT INTO public.order_items (order_id, ebook_id, quantity, unit_price) VALUES (new_order_id, 7, 1, 270.00);

    -- =================================================================
    -- เดือนที่ 3: กรกฎาคม 2026 (July 2026) - 5 คำสั่งซื้อ
    -- =================================================================
    -- Order 11: ยืนยันแล้ว
    INSERT INTO public.orders (customer_email, total_amount, status, payment_method, created_at)
    VALUES ('thanawat.student@gmail.com', 310.00, 'ยืนยันแล้ว', 'QR Code พร้อมเพย์ (จำลอง)', '2026-07-03 11:10:00+07')
    RETURNING order_id INTO new_order_id;
    INSERT INTO public.order_items (order_id, ebook_id, quantity, unit_price) VALUES (new_order_id, 5, 1, 310.00);

    -- Order 12: ยืนยันแล้ว (ซื้อ 2 เล่ม)
    INSERT INTO public.orders (customer_email, total_amount, status, payment_method, created_at)
    VALUES ('spectar65@gmail.com', 670.00, 'ยืนยันแล้ว', 'QR Code พร้อมเพย์ (จำลอง)', '2026-07-09 14:30:00+07')
    RETURNING order_id INTO new_order_id;
    INSERT INTO public.order_items (order_id, ebook_id, quantity, unit_price) VALUES 
    (new_order_id, 1, 1, 350.00),
    (new_order_id, 8, 1, 320.00);

    -- Order 13: ยืนยันแล้ว
    INSERT INTO public.orders (customer_email, total_amount, status, payment_method, created_at)
    VALUES ('natthapong.c@gmail.com', 390.00, 'ยืนยันแล้ว', 'บัตรเครดิต/เดบิต (จำลอง)', '2026-07-15 16:05:00+07')
    RETURNING order_id INTO new_order_id;
    INSERT INTO public.order_items (order_id, ebook_id, quantity, unit_price) VALUES (new_order_id, 2, 1, 390.00);

    -- Order 14: รอชำระ
    INSERT INTO public.orders (customer_email, total_amount, status, payment_method, created_at)
    VALUES ('customer1@rmuti.ac.th', 220.00, 'รอชำระ', 'โอนผ่านบัญชีธนาคาร (จำลอง)', '2026-07-22 18:20:00+07')
    RETURNING order_id INTO new_order_id;
    INSERT INTO public.order_items (order_id, ebook_id, quantity, unit_price) VALUES (new_order_id, 4, 1, 220.00);

    -- Order 15: ยืนยันแล้ว (ซื้อ 2 เล่ม)
    INSERT INTO public.orders (customer_email, total_amount, status, payment_method, created_at)
    VALUES ('thirada.0411@gmail.com', 600.00, 'ยืนยันแล้ว', 'QR Code พร้อมเพย์ (จำลอง)', '2026-07-28 21:00:00+07')
    RETURNING order_id INTO new_order_id;
    INSERT INTO public.order_items (order_id, ebook_id, quantity, unit_price) VALUES 
    (new_order_id, 3, 1, 290.00),
    (new_order_id, 5, 1, 310.00);

    -- =================================================================
    -- เดือนที่ 4: สิงหาคม 2026 (August 2026) - 6 คำสั่งซื้อ
    -- =================================================================
    -- Order 16: ยืนยันแล้ว
    INSERT INTO public.orders (customer_email, total_amount, status, payment_method, created_at)
    VALUES ('spectar763@gmail.com', 340.00, 'ยืนยันแล้ว', 'QR Code พร้อมเพย์ (จำลอง)', '2026-08-02 08:30:00+07')
    RETURNING order_id INTO new_order_id;
    INSERT INTO public.order_items (order_id, ebook_id, quantity, unit_price) VALUES (new_order_id, 6, 1, 340.00);

    -- Order 17: ยืนยันแล้ว
    INSERT INTO public.orders (customer_email, total_amount, status, payment_method, created_at)
    VALUES ('user.alex@gmail.com', 350.00, 'ยืนยันแล้ว', 'บัตรเครดิต/เดบิต (จำลอง)', '2026-08-07 10:45:00+07')
    RETURNING order_id INTO new_order_id;
    INSERT INTO public.order_items (order_id, ebook_id, quantity, unit_price) VALUES (new_order_id, 1, 1, 350.00);

    -- Order 18: ยืนยันแล้ว (ซื้อ 2 เล่ม)
    INSERT INTO public.orders (customer_email, total_amount, status, payment_method, created_at)
    VALUES ('sarah.c@designer.io', 590.00, 'ยืนยันแล้ว', 'QR Code พร้อมเพย์ (จำลอง)', '2026-08-13 13:15:00+07')
    RETURNING order_id INTO new_order_id;
    INSERT INTO public.order_items (order_id, ebook_id, quantity, unit_price) VALUES 
    (new_order_id, 7, 1, 270.00),
    (new_order_id, 8, 1, 320.00);

    -- Order 19: ยกเลิก
    INSERT INTO public.orders (customer_email, total_amount, status, payment_method, created_at)
    VALUES ('somchai.dev@gmail.com', 390.00, 'ยกเลิก', 'โอนผ่านบัญชีธนาคาร (จำลอง)', '2026-08-19 15:40:00+07')
    RETURNING order_id INTO new_order_id;
    INSERT INTO public.order_items (order_id, ebook_id, quantity, unit_price) VALUES (new_order_id, 2, 1, 390.00);

    -- Order 20: ยืนยันแล้ว
    INSERT INTO public.orders (customer_email, total_amount, status, payment_method, created_at)
    VALUES ('dev.artit@gmail.com', 310.00, 'ยืนยันแล้ว', 'QR Code พร้อมเพย์ (จำลอง)', '2026-08-24 18:00:00+07')
    RETURNING order_id INTO new_order_id;
    INSERT INTO public.order_items (order_id, ebook_id, quantity, unit_price) VALUES (new_order_id, 5, 1, 310.00);

    -- Order 21: ยืนยันแล้ว (ซื้อ 2 เล่ม)
    INSERT INTO public.orders (customer_email, total_amount, status, payment_method, created_at)
    VALUES ('spectar65@gmail.com', 510.00, 'ยืนยันแล้ว', 'QR Code พร้อมเพย์ (จำลอง)', '2026-08-29 20:30:00+07')
    RETURNING order_id INTO new_order_id;
    INSERT INTO public.order_items (order_id, ebook_id, quantity, unit_price) VALUES 
    (new_order_id, 3, 1, 290.00),
    (new_order_id, 4, 1, 220.00);

    -- =================================================================
    -- เดือนที่ 5: กันยายน 2026 (September 2026) - 6 คำสั่งซื้อ
    -- =================================================================
    -- Order 22: ยืนยันแล้ว (ซื้อ 2 เล่ม)
    INSERT INTO public.orders (customer_email, total_amount, status, payment_method, created_at)
    VALUES ('thirada.0411@gmail.com', 660.00, 'ยืนยันแล้ว', 'QR Code พร้อมเพย์ (จำลอง)', '2026-09-03 10:15:00+07')
    RETURNING order_id INTO new_order_id;
    INSERT INTO public.order_items (order_id, ebook_id, quantity, unit_price) VALUES 
    (new_order_id, 1, 1, 350.00),
    (new_order_id, 5, 1, 310.00);

    -- Order 23: ยืนยันแล้ว
    INSERT INTO public.orders (customer_email, total_amount, status, payment_method, created_at)
    VALUES ('thanawat.student@gmail.com', 390.00, 'ยืนยันแล้ว', 'บัตรเครดิต/เดบิต (จำลอง)', '2026-09-08 12:40:00+07')
    RETURNING order_id INTO new_order_id;
    INSERT INTO public.order_items (order_id, ebook_id, quantity, unit_price) VALUES (new_order_id, 2, 1, 390.00);

    -- Order 24: ยืนยันแล้ว
    INSERT INTO public.orders (customer_email, total_amount, status, payment_method, created_at)
    VALUES ('kanokwan.k@gmail.com', 320.00, 'ยืนยันแล้ว', 'QR Code พร้อมเพย์ (จำลอง)', '2026-09-14 14:50:00+07')
    RETURNING order_id INTO new_order_id;
    INSERT INTO public.order_items (order_id, ebook_id, quantity, unit_price) VALUES (new_order_id, 8, 1, 320.00);

    -- Order 25: รอชำระ
    INSERT INTO public.orders (customer_email, total_amount, status, payment_method, created_at)
    VALUES ('student2@rmuti.ac.th', 340.00, 'รอชำระ', 'โอนผ่านบัญชีธนาคาร (จำลอง)', '2026-09-19 16:30:00+07')
    RETURNING order_id INTO new_order_id;
    INSERT INTO public.order_items (order_id, ebook_id, quantity, unit_price) VALUES (new_order_id, 6, 1, 340.00);

    -- Order 26: ยืนยันแล้ว (ซื้อ 2 เล่ม)
    INSERT INTO public.orders (customer_email, total_amount, status, payment_method, created_at)
    VALUES ('spectar763@gmail.com', 560.00, 'ยืนยันแล้ว', 'QR Code พร้อมเพย์ (จำลอง)', '2026-09-24 19:10:00+07')
    RETURNING order_id INTO new_order_id;
    INSERT INTO public.order_items (order_id, ebook_id, quantity, unit_price) VALUES 
    (new_order_id, 3, 1, 290.00),
    (new_order_id, 7, 1, 270.00);

    -- Order 27: ยืนยันแล้ว
    INSERT INTO public.orders (customer_email, total_amount, status, payment_method, created_at)
    VALUES ('spectar65@gmail.com', 350.00, 'ยืนยันแล้ว', 'QR Code พร้อมเพย์ (จำลอง)', '2026-09-28 21:45:00+07')
    RETURNING order_id INTO new_order_id;
    INSERT INTO public.order_items (order_id, ebook_id, quantity, unit_price) VALUES (new_order_id, 1, 1, 350.00);

    -- =================================================================
    -- เดือนที่ 6: ตุลาคม 2026 (October 2026) - 3 คำสั่งซื้อ
    -- =================================================================
    -- Order 28: ยืนยันแล้ว
    INSERT INTO public.orders (customer_email, total_amount, status, payment_method, created_at)
    VALUES ('user.alex@gmail.com', 220.00, 'ยืนยันแล้ว', 'บัตรเครดิต/เดบิต (จำลอง)', '2026-10-01 09:20:00+07')
    RETURNING order_id INTO new_order_id;
    INSERT INTO public.order_items (order_id, ebook_id, quantity, unit_price) VALUES (new_order_id, 4, 1, 220.00);

    -- Order 29: ยืนยันแล้ว (ซื้อ 2 เล่ม)
    INSERT INTO public.orders (customer_email, total_amount, status, payment_method, created_at)
    VALUES ('thirada.0411@gmail.com', 680.00, 'ยืนยันแล้ว', 'QR Code พร้อมเพย์ (จำลอง)', '2026-10-02 11:55:00+07')
    RETURNING order_id INTO new_order_id;
    INSERT INTO public.order_items (order_id, ebook_id, quantity, unit_price) VALUES 
    (new_order_id, 2, 1, 390.00),
    (new_order_id, 3, 1, 290.00);

    -- Order 30: รอชำระ
    INSERT INTO public.orders (customer_email, total_amount, status, payment_method, created_at)
    VALUES ('somchai.dev@gmail.com', 310.00, 'รอชำระ', 'โอนผ่านบัญชีธนาคาร (จำลอง)', '2026-10-03 14:10:00+07')
    RETURNING order_id INTO new_order_id;
    INSERT INTO public.order_items (order_id, ebook_id, quantity, unit_price) VALUES (new_order_id, 5, 1, 310.00);

END $$;

-- ---------------------------------------------------------------------
-- 3. ตรวจสอบผลการนำเข้า 30 คำสั่งซื้อ
-- ---------------------------------------------------------------------
SELECT COUNT(*) AS total_inserted_orders FROM public.orders;
SELECT status, COUNT(*) AS count_by_status FROM public.orders GROUP BY status;

-- ---------------------------------------------------------------------
-- 4. คำสั่ง SQL สร้างรายงานสรุปยอดขายรายเดือน (สำหรับตอบคำถามในใบงานข้อ 5)
-- "ยอดขาย จำนวนคำสั่งซื้อ และค่าเฉลี่ยต่อคำสั่งซื้อ เปลี่ยนไปอย่างไรตามวันที่หรือเดือน"
-- ใช้ JOIN, GROUP BY, SUM, COUNT, AVG ครบถ้วนตามเกณฑ์ใบงาน
-- ---------------------------------------------------------------------
SELECT 
    TO_CHAR(o.created_at, 'YYYY-MM') AS sale_month,
    COUNT(DISTINCT o.order_id) AS total_orders,
    COUNT(DISTINCT CASE WHEN o.status = 'ยืนยันแล้ว' THEN o.order_id END) AS confirmed_orders,
    COUNT(DISTINCT CASE WHEN o.status = 'รอชำระ' THEN o.order_id END) AS pending_orders,
    COUNT(DISTINCT CASE WHEN o.status = 'ยกเลิก' THEN o.order_id END) AS cancelled_orders,
    COALESCE(SUM(CASE WHEN o.status = 'ยืนยันแล้ว' THEN o.total_amount ELSE 0 END), 0) AS total_revenue,
    ROUND(COALESCE(AVG(CASE WHEN o.status = 'ยืนยันแล้ว' THEN o.total_amount ELSE NULL END), 0), 2) AS avg_order_value
FROM public.orders o
GROUP BY TO_CHAR(o.created_at, 'YYYY-MM')
ORDER BY sale_month ASC;
