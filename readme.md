โปรเจกต์ตัวอย่าง Node.js + Express + MongoDB

การใช้งานเบื้องต้น:

1. ติดตั้ง dependencies

```bash
npm install
```

2. ตั้งค่า MongoDB ในไฟล์ `.env` (หรือใช้ `MONGO_URI` เริ่มต้นที่ `mongodb://localhost:27017/homeofhearts`)

3. สร้างผู้ดูแล (admin) รหัสผ่านเป็น `12345678`

```bash
npm run seed
```

4. รันเซิร์ฟเวอร์

```bash
npm start
```

หน้าเข้าสู่ระบบอยู่ที่ http://localhost:3000/ (form ส่งไปยัง `/auth/login`)

โครงสร้างโปรเจกต์ที่แนะนำสำหรับหน้าเพิ่มเติม:

- `views/` เก็บ HTML หน้าเว็บ
- `public/css/` เก็บไฟล์ CSS
- `public/js/` เก็บไฟล์ JavaScript
- `public/images/` เก็บรูปภาพและ assets
