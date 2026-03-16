

# E-commerce Admin Panel (O'zbekcha)

## 1. Supabase bazasini sozlash
- **Jadvallar**: categories, products, product_images, orders, order_items, profiles, user_roles (admin/seller/customer enum)
- **RLS**: Admin faqat o'z rolini tekshirish uchun `has_role()` security definer funksiyasi
- **Storage**: product-images bucket yaratish

## 2. Autentifikatsiya
- Login sahifasi (email + parol)
- Admin rolini tekshirish — faqat admin kirganda panel ko'rinadi
- Admin bo'lmasa "Ruxsat yo'q" sahifasi

## 3. Admin Layout
- Chap sidebar navigatsiya (ShadCN Sidebar): Bosh sahifa, Foydalanuvchilar, Sotuvchilar, Kategoriyalar, Mahsulotlar, Buyurtmalar
- Yuqorida header: admin ismi, chiqish tugmasi
- O'zbekcha interfeys

## 4. Dashboard (Bosh sahifa)
- Statistika kartalar: Jami foydalanuvchilar, Jami buyurtmalar, Jami daromad, Faol sotuvchilar
- Recharts grafiklari: Haftalik/oylik sotuv, Buyurtmalar holati

## 5. Foydalanuvchilarni boshqarish
- Jadval: ism, email, rol, ro'yxatdan o'tgan sana
- Foydalanuvchini bloklash/faollashtirish

## 6. Sotuvchilarni boshqarish
- Sotuvchilar ro'yxati
- Tasdiqlash / rad etish
- Sotuvchi statistikasi

## 7. Kategoriyalarni boshqarish
- Kategoriya qo'shish / tahrirlash / o'chirish
- Kategoriyalar ro'yxati jadvali

## 8. Mahsulotlarni ko'rish
- Barcha mahsulotlar jadvali (sotuvchi nomi, kategoriya, narx, stock)
- Filter: kategoriya, narx bo'yicha
- Mahsulotni o'chirish imkoniyati (admin sifatida)

## 9. Buyurtmalarni monitoring qilish
- Buyurtmalar jadvali: ID, xaridor, summa, status, sana
- Status o'zgartirish (Pending → Paid → Shipped → Delivered / Cancelled)
- Buyurtma tafsilotlari dialog

