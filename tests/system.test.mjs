import test from 'node:test';
import assert from 'node:assert/strict';

// Test 1: Price safety guard logic (ห้ามราคา 0 บาท หรือติดลบ)
test('EBook Promotion Safety Guard: price must always be strictly greater than 0', () => {
  function calculateDiscountedPrice(originalPrice, discountPercent) {
    const discounted = originalPrice * (1 - discountPercent / 100);
    // Safety guard rule: price must never be <= 0
    if (discounted <= 0) {
      return 1; // Floor price minimum 1 THB
    }
    return Math.round(discounted * 100) / 100;
  }

  assert.equal(calculateDiscountedPrice(350, 15), 297.5);
  assert.equal(calculateDiscountedPrice(100, 20), 80);
  assert.equal(calculateDiscountedPrice(100, 100), 1); // Guarded: not 0
  assert.equal(calculateDiscountedPrice(50, 120), 1);  // Guarded: not negative
});

// Test 2: Cart Total & Order Item subtotal calculation
test('Order Item & Cart Calculation: accurately sums subtotal and quantity', () => {
  const cartItems = [
    { ebook_id: 1, title: 'Next.js 15 Guide', unit_price: 350.00, quantity: 2 },
    { ebook_id: 4, title: 'Advanced TypeScript', unit_price: 290.00, quantity: 1 }
  ];

  const subtotal = cartItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  const totalItems = cartItems.reduce((count, item) => count + item.quantity, 0);

  assert.equal(subtotal, 990.00);
  assert.equal(totalItems, 3);
});

// Test 3: AI Advisor keyword intent matching
test('AI Book Advisor Intent Matching: matches programming & investment keywords', () => {
  function matchBookRecommendation(query, books) {
    const normalized = query.toLowerCase();
    return books.filter(b => 
      b.title.toLowerCase().includes(normalized) || 
      b.category.toLowerCase().includes(normalized) ||
      b.tags.some(t => normalized.includes(t))
    );
  }

  const catalog = [
    { title: 'Next.js 15 Guide', category: 'Next.js & Supabase', tags: ['react', 'nextjs', 'web'] },
    { title: 'Database 3NF Architecture', category: 'Database & Backend', tags: ['sql', 'database', 'postgres'] },
    { title: 'Investment & Wealth Guide', category: 'Finance', tags: ['ลงทุน', 'การเงิน', 'หุ้น'] }
  ];

  const investResults = matchBookRecommendation('สนใจเรื่อง ลงทุน หุ้น', catalog);
  assert.equal(investResults.length, 1);
  assert.equal(investResults[0].title, 'Investment & Wealth Guide');

  const webResults = matchBookRecommendation('nextjs', catalog);
  assert.equal(webResults.length, 1);
  assert.equal(webResults[0].title, 'Next.js 15 Guide');
});

// Test 4: Database 3NF Integrity Constraints & Foreign Keys check
test('Database 3NF Relational Integrity: enforces valid foreign keys', () => {
  const roles = [
    { role_id: 1, role_name: 'admin' },
    { role_id: 2, role_name: 'customer' },
    { role_id: 3, role_name: 'author' }
  ];

  const authors = [
    { author_id: 1, author_name: 'ดร. ธนวัฒน์ หาญณรงค์' },
    { author_id: 2, author_name: 'Alex River' }
  ];

  const categories = [
    { category_id: 1, category_name: 'Next.js & Supabase' },
    { category_id: 2, category_name: 'Database & Backend' }
  ];

  const newBook = {
    ebook_id: 1,
    title: 'Next.js 15 App Router',
    price: 350.00,
    author_id: 1,
    category_id: 1
  };

  // Validate FK constraints exist
  const hasValidAuthor = authors.some(a => a.author_id === newBook.author_id);
  const hasValidCategory = categories.some(c => c.category_id === newBook.category_id);

  assert.equal(hasValidAuthor, true);
  assert.equal(hasValidCategory, true);
});
