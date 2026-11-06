# MED ASISTANT

Tibbiyot talabalari va shifokorlar uchun bilim platformasi. Internetsiz ham ishlaydi (PWA).

## Ishga tushirish
Saytni istalgan statik hostingga joylang (GitHub Pages, Netlify, Vercel, oddiy server) yoki kompyuterda:

    cd med-assistant
    python3 -m http.server 8080
    # brauzerda: http://localhost:8080

Bir marta internet bilan ochilgandan so'ng sayt qurilmada keshlanadi va internetsiz ishlaydi.
Telefonda brauzer menyusidan "Bosh ekranga qo'shish" orqali ilova sifatida o'rnatish mumkin.

## Admin panel
Menyudagi "Admin" → boshlang'ich parol `admin123` (Sozlamalarda o'zgartiring).

## Fayldan savol kiritish
Test (4 variant):
    1. Savol matni?
    A) variant
    B) variant
    C) variant
    D) variant
    Javob: B
(yoki to'g'ri variant oldiga `*` qo'ying). Excel: Savol | A | B | C | D | Javob

Yozma / Zakovat:
    1. Savol matni?
    Javob: javob matni
Excel: Savol | Javob

## Muhim
- Ma'lumotlar har bir qurilmaning brauzerida (IndexedDB) saqlanadi. Admin kiritgan savollarni boshqa qurilmalarga
  o'tkazish uchun Admin → Sozlamalar → Eksport/Import dan foydalaning. Barcha foydalanuvchilar uchun umumiy baza kerak
  bo'lsa, keyingi bosqichda server (backend) qo'shiladi.
- Anamnezdagi sun'iy intellekt internet va Anthropic API kalitini talab qiladi (Admin → Sozlamalar).
  Internet bo'lmasa ichki bilim bazasi asosida taxminiy tahlil beriladi.
