# StayInsight AI

StayInsight AI is a modern web application that helps businesses analyze customer reviews using AI-powered insights. The platform provides a clean dashboard, review management system, and responsive user interface designed to transform customer feedback into actionable information.

---

## 🚀 Features

### Week 2 Features
- Responsive Navbar
- Hero Section with Call-to-Action
- Reusable Review Card Component
- Footer Component
- React Router Navigation
- Multiple Page Routes
- Responsive Design with Tailwind CSS

### Week 3 Features
- Reusable UI Component Library (Button, Input, Modal, Toast, Loader)
- Dark/Light Mode Toggle
- Theme Persistence using Local Storage
- Responsive Layout Support
- UI Showcase Page

### Week 4 Features (Backend)
- Node.js + Express REST API
- In-memory data store (no database required)
- Full CRUD for Reviews
- Authentication endpoint
- Dashboard stats endpoint
- Search endpoint
- CORS enabled
- dotenv configuration
- Proper HTTP status codes (200, 201, 204, 400, 401, 404, 500)
- JSON error responses `{ success, message }`
- Request logger middleware
- Global error handler middleware

---

## 📂 Project Structure

```text
StayInsight AI/
├── backend/                  ← Week 4: Node.js/Express backend
│   ├── server.js             ← Entry point
│   ├── .env.example          ← Environment variable template
│   ├── package.json
│   ├── routes/
│   │   ├── auth.js           ← POST /api/login
│   │   ├── dashboard.js      ← GET  /api/dashboard
│   │   └── reviews.js        ← CRUD + search for reviews
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── dashboardController.js
│   │   └── reviewsController.js
│   ├── middleware/
│   │   ├── errorHandler.js   ← 404 + global error handler
│   │   └── requestLogger.js  ← Request/response logger
│   └── data/
│       └── store.js          ← In-memory arrays (no DB)
│
└── src/                      ← React frontend (Weeks 2–3)
    ├── components/
    │   ├── Navbar.jsx
    │   ├── Hero.jsx
    │   ├── ReviewCard.jsx
    │   ├── Footer.jsx
    │   └── ui/
    │       ├── Button.jsx
    │       ├── Input.jsx
    │       ├── Modal.jsx
    │       ├── Toast.jsx
    │       ├── Loader.jsx
    │       └── index.js
    ├── pages/
    │   ├── Home.jsx
    │   ├── Dashboard.jsx
    │   ├── Reviews.jsx
    │   ├── Login.jsx
    │   └── UIShowcase.jsx
    ├── context/
    │   └── ThemeContext.jsx
    ├── App.jsx
    └── main.jsx
```

---

## 🛠️ Backend Setup

### Prerequisites
- Node.js v18+

### Install Dependencies
```bash
cd backend
npm install
```

### Configure Environment
```bash
cp .env.example .env
# Edit .env if needed (default PORT=5000)
```

### Run Backend

**Development (with auto-reload):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

The API will be available at `http://localhost:5000`.

---

## 🌐 REST API Endpoints

| Method | Endpoint                        | Description              |
|--------|---------------------------------|--------------------------|
| GET    | `/`                             | API health check         |
| POST   | `/api/login`                    | Authenticate user        |
| GET    | `/api/dashboard`                | Dashboard statistics     |
| GET    | `/api/reviews`                  | List all reviews         |
| GET    | `/api/reviews/search?q=<query>` | Search reviews           |
| GET    | `/api/reviews/:id`              | Get single review        |
| POST   | `/api/reviews`                  | Create a review          |
| PUT    | `/api/reviews/:id`              | Update a review          |
| DELETE | `/api/reviews/:id`              | Delete a review          |

### Demo Credentials (POST /api/login)
```json
{ "email": "admin@stayinsight.ai", "password": "password123" }
```

### Create Review Body (POST /api/reviews)
```json
{
  "guestName": "Jane Doe",
  "property": "Ocean View Villa",
  "rating": 5,
  "comment": "Amazing stay!",
  "tags": ["cleanliness", "location"],
  "sentiment": "positive"
}
```

---

## 💻 Run Frontend

```bash
# From project root (StayInsight AI/)
npm install
npm run dev
```

Frontend runs at `http://localhost:5173` by default.
