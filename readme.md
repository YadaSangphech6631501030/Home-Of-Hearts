# Home of Hearts Residence

ระบบจัดการหอพัก Home of Hearts Residence สำหรับผู้ดูแลหอพักและผู้เช่า พัฒนาเป็น Web Application ด้วย Node.js, Express และ MongoDB โดยมีหน้า Admin สำหรับจัดการข้อมูลหอพัก และหน้า User สำหรับผู้เช่าใช้ดูข้อมูลของตนเอง แจ้งซ่อม ตรวจพัสดุ ดูประกาศ และชำระค่าหอพัก

## Overview

โปรเจกต์นี้แบ่งการใช้งานเป็น 2 ฝั่งหลัก

| ส่วนระบบ | ผู้ใช้งาน | หน้าที่ |
|---|---|---|
| Admin Web | สำนักงาน/ผู้ดูแลหอพัก | จัดการห้อง ผู้เช่า แจ้งซ่อม บิล พัสดุ ประกาศ และข้อมูลติดต่อ |
| User Web | ผู้เช่า | ดู dashboard ส่วนตัว แจ้งซ่อม ดูบิล พัสดุ ประกาศ และติดต่อหอพัก |
| Backend API | ระบบ | ให้บริการ API, เชื่อมต่อ MongoDB, login และจัดการ session token |

## Main Features

### Admin

- Dashboard สรุปข้อมูลจริงจากระบบหอพัก แจ้งซ่อม เงินหอพัก พัสดุ และประกาศ
- ระบบหอพัก 3 ชั้น พร้อมสถานะห้อง ว่าง/ไม่ว่าง และหน้ารายละเอียดผู้เช่า
- สร้างบัญชีผู้เช่าและผูกข้อมูลกับห้องพัก
- แก้ไขข้อมูลผู้เช่า ย้ายออก และดูประวัติผู้เช่า
- ระบบแจ้งซ่อม พร้อมเปลี่ยนสถานะ วันนัดหมาย วันเสร็จสิ้น ดูรายละเอียด และลบรายการ
- ระบบเงินหอพัก สร้างรอบบิล สร้างบิลรายห้อง และจัดการข้อมูลบิล
- ระบบพัสดุ เพิ่ม/แก้ไข/ลบ/ดูรูปพัสดุ พร้อมสถานะรอรับหรือเสร็จสิ้น
- ระบบประกาศ เพิ่มและลบประกาศเพื่อส่งให้ผู้เช่า
- ระบบติดต่อ จัดการข้อมูลติดต่อและ QR Code ของหอพัก

### User

- หน้า dashboard ผู้เช่าพร้อมข้อมูลแจ้งเตือน พัสดุ แจ้งซ่อม และประกาศ
- ดูข้อมูลติดต่อจากข้อมูลจริงที่ admin ตั้งไว้
- แจ้งซ่อมและส่งข้อมูลเข้าหลังบ้านให้ admin เห็นในระบบแจ้งซ่อม
- ดูค่าหอพักล่าสุดจากบิลที่ admin สร้าง
- เปิด popup QR Code สำหรับชำระเงิน และดูหน้าประวัติการชำระ
- ดูพัสดุของตนเองจากข้อมูลที่ admin เพิ่มในระบบพัสดุ
- ดูประกาศจากทางหอพัก และระบบแจ้งเตือนเมื่อมีประกาศใหม่

## Resume Highlights

- Full-stack dormitory management web application using Node.js, Express, MongoDB, HTML, CSS and vanilla JavaScript
- Role-based experience for admin and tenant users with signed session tokens
- Real MongoDB-backed workflows for rooms, tenants, maintenance requests, billing, parcels, announcements and contact information
- Admin dashboard aggregates live data across modules for operational overview
- Tenant dashboard shows room-specific billing, parcels, maintenance status, announcements and contact data
- Responsive Thai-language UI designed from custom dashboard mockups
- Environment-based configuration with `.env` and a smoke test script for endpoint verification

## Project Structure

```text
Home-Of-Hearts/
├── server.js                  # Express server, MongoDB schemas, API routes
├── seedAdmin.js               # seed admin user เริ่มต้น
├── models/
│   ├── User.js                # User model สำหรับ admin/user login
│   └── Room.js                # Room model
├── public/
│   ├── admin/                 # หน้า HTML ฝั่ง admin
│   ├── user/                  # หน้า HTML ฝั่ง user
│   ├── css/                   # stylesheet ของแต่ละหน้า
│   ├── js/                    # frontend JavaScript และ API helper
│   └── images/                # รูปภาพและ assets
├── package.json
├── package-lock.json
└── README.md
```

## Requirements

