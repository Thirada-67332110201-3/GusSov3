-- =====================================================================
-- โครงงาน Mini Project Database: ร้านจำหน่ายหนังสือ E-Book (GusSo Store)
-- หัวข้อ 5: รายงานวิเคราะห์จากข้อมูลจริง (Analytical Reports from Real Data)
-- รวมคำสั่ง SQL Query ทั้ง 4 รายงานตามเกณฑ์ใบงาน ครบทุก Keyword
-- =====================================================================

-- ---------------------------------------------------------------------
-- รายงานที่ 1: ยอดขายตามช่วงเวลา (Sales by Time Period)
-- คำถาม: ยอดขาย จำนวนคำสั่งซื้อ และค่าเฉลี่ยต่อคำสั่งซื้อ เปลี่ยนไปอย่างไรตามวันที่หรือเดือน
-- SQL Keywords ที่ใช้: JOIN, GROUP BY, SUM, COUNT, AVG, ตัวกรองวัน (DATE_TRUNC / BETWEEN)
-- ---------------------------------------------------------------------
SELECT 
    TO_CHAR(o.created_at, 'YYYY-MM') AS sale_month,
    TO_CHAR(o.created_at, 'TMMonth YYYY') AS month_name,
    COUNT(o.order_id) AS total_orders,
    COUNT(CASE WHEN o.status = 'ยืนยันแล้ว' THEN 1 END) AS confirmed_orders,
    COUNT(CASE WHEN o.status = 'รอชำระ' THEN 1 END) AS pending_orders,
    COUNT(CASE WHEN o.status = 'ยกเลิก' THEN 1 END) AS cancelled_orders,
    SUM(CASE WHEN o.status = 'ยืนยันแล้ว' THEN o.total_amount ELSE 0 END) AS total_revenue,
    ROUND(AVG(CASE WHEN o.status = 'ยืนยันแล้ว' THEN o.total_amount END), 2) AS avg_order_value
FROM public.orders o
WHERE o.created_at >= '2026-05-01 00:00:00+07' 
  AND o.created_at <= '2026-10-31 23:59:59+07'
GROUP BY TO_CHAR(o.created_at, 'YYYY-MM'), TO_CHAR(o.created_at, 'TMMonth YYYY')
ORDER BY sale_month ASC;


-- ---------------------------------------------------------------------
-- รายงานที่ 2: E-Book ขายดีที่สุด (Top Selling E-Books)
-- คำถาม: E Book ใดขายได้มากที่สุดตามจำนวนเล่มหรือยอดขาย
-- SQL Keywords ที่ใช้: JOIN, GROUP BY, SUM, COUNT, LIMIT
-- ---------------------------------------------------------------------
SELECT 
    b.ebook_id,
    b.title AS ebook_title,
    COALESCE(a.author_name, 'ดร. ธนวัฒน์ หาญณรงค์') AS author_name,
    c.category_name,
    b.price AS unit_price,
    SUM(oi.quantity) AS total_copies_sold,
    SUM(oi.quantity * oi.unit_price) AS total_sales_amount
FROM public.order_items oi
JOIN public.orders o ON oi.order_id = o.order_id
JOIN public.ebooks b ON oi.ebook_id = b.ebook_id
LEFT JOIN public.authors a ON b.author_id = a.author_id
LEFT JOIN public.categories c ON b.category_id = c.category_id
WHERE o.status = 'ยืนยันแล้ว'
GROUP BY b.ebook_id, b.title, a.author_name, c.category_name, b.price
ORDER BY total_copies_sold DESC, total_sales_amount DESC
LIMIT 5;


-- ---------------------------------------------------------------------
-- รายงานที่ 3: ยอดขายตามหมวดหมู่หนังสือ (Sales by Category)
-- คำถาม: หมวดหมู่ใดสร้างยอดขายและจำนวนรายการสูงสุด
-- SQL Keywords ที่ใช้: JOIN หลายตาราง, GROUP BY, SUM
-- ---------------------------------------------------------------------
SELECT 
    c.category_id,
    c.category_name,
    COUNT(DISTINCT o.order_id) AS total_distinct_orders,
    SUM(oi.quantity) AS total_items_sold,
    SUM(oi.quantity * oi.unit_price) AS total_category_revenue,
    ROUND(
        (SUM(oi.quantity * oi.unit_price) / 
         SUM(SUM(oi.quantity * oi.unit_price)) OVER ()) * 100, 
        2
    ) AS revenue_percentage
FROM public.categories c
JOIN public.ebooks b ON c.category_id = b.category_id
JOIN public.order_items oi ON b.ebook_id = oi.ebook_id
JOIN public.orders o ON oi.order_id = o.order_id
WHERE o.status = 'ยืนยันแล้ว'
GROUP BY c.category_id, c.category_name
ORDER BY total_category_revenue DESC;


-- ---------------------------------------------------------------------
-- รายงานที่ 4: ลูกค้าและคำสั่งซื้อ (Top Customers & Order Status Breakdown)
-- คำถาม: ลูกค้ารายใดซื้อบ่อยหรือมียอดซื้อสะสมสูง และแต่ละสถานะมีจำนวนเท่าใด
-- SQL Keywords ที่ใช้: JOIN, GROUP BY, HAVING, COUNT, SUM, เงื่อนไขสถานะ (CASE WHEN)
-- ---------------------------------------------------------------------
SELECT 
    o.customer_email,
    COUNT(o.order_id) AS total_orders,
    COUNT(CASE WHEN o.status = 'ยืนยันแล้ว' THEN 1 END) AS confirmed_count,
    COUNT(CASE WHEN o.status = 'รอชำระ' THEN 1 END) AS pending_count,
    COUNT(CASE WHEN o.status = 'ยกเลิก' THEN 1 END) AS cancelled_count,
    SUM(CASE WHEN o.status = 'ยืนยันแล้ว' THEN o.total_amount ELSE 0 END) AS total_confirmed_spent,
    CASE 
        WHEN SUM(CASE WHEN o.status = 'ยืนยันแล้ว' THEN o.total_amount ELSE 0 END) >= 1000 THEN 'ลูกค้า VIP ระดับทอง'
        WHEN SUM(CASE WHEN o.status = 'ยืนยันแล้ว' THEN o.total_amount ELSE 0 END) >= 500 THEN 'ลูกค้าประจำ (Silver)'
        ELSE 'ลูกค้าทั่วไป (Bronze)'
    END AS member_tier
FROM public.orders o
GROUP BY o.customer_email
HAVING COUNT(o.order_id) >= 2
ORDER BY total_confirmed_spent DESC, total_orders DESC;
