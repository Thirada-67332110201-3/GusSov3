/**
 * ProductOrderService - บริการจัดการคำสั่งซื้อและตัดสต็อกตามชนิดสินค้า (โครงงาน GusSov3)
 * บังคับใช้กฎ Business Logic สองชนิด:
 * 1. สินค้าจับต้องได้ (Physical): สั่งซื้อเกินสต็อกต้องปฏิเสธ และลดสต็อกตามยอดขายจริง
 * 2. สินค้าดิจิทัล (Digital): ยอดคงเหลือไม่ลด และไม่อนุญาตให้ดาวน์โหลดจนกว่าคำสั่งซื้อจะยืนยัน
 */
export class ProductOrderService {
  /**
   * ดำเนินการขายและตัดสต็อกตามชนิดสินค้า
   * @param {{ id: string, name: string, type: 'physical' | 'digital', stock: number }} item
   * @param {number} quantity
   * @returns {{ success: boolean, remainingStock: number }}
   */
  sell(item, quantity = 1) {
    if (quantity <= 0) {
      throw new Error('จำนวนที่สั่งซื้อต้องมากกว่า 0');
    }

    if (item.type === 'physical') {
      if (quantity > item.stock) {
        throw new Error('ยอดคงเหลือสินค้าไม่เพียงพอสำหรับการสั่งซื้อ');
      }
      item.stock -= quantity;
      return {
        success: true,
        remainingStock: item.stock
      };
    }

    if (item.type === 'digital') {
      // สินค้าดิจิทัล / E-Book: ขายแล้วยอดคงเหลือไม่ลด
      return {
        success: true,
        remainingStock: item.stock
      };
    }

    throw new Error(`ไม่รองรับชนิดสินค้าประเภท: ${item.type}`);
  }

  /**
   * ขอรับลิงก์ดาวน์โหลดสำหรับสินค้าดิจิทัล
   * @param {{ orderId: string, productId: string, productType: string, isConfirmed: boolean, downloadUrl: string }} order
   * @returns {string}
   */
  getDownloadLink(order) {
    if (order.productType === 'digital') {
      if (!order.isConfirmed) {
        throw new Error('ไม่สามารถเปิดลิงก์ดาวน์โหลดได้ เนื่องจากคำสั่งซื้อยังไม่ได้รับการยืนยัน');
      }
      return order.downloadUrl;
    }

    throw new Error('สินค้านี้ไม่มีลิงก์ดาวน์โหลด');
  }
}
