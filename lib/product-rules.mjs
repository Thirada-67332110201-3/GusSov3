/**
 * ProductOrderService - บริการจัดการคำสั่งซื้อและตัดสต็อกตามชนิดสินค้า (โครงงาน GusSov3)
 * สถาปัตยกรรม Clean Code & Domain-Driven Rules:
 * 1. สินค้าจับต้องได้ (Physical): สั่งซื้อเกินสต็อกต้องถูกปฏิเสธ และตัดสต็อกเมื่อสำเร็จ
 * 2. สินค้าดิจิทัล (Digital): ไม่ตัดสต็อก และจำกัดสิทธิ์ดาวน์โหลดเฉพาะคำสั่งซื้อที่ยืนยันแล้ว
 */

export const ProductType = Object.freeze({
  PHYSICAL: 'physical',
  DIGITAL: 'digital'
});

export const OrderErrorMessage = Object.freeze({
  INSUFFICIENT_STOCK: 'ยอดคงเหลือสินค้าไม่เพียงพอสำหรับการสั่งซื้อ',
  INVALID_QUANTITY: 'จำนวนที่สั่งซื้อต้องมากกว่า 0',
  UNCONFIRMED_DOWNLOAD: 'ไม่สามารถเปิดลิงก์ดาวน์โหลดได้ เนื่องจากคำสั่งซื้อยังไม่ได้รับการยืนยัน',
  NO_DOWNLOAD_LINK: 'สินค้านี้ไม่มีลิงก์ดาวน์โหลด',
  UNSUPPORTED_TYPE: 'ไม่รองรับชนิดสินค้าประเภท:'
});

export class ProductOrderService {
  /**
   * ตรวจสอบความถูกต้องและประมวลผลการขายตามประเภทสินค้า
   */
  sell(item, quantity = 1) {
    if (quantity <= 0) {
      throw new Error(OrderErrorMessage.INVALID_QUANTITY);
    }

    switch (item.type) {
      case ProductType.PHYSICAL:
        return this._sellPhysicalProduct(item, quantity);

      case ProductType.DIGITAL:
        return this._sellDigitalProduct(item);

      default:
        throw new Error(`${OrderErrorMessage.UNSUPPORTED_TYPE} ${item.type}`);
    }
  }

  /**
   * ขอรับลิงก์ดาวน์โหลดสำหรับคำสั่งซื้อสินค้าดิจิทัล
   */
  getDownloadLink(order) {
    if (order.productType !== ProductType.DIGITAL) {
      throw new Error(OrderErrorMessage.NO_DOWNLOAD_LINK);
    }

    if (!order.isConfirmed) {
      throw new Error(OrderErrorMessage.UNCONFIRMED_DOWNLOAD);
    }

    return order.downloadUrl;
  }

  // --- Private Helpers ---
  _sellPhysicalProduct(item, quantity) {
    if (quantity > item.stock) {
      throw new Error(OrderErrorMessage.INSUFFICIENT_STOCK);
    }
    item.stock -= quantity;
    return {
      success: true,
      remainingStock: item.stock
    };
  }

  _sellDigitalProduct(item) {
    // สินค้าดิจิทัลยอดคงเหลือคงที่เสมอ
    return {
      success: true,
      remainingStock: item.stock
    };
  }
}
