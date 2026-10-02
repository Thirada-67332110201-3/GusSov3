# แผนภาพสถาปัตยกรรมระบบ (System Diagrams)
## GusSo E-Book Store (ระบบร้านจำหน่ายหนังสืออิเล็กทรอนิกส์)

**เอกสาร:** Class Diagram & Sequence Diagram  
**มาตรฐานที่ใช้:** Unified Modeling Language (UML) & Mermaid  

---

## 1. ลำดับการทำงานของระบบ (Sequence Diagrams)

### 1.1 Sequence Diagram: ขั้นตอนการสั่งซื้อและชำระเงินแบบแยกแท็บ (Multi-Tab Checkout Sequence)

```mermaid
sequenceDiagram
    autonumber
    actor Customer as 👤 ลูกค้า (Customer)
    participant UI as 🖥️ หน้าร้านค้า (Catalog / Cart Drawer)
    participant Tab as 📑 หน้าชำระเงิน (/checkout Tab)
    participant API as ⚡ Backend / API Services
    participant DB as 🗄️ Supabase PostgreSQL
    actor Admin as 👨‍💼 ผู้ดูแลระบบ (Admin)

    Customer->>UI: 1. เลือกหนังสือ & กด "เพิ่มลงตะกร้า"
    UI->>UI: 2. คำนวณราคารวมและส่วนลดโปรโมชั่น
    Customer->>UI: 3. กดปุ่ม "ไปที่หน้าชำระเงิน"
    UI->>Tab: 4. เปิดแท็บใหม่ (window.open('/checkout'))
    Tab->>API: 5. ดึงรายการคำสั่งซื้อที่รอชำระ
    API->>DB: 6. SELECT * FROM orders WHERE status = 'รอชำระ'
    DB-->>Tab: 7. ส่งข้อมูลคำสั่งซื้อรวม (Single Order Summary)
    Customer->>Tab: 8. เลือกชำระผ่าน PromptPay / บัตรเครดิต & แนบสลิป
    Tab->>API: 9. ส่งข้อมูลหลักฐานการชำระเงิน
    API->>DB: 10. INSERT INTO payments & UPDATE orders SET status = 'รอตรวจสอบ'
    DB-->>Tab: 11. บันทึกข้อมูลสำเร็จ
    Tab-->>Customer: 12. แสดงข้อความสำเร็จ พร้อมปุ่ม "กลับไปยังแท็บร้านค้า"
    
    Note over Admin,DB: การอนุมัติคำสั่งซื้อหลังบ้าน
    Admin->>API: 13. ตรวจสอบสลิป & กด "อนุมัติคำสั่งซื้อ"
    API->>DB: 14. UPDATE orders SET status = 'ยืนยันแล้ว'
    API->>DB: 15. INSERT INTO purchases & download_links (Token)
    DB-->>UI: 16. เพิ่มหนังสือเข้าชั้น 3D Bookshelf ของผู้ใช้อัตโนมัติ
```

---

### 1.2 Sequence Diagram: ระบบ AI ผู้ช่วยแนะนำหนังสือ (AI Book Advisor Flow)

```mermaid
sequenceDiagram
    autonumber
    actor User as 👤 ผู้ใช้งาน (User)
    participant Advisor as 🤖 AI Book Advisor Component
    participant Engine as 🧠 Recommendation Engine
    participant Catalog as 📚 E-Book Database (Catalog)

    User->>Advisor: 1. พิมพ์คำถามหรือหัวข้อที่สนใจ (เช่น "อยากเริ่มศึกษาการลงทุน")
    Advisor->>Engine: 2. ส่งข้อความเพื่อวิเคราะห์ Intent & Keywords
    Engine->>Catalog: 3. ค้นหาหนังสือที่สอดคล้องตาม Category, Tags, Title
    Catalog-->>Engine: 4. รายการหนังสือที่ตรงเงื่อนไข
    Engine->>Engine: 5. คำนวณความตรงประเด็น (Relevance Score) และเรียงลำดับ
    Engine-->>Advisor: 6. ส่งผลลัพธ์หนังสือแนะนำ 3 อันดับแรก + คำอธิบายเหตุผล
    Advisor-->>User: 7. แสดงการ์ดหนังสือ พร้อมปุ่ม "ใส่ตะกร้า" ได้ทันที
```

---

## 2. แผนภาพคลาสและโมเดลข้อมูล (Class Diagram / Domain Model)

```mermaid
classDiagram
    class User {
        +UUID id
        +String email
        +String name
        +Integer role_id
        +DateTime created_at
        +login()
        +logout()
        +viewBookshelf()
    }

    class Role {
        +Integer role_id
        +String role_name
        +getPermissions()
    }

    class Author {
        +Integer author_id
        +String author_name
        +getPublishedBooks()
        +calculateRoyalties()
    }

    class Category {
        +Integer category_id
        +String category_name
        +getBooks()
    }

    class EBook {
        +Integer ebook_id
        +String title
        +Numeric price
        +Integer author_id
        +Integer category_id
        +String description
        +String cover_image
        +Boolean is_active
        +getEffectivePrice()
        +verifySafetyPrice()
    }

    class Order {
        +Integer order_id
        +String customer_email
        +Numeric total_amount
        +String status
        +String payment_method
        +DateTime created_at
        +calculateTotal()
        +confirmPayment()
        +cancelOrder()
    }

    class OrderItem {
        +Integer item_id
        +Integer order_id
        +Integer ebook_id
        +Integer quantity
        +Numeric unit_price
        +getSubtotal()
    }

    class Payment {
        +Integer payment_id
        +Integer order_id
        +Numeric amount
        +String slip_image
        +String payment_status
        +DateTime paid_at
        +verifySlip()
    }

    class DownloadLink {
        +Integer link_id
        +Integer order_id
        +Integer ebook_id
        +String token
        +Boolean is_active
        +DateTime expires_at
        +validateToken()
    }

    class MysteryBox {
        +Integer box_id
        +String user_email
        +Integer coins_rewarded
        +DateTime opened_at
        +openBox()
    }

    %% Relationships
    User "N" --> "1" Role : has role
    EBook "N" --> "1" Author : written by
    EBook "N" --> "1" Category : belongs to
    Order "1" *-- "N" OrderItem : contains
    OrderItem "N" --> "1" EBook : references
    Order "1" -- "1" Payment : paid by
    Order "1" -- "N" DownloadLink : generates
    User "1" --> "N" MysteryBox : participates
```
