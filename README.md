# Market Wave X

**Market Wave X** — React, Vite va Tailwind CSS texnologiyalariga asoslangan, juda tez va foydalanishda qulay bo'lgan zamonaviy onlayn e-commerce platformasi. Foydalanuvchilar unda mahsulotlarni izlashi, savatchaga qo'shishi va Firebase yordamida oson xarid qilishi mumkin.

## ✨ Xususiyatlar (Features)

- **Tezkor UI:** Vite va React tufayli yuqori tezlikdagi ishlash tarzi.
- **Zamonaviy Dizayn:** Tailwind CSS va Shadcn UI orqali chiroyli va qulay interfeys (responsive design).
- **Global Holat Boshqaruvi:** Xaridlar savatchasi, orderlar va foydalanuvchi ma'lumotlarini Context va kesh xotiralarida saqlash.
- **Firebase Integratsiyasi:** Firestore orqali real-time mahsulot ma'lumotlarini o'qish, Auth orqali Google va Email bilan ro'yxatdan o'tish imkoniyati.
- **Turlangan Xavfsizlik:** TypeScript integratsiyasi orqali bug-free muhit va qattiq turdagi xavfsizlik (Type-safety).

## 🚀 Ishga tushirish (Getting Started)

Loyihangizni mahalliy dev-serveringizda ishga tushirish uchun:

1. **Kerakli kutubxonalarni o'rnatish:**
   ```bash
   npm install
   ```
2. **Loyihani ishga tushirish:**
   ```bash
   npm run dev
   ```
3. **Brauzerda tekshirish:** 
Odatda `http://localhost:5173` sahifasida ochiladi.

## 🛠 Texnologiyalar (Tech Stack)

- **Frontend:** React.js, TypeScript, Vite
- **Styling:** Tailwind CSS, Tailwind Merge, Framer Motion
- **UI Elementlari:** Radix UI, Shadcn UI
- **Backend / BaaS:** Firebase (Firestore, Authentication, Storage)
- **Forma boshqaruvi:** React Hook Form, Custom validatsiyalar uchun Zod
- **So'rovlar bozori:** Tanstack React Query

## 🧹 Kod qoidalari (Linting & Build)

Kod sifatini va production levelga tayyorligini tekshirish:

- **ESLint xatoliklar tekshiruvi:**  
  ```bash
  npm run lint
  ```
- **TypeScript tekshiruvi:**  
  ```bash
  npx tsc --noEmit
  ```
- **Production uchun build:**  
  ```bash
  npm run build
  ```

> Loyiha audit qilingan va ESLint xatolaridan to'liq tozalangan.

## 📦 Fayllar tuzilmasi
- `/src/components/` — qayta ishlatiladigan UI komponentlari.
- `/src/context/` — Context API providerlari (Cart, Auth, Order va h.k).
- `/src/pages/` — umumiy sayt sahifalari.
- `/src/lib/` — turli xil utility funktsiyalar va firebase backend konfiguratsiyasi.
