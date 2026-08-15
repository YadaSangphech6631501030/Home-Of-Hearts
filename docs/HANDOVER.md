# Handover Guide

เอกสารนี้ใช้สำหรับส่งต่อโปรเจกต์ Home of Hearts Residence ให้คนอื่นดูแลหรือรันต่อ

## System Overview

Home of Hearts Residence เป็น Web Application สำหรับจัดการหอพัก มี 3 ส่วนหลัก

| ส่วน | รายละเอียด |
|---|---|
| Admin Web | จัดการห้อง ผู้เช่า แจ้งซ่อม บิล พัสดุ ประกาศ และข้อมูลติดต่อ |
| User Web | ผู้เช่าดูข้อมูลห้อง แจ้งซ่อม ดูบิล พัสดุ ประกาศ และข้อมูลติดต่อ |
| Backend API | Express API, authentication, MongoDB connection และ business logic |

## Tech Stack

- Node.js
- Express
- MongoDB
- Mongoose
- HTML/CSS/vanilla JavaScript
- Docker Compose

## Important Files

| Path | รายละเอียด |
|---|---|
| `server.js` | Express server, API routes และ schemas หลัก |
| `models/` | User และ Room model |
| `public/admin/` | หน้า HTML ฝั่ง admin |
| `public/user/` | หน้า HTML ฝั่ง user |
| `public/js/` | JavaScript ฝั่งหน้าเว็บ |
| `public/css/` | CSS ของแต่ละหน้า |
| `seedAdmin.js` | สร้างบัญชี admin |
| `seedRooms.js` | สร้างห้อง 3 ชั้น |
| `Dockerfile` | Docker image ของ app |
| `docker-compose.yml` | เปิด app + MongoDB |

## Required Environment

```env
SESSION_SECRET=change-me-to-a-long-random-secret
MONGO_URI=mongodb://localhost:27017/homeofhearts
PORT=3000
```

`SESSION_SECRET` จำเป็นต้องตั้งค่า ไม่อย่างนั้น server จะไม่เริ่มทำงาน

## Local Run Checklist

1. ติดตั้ง Node.js และ MongoDB
2. รัน `npm install`
3. สร้าง `.env` จาก `.env.example`
4. ตั้งค่า `SESSION_SECRET`
5. รัน MongoDB
6. รัน `npm run seed`
7. รัน `npm run seed:rooms`
8. รัน `npm start`
9. เปิด `http://localhost:3000/`
10. รัน `npm run smoke:test`

## Docker Run Checklist

1. ติดตั้ง Docker Desktop
2. รัน `docker compose up --build`
3. เปิด `http://localhost:3000/`
4. seed ข้อมูลผ่าน container ถ้าต้องการ

```bash
docker compose exec app npm run seed
docker compose exec app npm run seed:rooms
```

## Data Safety

- ห้าม commit `.env`
- ห้าม commit `node_modules/`
- ก่อน seed ให้ตรวจ `MONGO_URI` ทุกครั้ง
- คำสั่ง `docker compose down -v` จะลบข้อมูล MongoDB volume
- ถ้ามีข้อมูลจริง ควร backup MongoDB ก่อนลบหรือ seed

## Smoke Test

หลังเปิด server แล้วรัน

```bash
npm run smoke:test
```

ถ้าต้องการทดสอบ login ให้ส่ง credential ผ่าน environment variable ตาม README

## Known Limitations

- ระบบชำระเงินเป็น popup QR Code ยังไม่ใช่ payment gateway จริง
- Notification เป็น in-app notification ไม่ใช่ push notification หรือ real-time WebSocket
- รูปพัสดุใช้ `imageUrl` ยังไม่มีระบบ file upload storage แยก
- ระบบออกแบบสำหรับ demo/local หรือ prototype ยังไม่ใช่ production deployment เต็มรูปแบบ