- Node.js และ npm
- MongoDB
- Browser สำหรับเปิดใช้งานระบบ

## Environment Configuration

ระบบอ่านค่าจาก environment variable และมีค่าเริ่มต้นบางส่วนใน `server.js`

| Key | จำเป็น | ค่าเริ่มต้น | คำอธิบาย |
|---|---|---|---|
| `SESSION_SECRET` | ใช่ | ไม่มี | secret สำหรับ sign session token ถ้าไม่ตั้ง server จะไม่เริ่มทำงาน |
| `MONGO_URI` | ไม่บังคับ | `mongodb://localhost:27017/homeofhearts` | MongoDB connection string |
| `PORT` | ไม่บังคับ | `3000` | พอร์ตของ server |

สร้างไฟล์ `.env` จากตัวอย่าง

```bash
cp .env.example .env
```

จากนั้นแก้ค่าใน `.env` ให้ตรงกับเครื่องที่ใช้งาน

```env
SESSION_SECRET=change-me-to-a-long-random-secret
MONGO_URI=mongodb://localhost:27017/homeofhearts
PORT=3000
```

> ไฟล์ `.env` เป็นไฟล์ลับของเครื่อง local และถูก ignore ใน git แล้ว ห้าม commit ไฟล์นี้

## Installation

ติดตั้ง dependencies

```bash
npm install
```

ถ้าเจอ error `Cannot find module 'bcryptjs'` ให้ติดตั้ง dependencies ใหม่ด้วยคำสั่งด้านบน เพราะโปรเจกต์ใช้ `bcryptjs` สำหรับ hash และตรวจรหัสผ่าน

## Seed Admin User

สร้างผู้ดูแลระบบเริ่มต้น

```bash
npm run seed
```

คำสั่งนี้จะใช้ `seedAdmin.js` เพื่อสร้างบัญชี admin ใน MongoDB ตามค่าที่กำหนดไว้ในไฟล์ seed

> ควรตรวจข้อมูลใน `seedAdmin.js` ก่อนใช้งานจริง และเปลี่ยนรหัสผ่านหลัง seed เสร็จ

## Run Project

รัน server หลังตั้งค่า `.env` แล้ว

```bash
npm start
```

หลังรันสำเร็จ ระบบจะอยู่ที่

```text
http://localhost:3000/
```

หน้า login หลักอยู่ที่

```text
http://localhost:3000/
```

## Main Pages

### Admin Pages

| Page | Path | รายละเอียด |
|---|---|---|
| Dashboard | `/admin/index.html` | สรุปภาพรวมระบบทั้งหมด |
| Contact | `/admin/contact.html` | แก้ไขข้อมูลติดต่อและ QR Code |
| Dormitory | `/admin/dormitory.html` | ดูแผนผังห้องพักและสถานะห้อง |
| Room Detail | `/admin/room-detail.html` | ดูและจัดการข้อมูลผู้เช่ารายห้อง |
| Create Tenant | `/admin/create-tenant.html` | สร้างบัญชีผู้เช่า |
| Maintenance | `/admin/maintenance.html` | จัดการคำขอแจ้งซ่อม |
| Billing | `/admin/billing.html` | สร้างรอบบิลและบิลรายห้อง |
| Parcels | `/admin/parcels.html` | จัดการพัสดุและรูปพัสดุ |
| Announcements | `/admin/announcements.html` | จัดการประกาศหอพัก |
| Account | `/admin/account.html` | ข้อมูลบัญชี admin |

### User Pages

| Page | Path | รายละเอียด |
|---|---|---|
| Dashboard | `/user/index.html` | หน้าแรกของผู้เช่า |
| Contact | `/user/contact.html` | ข้อมูลติดต่อจาก admin |
| Maintenance | `/user/maintenance.html` | แจ้งซ่อม |
| Billing | `/user/billing.html` | ดูค่าหอพักและชำระเงิน |
| Billing History | `/user/billing-history.html` | ประวัติการชำระค่าหอพัก |
| Parcels | `/user/parcels.html` | พัสดุของผู้เช่า |
| Announcements | `/user/announcements.html` | ประกาศจากหอพัก |

## API Overview

