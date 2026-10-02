# รายงานการทดสอบอัตโนมัติและระบบ CI/CD (Automated Tests & CI Report)
## GusSo E-Book Store (ระบบร้านจำหน่ายหนังสืออิเล็กทรอนิกส์)

**เอกสาร:** Automated Test Suite & Continuous Integration Pipeline  
**สถานะการทำงาน:** ✅ ผ่านการทดสอบทั้งหมด 100% (All Checks Passed)  
**ไฟล์เวิร์กโฟลว์ CI:** [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)  
**ไฟล์ชุดทดสอบ:** [`tests/system.test.mjs`](../tests/system.test.mjs)  

---

## 1. กลยุทธ์การทดสอบ (Testing Strategy)

เพื่อรักษาเสถียรภาพและความถูกต้องของระบบพาณิชย์อิเล็กทรอนิกส์และฐานข้อมูล จึงแบ่งการทดสอบอัตโนมัติออกเป็น 4 ขอบเขตหลัก:

1. **Safety Guard & Business Rule Verification:** ทดสอบการคำนวณส่วนลดโปรโมชั่นรายสัปดาห์ โดยบังคับใช้กฎห้ามราคาเป็น 0 บาท หรือติดลบ
2. **E-Commerce Transaction Calculations:** ทดสอบความแม่นยำในการคำนวณยอดเงินรวมในตะกร้าสินค้า (Subtotal, Quantity, Total Amount)
3. **AI Recommendation Accuracy:** ทดสอบการจับคู่คีย์เวิร์ดและความต้องการของผู้ใช้ (เช่น การเขียนโปรแกรม, การเงินการลงทุน)
4. **Relational Integrity (3NF Constraints):** ทดสอบความสมบูรณ์ของความสัมพันธ์ Foreign Key (ความเชื่อมโยงระหว่าง Books, Authors, Categories, และ Roles)

---

## 2. ผลการรันชุดทดสอบอัตโนมัติ (Automated Test Execution Results)

คำสั่งที่ใช้รัน:
```bash
npm run test
```

### บันทึกผลการรัน (Execution Log Output):
```text
✔ EBook Promotion Safety Guard: price must always be strictly greater than 0 (2.3293ms)
✔ Order Item & Cart Calculation: accurately sums subtotal and quantity (0.4387ms)
✔ AI Book Advisor Intent Matching: matches programming & investment keywords (0.9513ms)
✔ Database 3NF Relational Integrity: enforces valid foreign keys (0.226ms)

ℹ tests 4
ℹ suites 0
ℹ pass 4
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 104.6018ms
```

### ตารางสรุปผลการทดสอบแยกตามโมดูล:

| รหัสทดสอบ | กรณีทดสอบ (Test Case) | อินพุต / เงื่อนไขที่ทดสอบ | ผลลัพธ์ที่คาดหวัง | สถานะ |
| :---: | :--- | :--- | :--- | :---: |
| **TC-01** | EBook Promotion Safety Guard | ส่วนลด 15%, 20%, 100%, 120% | ราคาต้องไม่ติดลบ และไม่เป็น 0 (มี Floor Price ป้องกัน) | **PASS** 🟢 |
| **TC-02** | Cart Subtotal Calculation | สินค้า 2 รายการ (฿350 x 2, ฿290 x 1) | ยอดรวม ฿990.00 และจำนวนรวม 3 เล่ม | **PASS** 🟢 |
| **TC-03** | AI Advisor Intent Matching | คำค้นหา "สนใจเรื่อง ลงทุน หุ้น" | แนะนำเล่ม "Investment & Wealth Guide" ถูกต้อง | **PASS** 🟢 |
| **TC-04** | 3NF Schema FK Integrity | ตรวจสอบการผูก `author_id` และ `category_id` | Foreign Key ตรงตาม Master Catalog | **PASS** 🟢 |

---

## 3. ระบบตรวจจับและประเมินผลอัตโนมัติ (CI Pipeline Configuration)

ระบบใช้งาน **GitHub Actions** เป็น Continuous Integration (CI) อัตโนมัติ โดยจะทริกเกอร์ทุกครั้งที่มีการ `git push` เข้าสู่ branch `main`:

```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on:
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout Repository
      uses: actions/checkout@v4
    - name: Set up Node.js 20
      uses: actions/setup-node@v4
      with:
        node-version: 20
        cache: 'npm'
    - name: Install Dependencies
      run: npm ci
    - name: Run Automated Test Suite
      run: npm run test
    - name: Build Next.js Application
      run: npm run build
```

### สรุปผลการรัน CI:
- **Test Status:** ✅ Passed (4/4 tests passed)
- **Build Status:** ✅ Compiled cleanly (Next.js 15 Static & Dynamic routes 100% OK)
- **Deployment Status:** ✅ Ready for Vercel / Render Production
