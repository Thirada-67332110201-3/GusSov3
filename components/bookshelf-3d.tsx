'use client'

import React, { useState } from 'react'
import { BookOpen, ShoppingBag, Sparkles, Star, User, Eye } from 'lucide-react'

export type BookshelfBook = {
  ebook_id: number
  title: string
  author?: string
  author_id?: number
  price: number
  description: string
  cover_image: string
  rating?: number
  total_reviews?: number
  category_id?: number
}

interface Bookshelf3DProps {
  books: BookshelfBook[]
  onAddToCart: (book: BookshelfBook) => void
  onOpenReader: (book: BookshelfBook) => void
  onOpenAiSummary: (book: BookshelfBook) => void
  onViewAuthor?: (authorId: number) => void
}

export function Bookshelf3D({
  books,
  onAddToCart,
  onOpenReader,
  onOpenAiSummary,
  onViewAuthor
}: Bookshelf3DProps) {
  const [selectedBook, setSelectedBook] = useState<BookshelfBook | null>(null)

  // จัดกลุ่มหนังสือใส่แต่ละชั้นไม้ (เช่น ชั้นละ 4 เล่ม)
  const booksPerShelf = 4
  const shelves: BookshelfBook[][] = []
  for (let i = 0; i < books.length; i += booksPerShelf) {
    shelves.push(books.slice(i, i + booksPerShelf))
  }

  return (
    <div className="relative py-6 px-2 sm:px-6">
      {/* ส่วนหัวแสดงบรรยากาศห้องสมุด 3D */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 bg-gradient-to-r from-amber-950 via-stone-900 to-amber-950 text-amber-100 p-4 sm:p-5 rounded-2xl border border-amber-800/40 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-xl">
            🪵
          </div>
          <div>
            <h3 className="font-extrabold text-base sm:text-lg text-amber-200 flex items-center gap-2">
              ชั้นหนังสือไม้ 3D (3D Wooden Bookshelf)
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-300 border border-amber-400/30">
                Interactive 3D
              </span>
            </h3>
            <p className="text-xs text-amber-200/70">
              แตะหรือคลิกที่หนังสือบนชั้น เพื่อหยิบเล่มขึ้นมาเปิดอ่าน สรุปเนื้อหาด้วย AI หรือหยิบใส่ตะกร้า
            </p>
          </div>
        </div>
      </div>

      {/* ชั้นหนังสือไม้แต่ละชั้น */}
      <div className="space-y-12 sm:space-y-16 py-4">
        {shelves.map((shelfBooks, shelfIdx) => (
          <div key={shelfIdx} className="relative group">
            {/* แสงไฟส่องลงมาจากด้านบนของชั้น */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-amber-400/5 blur-3xl pointer-events-none rounded-full"></div>

            {/* แถวหนังสือยืนบนชั้น */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 px-4 sm:px-10 items-end min-h-[260px] pb-1">
              {shelfBooks.map((book, idx) => {
                // เอียงมุมหนังสือเล็กน้อยเพิ่มความเป็นธรรมชาติ
                const tiltAngle = (idx % 2 === 0 ? -1 : 1) * (1.5 + (idx % 3))
                return (
                  <div
                    key={book.ebook_id}
                    onClick={() => setSelectedBook(book)}
                    style={{
                      transform: `perspective(1000px) rotateY(${tiltAngle}deg)`,
                      transformStyle: 'preserve-3d'
                    }}
                    className="relative cursor-pointer group/book transition-all duration-300 hover:-translate-y-6 hover:scale-105 hover:rotate-y-0 z-10 hover:z-30 flex flex-col items-center"
                  >
                    {/* ตัวเล่มหนังสือ 3D */}
                    <div className="relative w-28 sm:w-36 h-40 sm:h-52 rounded-r-lg overflow-hidden shadow-2xl transition-shadow duration-300 group-hover/book:shadow-amber-500/20 border-l-[6px] border-amber-950 bg-slate-900">
                      {/* สันหนังสือนูนด้านซ้าย (Book Spine Effect) */}
                      <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black/60 via-white/10 to-transparent z-20 pointer-events-none"></div>

                      {/* สันขอบบนและเงา (Book Page Edges Top/Right) */}
                      <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-stone-200 via-stone-300 to-stone-400 z-10"></div>

                      {/* ภาพหน้าปกหนังสือ */}
                      <img
                        src={book.cover_image}
                        alt={book.title}
                        className="w-full h-full object-cover group-hover/book:scale-105 transition duration-500"
                        loading="lazy"
                      />

                      {/* ป้ายราคาคาดมุม */}
                      <div className="absolute top-2 right-2 bg-slate-900/90 backdrop-blur-xs text-amber-300 font-extrabold text-[11px] px-2 py-0.5 rounded-md shadow-md border border-amber-400/30">
                        ฿{book.price}
                      </div>

                      {/* Glow overlay เมื่อชี้เมาส์ */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-white/10 opacity-0 group-hover/book:opacity-100 transition duration-300 flex flex-col justify-end p-2.5 text-white">
                        <p className="text-xs font-bold line-clamp-1 text-amber-200">{book.title}</p>
                        <span className="text-[10px] text-amber-300 font-medium flex items-center gap-1 mt-0.5">
                          <Eye className="w-3 h-3" /> แตะเพื่อดูรายละเอียด
                        </span>
                      </div>
                    </div>

                    {/* เงาสะท้อนของเล่มหนังสือลงบนพื้นไม้ (Book Floor Shadow) */}
                    <div className="w-24 sm:w-32 h-2.5 bg-black/40 blur-xs rounded-full mt-1 group-hover/book:scale-75 group-hover/book:opacity-40 transition-all"></div>
                  </div>
                )
              })}
            </div>

            {/* ตัวแผ่นไม้ชั้นหนังสือ (Realistic Wooden Shelf Plank) */}
            <div className="relative w-full">
              {/* ขอบผิวด้านบนของแผ่นไม้ (Wood Shelf Top Surface) */}
              <div className="h-4 bg-gradient-to-r from-amber-800 via-amber-700 to-amber-900 rounded-t-sm shadow-inner border-t border-amber-500/40 relative">
                {/* ลายเส้นเนื้อไม้สะท้อนแสง */}
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
              </div>

              {/* สันขอบหน้าของชั้นไม้ (Wood Shelf Front Thickness & Bevel) */}
              <div className="h-6 sm:h-7 bg-gradient-to-b from-amber-900 via-stone-900 to-black rounded-b-md shadow-2xl flex items-center justify-between px-6 border-b border-amber-950/80">
                {/* หมุดทองเหลืองด้านซ้าย (Brass Studs) */}
                <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-amber-300 to-amber-600 shadow-sm border border-amber-700"></div>
                {/* แผ่นป้ายทองเหลืองบอกหมวดหมู่หรือลำดับชั้น */}
                <div className="px-3 py-0.5 rounded bg-gradient-to-r from-amber-700/60 via-amber-600/60 to-amber-700/60 border border-amber-400/30 text-[10px] font-bold text-amber-200 shadow-xs tracking-wider uppercase">
                  ชั้นที่ {shelfIdx + 1} • GusSo Collection
                </div>
                {/* หมุดทองเหลืองด้านขวา */}
                <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-amber-300 to-amber-600 shadow-sm border border-amber-700"></div>
              </div>

              {/* เงาทอดใต้ชั้นไม้ลงผนัง */}
              <div className="h-5 bg-gradient-to-b from-black/50 to-transparent"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal หน้าต่างเมื่อคลิกหยิบหนังสือขึ้นมาจากชั้นไม้ */}
      {selectedBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 text-white rounded-3xl max-w-xl w-full border border-amber-500/30 shadow-2xl overflow-hidden relative">
            {/* หัวโมดัล */}
            <div className="relative p-6 sm:p-7 bg-gradient-to-r from-slate-950 via-purple-950/50 to-slate-950 border-b border-white/10 flex flex-col sm:flex-row gap-5 items-start">
              <img
                src={selectedBook.cover_image}
                alt={selectedBook.title}
                className="w-24 sm:w-28 h-36 sm:h-40 object-cover rounded-xl shadow-2xl border border-white/20 shrink-0 mx-auto sm:mx-0"
              />
              <div className="flex-1 space-y-2 text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  {selectedBook.rating || 5.0} ({selectedBook.total_reviews || 30} รีวิว)
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white leading-snug">
                  {selectedBook.title}
                </h3>
                {selectedBook.author && (
                  <p className="text-xs text-purple-300 flex items-center justify-center sm:justify-start gap-1 font-medium">
                    <User className="w-3.5 h-3.5" /> ผู้แต่ง: {selectedBook.author}
                  </p>
                )}
                <div className="text-2xl font-black text-amber-400 pt-1">
                  ฿{selectedBook.price}{' '}
                  <span className="text-xs text-slate-400 font-normal">บาท (ฉบับ E-Book พร้อมดาวน์โหลด)</span>
                </div>
              </div>

              {/* ปุ่มปิด */}
              <button
                onClick={() => setSelectedBook(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition"
              >
                ✕
              </button>
            </div>

            {/* คำอธิบายหนังสือ */}
            <div className="p-6 space-y-4 max-h-60 overflow-y-auto">
              <p className="text-sm text-slate-300 leading-relaxed">
                {selectedBook.description}
              </p>
            </div>

            {/* ปุ่มคำสั่งต่างๆ */}
            <div className="p-5 bg-slate-950/80 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* ปุ่มเปิดอ่านตัวอย่างแบบ Flip 3D */}
              <button
                onClick={() => {
                  onOpenReader(selectedBook)
                  setSelectedBook(null)
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-3 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30 cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>เปิดอ่านตัวอย่าง 3D</span>
              </button>

              {/* ปุ่มสรุป AI 3 บรรทัด */}
              <button
                onClick={() => {
                  onOpenAiSummary(selectedBook)
                  setSelectedBook(null)
                }}
                className="bg-purple-900/60 hover:bg-purple-800/80 text-purple-200 border border-purple-500/40 font-bold py-2.5 px-3 rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>สรุป AI 3 บรรทัด</span>
              </button>

              {/* ปุ่มหยิบใส่ตะกร้า */}
              <button
                onClick={() => {
                  onAddToCart(selectedBook)
                  setSelectedBook(null)
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-3 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/30 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>หยิบใส่ตะกร้า</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