| Route | Method | รายละเอียด |
|---|---|---|
| `/auth/login` | POST | login admin/user และออก session token |
| `/api/me` | GET | ดึงข้อมูลบัญชีปัจจุบัน |
| `/api/dashboard/summary` | GET | สรุปข้อมูลจริงสำหรับ admin dashboard |
| `/api/contact` | GET/PUT | อ่านและแก้ไขข้อมูลติดต่อ |
| `/api/rooms` | GET | อ่านรายการห้องทั้งหมด |
| `/api/rooms/:roomNumber` | GET/PUT | อ่านและแก้ไขข้อมูลห้อง |
| `/api/rooms/:roomNumber/tenant-account` | POST | สร้างบัญชีผู้เช่าและผูกกับห้อง |
| `/api/rooms/:roomNumber/checkout` | POST | ย้ายผู้เช่าออกจากห้อง |
| `/api/maintenance` | GET/POST | อ่านและสร้างรายการแจ้งซ่อม |
| `/api/maintenance/:id` | PUT/DELETE | แก้ไขหรือลบรายการแจ้งซ่อม |
| `/api/billing-cycles` | GET | อ่านรอบบิล |
| `/api/billings/batch` | POST | สร้างรอบบิล |
| `/api/billings` | GET/POST | อ่านและสร้างบิล |
| `/api/billings/:id` | PUT/DELETE | แก้ไขหรือลบบิล |
| `/api/parcels` | GET/POST | อ่านและเพิ่มพัสดุ |
| `/api/parcels/:id` | PUT/DELETE | แก้ไขหรือลบพัสดุ |
| `/api/announcements` | GET/POST | อ่านและสร้างประกาศ |
| `/api/announcements/:id` | DELETE | ลบประกาศ |
| `/api/user/home-data` | GET | ข้อมูลหน้าแรกของ user |
| `/api/user/billing-data` | GET | ข้อมูลบิลล่าสุดของ user |
| `/api/user/billing-history` | GET | ประวัติบิลของ user |
| `/api/user/parcels` | GET | พัสดุของ user |

## Data Collections

ระบบใช้ MongoDB collections หลักดังนี้

| Collection/Model | ใช้สำหรับ |
|---|---|
| `users` | บัญชี admin และผู้เช่า |
| `rooms` | ข้อมูลห้องพักและข้อมูลผู้เช่าที่ผูกกับห้อง |
| `maintenances` | รายการแจ้งซ่อม |
| `billings` | บิลค่าหอพักรายห้อง |
| `billingcycles` | รอบบิล |
| `parcels` | รายการพัสดุ |
| `announcements` | ประกาศจากหอพัก |
| `contactinfos` | ข้อมูลติดต่อและ QR Code |

## Development Notes

- ต้องรัน MongoDB ก่อนเริ่ม `npm start`
- ต้องมีไฟล์ `.env` หรือ environment variable ที่ตั้งค่า `SESSION_SECRET` ก่อนรัน server
- ถ้าเปลี่ยน schema ใน `server.js` หรือ `models/` ควรตรวจ route ที่เกี่ยวข้องด้วย
- รูปพัสดุถูกเก็บเป็น `imageUrl` ในข้อมูลพัสดุ จึงควรใช้รูปขนาดพอดี ไม่ใหญ่เกินจำเป็น
- หลีกเลี่ยงการ commit `node_modules/`, `.env`, ไฟล์ cache และไฟล์ที่มี secret จริง
- ถ้ามีข้อมูล MongoDB สำคัญหลายโปรเจกต์ ควรตรวจ `MONGO_URI` ให้ถูก database ก่อน seed หรือแก้ข้อมูล

## Useful Commands

```bash
# ติดตั้ง dependencies
npm install

# seed admin user
npm run seed

# สร้างไฟล์ env สำหรับ local
cp .env.example .env

# รัน server
npm start

# smoke test endpoint สำคัญหลังเปิด server แล้ว
npm run smoke:test
```

## Smoke Test

โปรเจกต์มี smoke test แบบไม่แก้ไขข้อมูลในฐานข้อมูล อยู่ที่ `scripts/smoke-test.js` ใช้สำหรับตรวจว่า server, หน้าเว็บหลัก, public API และ protected API สำคัญยังตอบได้ถูกต้อง

รัน server ก่อนใน terminal แรก

```bash
npm start
```

จากนั้นรัน smoke test ใน terminal อีกหน้าหนึ่ง

```bash
npm run smoke:test
```

คำสั่งด้านบนจะทดสอบเฉพาะ public pages/API และตรวจว่า admin endpoint ที่ไม่มี token ถูกปฏิเสธด้วย `403`

ถ้าต้องการทดสอบ flow login admin/user ด้วย ให้ส่ง credential ผ่าน environment variable โดยไม่ต้องเขียนรหัสผ่านลงใน repo

```bash
SMOKE_ADMIN_USERNAME="admin@example.com" \
SMOKE_ADMIN_PASSWORD="your-admin-password" \
SMOKE_USER_USERNAME="101" \
SMOKE_USER_PASSWORD="your-user-password" \
SMOKE_ROOM_NUMBER="101" \
npm run smoke:test
```

> ห้าม commit password จริงลง README, source code หรือไฟล์ใด ๆ ใน git

