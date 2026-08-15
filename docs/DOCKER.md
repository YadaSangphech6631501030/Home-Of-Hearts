# Docker Guide

คู่มือนี้ใช้สำหรับรันระบบ Home of Hearts Residence ด้วย Docker Compose โดยมี 2 services หลักคือ `app` และ `mongo`

## Requirements

- Docker Desktop
- Docker Compose

## Files

| File | ใช้สำหรับ |
|---|---|
| `Dockerfile` | build Node.js app image |
| `docker-compose.yml` | เปิด app และ MongoDB พร้อมกัน |
| `.dockerignore` | กันไฟล์ที่ไม่จำเป็นไม่ให้เข้า image |
| `.env.example` | ตัวอย่างค่า environment สำหรับ local |

## Start System

รันจาก root project

```bash
docker compose up --build
```

หลังรันสำเร็จ เปิดระบบที่

```text
http://localhost:3000/
```

## Seed Data

เปิด terminal อีกหน้าหนึ่ง แล้วรัน seed ผ่าน container

```bash
docker compose exec app npm run seed
docker compose exec app npm run seed:rooms
```

ถ้าต้องการ seed ชุดข้อมูลตัวอย่างอื่น ให้รันเพิ่มตามต้องการ

```bash
docker compose exec app npm run seed:billing
docker compose exec app npm run seed:parcels
docker compose exec app npm run seed:maintenance
```

หมายเหตุ: seed บางตัวจะลบข้อมูลเดิมใน collection นั้นก่อนสร้างข้อมูลตัวอย่าง ควรใช้เฉพาะตอนเตรียม demo หรือเริ่มระบบใหม่

## Smoke Test

หลังระบบเปิดแล้ว สามารถตรวจ endpoint หลักได้ด้วย

```bash
npm run smoke:test
```

ถ้าจะรัน smoke test จากเครื่อง host แต่ app อยู่ใน Docker ให้ใช้ URL ค่าเริ่มต้น `http://localhost:3000` ได้เลย

## Stop System

หยุด container แต่เก็บข้อมูล MongoDB ไว้

```bash
docker compose down
```

หยุด container และลบข้อมูล MongoDB volume

```bash
docker compose down -v
```

## Environment

ใน `docker-compose.yml` app จะใช้ค่า:

```env
SESSION_SECRET=change-me-in-docker-env
MONGO_URI=mongodb://mongo:27017/homeofhearts
PORT=3000
```

สำหรับใช้งานจริงควรสร้างไฟล์ `.env` ของ Docker แล้วตั้งค่า `SESSION_SECRET` ใหม่ให้ยาวและเดายาก

## Troubleshooting

- ถ้า app เข้า MongoDB ไม่ได้ ให้เช็กว่า service `mongo` healthy แล้ว
- ถ้า port ชน ให้แก้ฝั่งซ้ายของ `ports` เช่น `"3001:3000"`
- ถ้า login ไม่ได้หลังเปิดระบบใหม่ ให้รัน `docker compose exec app npm run seed`
- ถ้าข้อมูลหายหลัง `docker compose down -v` เป็นเรื่องปกติ เพราะคำสั่งนี้ลบ volume ของ MongoDB
