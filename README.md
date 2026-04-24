# 🚂 RailYatra — Train Ticket Booking System

Converted from Spring Boot + H2/JPA + Thymeleaf  
**→ Node.js + Express + MongoDB + React**

---

## 📁 Project Structure

```
train-ticket/
├── backend/          # Node.js + Express + MongoDB API
│   ├── models/       # Mongoose schemas (User, Train, Booking)
│   ├── routes/       # Express route handlers
│   ├── middleware/   # JWT auth middleware
│   ├── config/       # DB seeder (auto-creates admin)
│   └── server.js     # Entry point
│
└── frontend/         # React app
    └── src/
        ├── api/      # Axios instance with JWT interceptor
        ├── context/  # AuthContext (global auth state)
        ├── components/ # Navbar, PrivateRoute, AdminRoute
        ├── pages/    # All page components
        └── styles/   # Global CSS
```

---

## ⚡ Quick Start

### Prerequisites
- **Node.js** v18+
- **MongoDB** running locally on port 27017 (or a MongoDB Atlas URI)

---

### 1. Backend Setup

```bash
cd backend
cp .env.example .env     # Edit values as needed
npm install
npm run dev              # Starts on http://localhost:5000
```

On first start, admin user is auto-created:
- **Username:** `admin`
- **Password:** `admin123`

---

### 2. Frontend Setup

```bash
cd frontend
cp .env.example .env     # Set REACT_APP_API_URL if needed
npm install
npm start                # Starts on http://localhost:3000
```

---

## 🗺 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login → returns JWT |
| GET  | `/api/auth/me` | Get current user (protected) |

### Trains
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/trains` | List all trains |
| GET | `/api/trains/:trainNo` | Get train + booked seats |
| POST | `/api/trains` | Add train (admin) |
| PUT | `/api/trains/:trainNo` | Update train (admin) |
| DELETE | `/api/trains/:trainNo` | Delete train (admin) |

### Bookings
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bookings` | Create booking |
| GET | `/api/bookings/my` | My bookings |
| GET | `/api/bookings/:bookingId` | Get booking by ID |
| PATCH | `/api/bookings/:bookingId/pay` | Mark as paid |

### Payment
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payment/create-order` | Create Razorpay order |
| POST | `/api/payment/verify` | Verify payment signature |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Dashboard statistics |
| GET | `/api/admin/users` | List all users |
| GET | `/api/admin/bookings` | List all bookings |

---

## 🖥 Frontend Pages

| Page | Route | Access |
|------|-------|--------|
| Login | `/login` | Public |
| Register | `/register` | Public |
| Home | `/home` | User |
| Browse Trains | `/trains` | User |
| Seat Selection | `/book/:trainNo` | User |
| Payment | `/payment` | User |
| Ticket Success | `/ticket-success` | User |
| My Bookings | `/my-bookings` | User |
| Admin Dashboard | `/admin` | Admin |
| Manage Trains | `/admin/trains` | Admin |
| Add Train | `/admin/trains/add` | Admin |
| Edit Train | `/admin/trains/edit/:trainNo` | Admin |
| All Bookings | `/admin/bookings` | Admin |

---

## 💳 Payment Notes

The payment flow uses **Razorpay**:
1. Backend creates an order via `/api/payment/create-order`
2. Frontend opens Razorpay checkout popup
3. On success, frontend calls `/api/payment/verify` then `/api/bookings/:id/pay`

**For development:** Use the **"Demo Pay"** button on the payment page to skip Razorpay entirely.

**For production:** Add real Razorpay keys to `backend/.env`:
```
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=your_secret
```

---

## 🌱 Environment Variables

### Backend (`backend/.env`)
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/train-ticket
JWT_SECRET=change_this_to_a_long_random_string
RAZORPAY_KEY_ID=rzp_test_AXa5IGEOp6MUpe
RAZORPAY_KEY_SECRET=nhU0vvAMkLKST8bROMlXlZT6
CLIENT_URL=http://localhost:3000
```

### Frontend (`frontend/.env`)
```
REACT_APP_API_URL=http://localhost:5000/api
```

---

## 🚀 Production Deployment

### Backend (Railway / Render / Fly.io)
```bash
cd backend && npm install && npm start
```
Set env vars: `MONGO_URI` (Atlas), `JWT_SECRET`, `CLIENT_URL` (your frontend URL)

### Frontend (Vercel / Netlify)
```bash
cd frontend && npm install && npm run build
```
Set `REACT_APP_API_URL` to your deployed backend URL.

---

## 🎨 Design

- **Fonts:** Rajdhani (headings) + Nunito (body) — Indian railway aesthetic
- **Colors:** Deep navy (#0a1628) + orange accent (#f57c00)
- **Fully responsive** — mobile hamburger menu, fluid grids
- **Interactive seat map** — visual grid per coach, max 4 seats/booking
