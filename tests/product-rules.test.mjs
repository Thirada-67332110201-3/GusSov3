import test from 'node:test';
import assert from 'node:assert/strict';
import { ProductOrderService } from '../lib/product-rules.mjs';

// ==============================================================================
// งานบังคับต่อจากขั้นที่ 3: กฎของสินค้าสองชนิด (โครงงาน GusSov3)
// ==============================================================================

// ------------------------------------------------------------------------------
// กฎข้อที่ 1: สินค้าจับต้องได้ (Physical Product)
// ------------------------------------------------------------------------------
test('Physical Product Rule: สั่งซื้อเกินยอดคงเหลือต้องถูกปฏิเสธ', () => {
  const service = new ProductOrderService();
  const physicalItem = { id: 'p1', name: 'Printed Book', type: 'physical', stock: 5 };

  assert.throws(
    () => {
      service.sell(physicalItem, 10); // สั่งซื้อ 10 ชิ้น จากสต็อก 5 ชิ้น
    },
    {
      name: 'Error',
      message: 'ยอดคงเหลือสินค้าไม่เพียงพอสำหรับการสั่งซื้อ'
    }
  );
});

test('Physical Product Rule: เมื่อขายสำเร็จยอดคงเหลือต้องลดลงตามจำนวนที่ขาย', () => {
  const service = new ProductOrderService();
  const physicalItem = { id: 'p1', name: 'Printed Book', type: 'physical', stock: 10 };

  const result = service.sell(physicalItem, 3);
  assert.equal(result.success, true);
  assert.equal(physicalItem.stock, 7); // สต็อกลดลงจาก 10 เหลือ 7
  assert.equal(result.remainingStock, 7);
});

// ------------------------------------------------------------------------------
// กฎข้อที่ 2: สินค้าดิจิทัล (Digital Product / E-Book)
// ------------------------------------------------------------------------------
test('Digital Product Rule: ขายแล้วยอดคงเหลือไม่ลด (สินค้าดิจิทัลไม่มีวันหมดสต็อก)', () => {
  const service = new ProductOrderService();
  const digitalItem = { id: 'd1', name: 'Next.js 15 E-Book', type: 'digital', stock: 999 };

  const result = service.sell(digitalItem, 1);
  assert.equal(result.success, true);
  assert.equal(digitalItem.stock, 999); // ยอดคงเหลือไม่ลด
  assert.equal(result.remainingStock, 999);
});

test('Digital Product Rule: เปิดลิงก์ดาวน์โหลดไม่ได้ถ้าคำสั่งซื้อยังไม่ยืนยัน', () => {
  const service = new ProductOrderService();
  const unconfirmedOrder = {
    orderId: 'ORD-101',
    productId: 'd1',
    productType: 'digital',
    isConfirmed: false,
    downloadUrl: 'https://gussov3.com/download/ebook-101.pdf'
  };

  assert.throws(
    () => {
      service.getDownloadLink(unconfirmedOrder);
    },
    {
      name: 'Error',
      message: 'ไม่สามารถเปิดลิงก์ดาวน์โหลดได้ เนื่องจากคำสั่งซื้อยังไม่ได้รับการยืนยัน'
    }
  );
});

test('Digital Product Rule: เปิดลิงก์ดาวน์โหลดได้สำเร็จเมื่อคำสั่งซื้อได้รับการยืนยันแล้ว', () => {
  const service = new ProductOrderService();
  const confirmedOrder = {
    orderId: 'ORD-102',
    productId: 'd1',
    productType: 'digital',
    isConfirmed: true,
    downloadUrl: 'https://gussov3.com/download/ebook-102.pdf'
  };

  const link = service.getDownloadLink(confirmedOrder);
  assert.equal(link, 'https://gussov3.com/download/ebook-102.pdf');
});
