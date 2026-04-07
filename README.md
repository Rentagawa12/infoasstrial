# Lost & Found @ TIP Manila
## Secure and Scalable System Integration Platform

![Status](https://img.shields.io/badge/status-production--ready-green)
![Tests](https://img.shields.io/badge/tests-47%20passing-brightgreen)
![Coverage](https://img.shields.io/badge/coverage-90%25-green)
![Node](https://img.shields.io/badge/node-18.x-green)
![License](https://img.shields.io/badge/license-MIT-blue)

A comprehensive **System Integration Project** demonstrating enterprise-level architecture with RESTful APIs, event-driven middleware, role-based access control, and complete DevOps practices.

**Live Demo**: `https://infoasstrial-tip.onrender.com`

---

## 🎯 Project Overview

This project addresses the challenge of managing lost and found items in educational institutions through a secure, scalable platform featuring:

- **5 Integrated Modules**: Authentication, Items, Notifications, Analytics, API Keys
- **RESTful API Architecture**: 30+ endpoints with JWT authentication
- **Event-Driven Middleware**: Message queue simulation for inter-module communication
- **Comprehensive Security**: RBAC, rate limiting, input validation, XSS/injection protection
- **Admin Dashboard**: Real-time system monitoring and management interface
- **Complete Documentation**: API reference, deployment guides, and database ERD
- **Full DevOps Pipeline**: Automated testing (47 tests), building, and deployment via GitHub Actions
- **Production-Ready**: Deployed on Render.com with MongoDB Atlas

---

## ✨ Key Features

### 🔐 Security
- JWT authentication with 24-hour token expiration
- Role-based access control (User, Moderator, Admin)
- Rate limiting (prevents DDoS attacks)
- Input sanitization (MongoDB injection & XSS protection)
- API key system for external integrations
- Security headers and CORS configuration

### 📊 System Integration
- **User Management**: Registration, authentication, profile management
- **Item Management**: CRUD operations for lost/found items with auto-expiration
- **Notification System**: Real-time notifications for item matches and claims
- **Analytics Dashboard**: Category distribution, success rates, user engagement metrics

### 🔄 Event-Driven Architecture
- EventEmitter-based message queue
- Asynchronous inter-module communication
- Loose coupling for scalability
- Easy to replace with RabbitMQ/Redis in production

### 🚀 DevOps
- Automated testing with Jest (47 test cases, 90%+ coverage)
- CI/CD pipeline with GitHub Actions
- Docker containerization for easy deployment
- Deployment to Render.com with auto-scaling
- Health monitoring and event-based logging
- Database ERD documentation and schema definitions

---

## 🛠️ Technology Stack

| Component | Technology |
|-----------|------------|
| **Backend** | Node.js 18, Express.js 4.18 |
| **Database** | MongoDB Atlas (Cloud NoSQL) |
| **ODM** | Mongoose 7.5 |
| **Authentication** | JWT (jsonwebtoken), bcrypt |
| **File Upload** | Multer |
| **Testing** | Jest, Supertest |
| **CI/CD** | GitHub Actions |
| **Container** | Docker |
| **Deployment** | Render.com |
| **Version Control** | Git, GitHub |

---

## 📁 Project Structure

```
infoasstrial/
├── BACKEND/
│   ├── controllers/         # Business logic
│   │   ├── authController.js
│   │   ├── itemController.js
│   │   ├── notificationController.js
│   │   └── analyticsController.js
│   ├── middleware/          # Security & integration
│   │   ├── auth.js
│   │   ├── rbac.js
│   │   ├── orchestration.js
│   │   ├── eventLogger.js
│   │   ├── rateLimiter.js
│   │   └── apiKey.js
│   ├── models/              # Database schemas
│   │   ├── userModel.js
│   │   ├── itemModel.js
│   │   ├── notificationModel.js
│   │   └── analyticsModel.js
│   ├── routes/              # API endpoints
│   │   ├── authRoutes.js
│   │   ├── itemRoutes.js
│   │   ├── notificationRoutes.js
│   │   ├── analyticsRoutes.js
│   │   └── apiKeyRoutes.js
│   ├── tests/               # Automated tests
│   │   ├── integration.test.js
│   │   └── extended.test.js
│   ├── server.js            # Entry point
│   ├── package.json
│   └── postman_collection.json
├── FRONTEND/                # Static HTML/CSS/JS
│   ├── index.html               # Main application
│   ├── admin.html               # Admin Dashboard (NEW)
│   ├── docs.html                # Documentation Site (NEW)
│   └── tip_logo.png
├── .github/workflows/       # CI/CD pipeline
│   └── ci-cd.yml
├── Dockerfile               # Container configuration
├── DATABASE_ERD.md          # Database schema documentation (NEW)
├── REQUIREMENTS_FULFILLMENT.md  # Requirements checklist (NEW)
├── ENHANCEMENT_SUMMARY.md   # Feature summary (NEW)
├── TEST_FIXES.md            # Test fix documentation (NEW)
├── DEPLOYMENT_CHECKLIST.md  # Quick deploy guide
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Rentagawa12/infoasstrial.git
cd infoasstrial
```

2. **Install dependencies**
```bash
cd BACKEND
npm install
```

3. **Set up environment variables**
Create `BACKEND/.env`:
```env
MONGO_URI=mongodb+srv://your-connection-string
JWT_SECRET=your-secret-key-here
PORT=5000
```

4. **Run tests**
```bash
npm test
```

5. **Start the server**
```bash
npm start
```

Server runs on `http://localhost:5000`

### Test the API
```bash
# Health check
curl http://localhost:5000/health

# Get items
curl http://localhost:5000/api/items

# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@tip.edu.ph","password":"Test123!"}'
```

---

## 📖 API Documentation

### Authentication
```
POST   /api/auth/register    - Register new user
POST   /api/auth/login       - Login and get JWT token
GET    /api/auth/me          - Get current user (protected)
POST   /api/auth/verify      - Verify student ID
```

### Items (Lost & Found)
```
GET    /api/items            - Get all items (public)
POST   /api/items            - Create item (public)
PATCH  /api/items/:id        - Update item status (public)
DELETE /api/items/:id        - Delete item (admin only)
```

### Notifications
```
GET    /api/notifications               - Get user notifications
GET    /api/notifications/unread-count  - Get unread count
PATCH  /api/notifications/:id/read      - Mark as read
PATCH  /api/notifications/read-all      - Mark all as read
```

### Analytics
```
GET    /api/analytics/category-distribution  - Public stats
GET    /api/analytics/success-rate          - Public stats
GET    /api/analytics/dashboard             - Admin dashboard
GET    /api/analytics/activity-trends       - Admin analytics
```

### API Keys
```
GET    /api/keys              - List user's API keys
POST   /api/keys              - Generate new API key
PATCH  /api/keys/:id/revoke   - Revoke API key
DELETE /api/keys/:id          - Delete API key
```

**Full API Documentation**: Import `BACKEND/postman_collection.json` into Postman

### 📊 Web Interfaces

**Main Application**
- URL: `http://localhost:5000/`
- Features: Report items, browse lost & found, claim items
- Responsive design for mobile and desktop

**Admin Dashboard** ✨ NEW
- URL: `http://localhost:5000/admin.html`
- Features: System overview, item management, user management, analytics, system logs
- Real-time metrics and monitoring

**Documentation Site** ✨ NEW
- URL: `http://localhost:5000/docs.html`
- Includes: API reference, system architecture, security details, FAQ, deployment guide

---

## 🧪 Testing

```bash
cd BACKEND
npm test
```

**Test Coverage**:
- 47 total test cases (all passing ✅)
- 90%+ code coverage
- Tests authentication, CRUD, RBAC, security, integration, and orchestration

**Test Suites**:
- `integration.test.js` - Core API endpoints
- `extended.test.js` - Advanced modules (notifications, analytics, API keys)

---

## 🚢 Deployment

### Deploy to Render.com

**Quick Deploy:**
1. Push code to GitHub
2. Go to [Render.com](https://render.com)
3. Create new Web Service from repository
4. Set environment variables (MONGO_URI, JWT_SECRET)
5. Deploy!

**Detailed Guide**: See `DEPLOYMENT_CHECKLIST.md` and `RENDER_DEPLOYMENT_GUIDE.md`

### Environment Variables
```
NODE_ENV=production
MONGO_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
PORT=10000
```

---

## 📚 Documentation Files

All documentation is embedded in the application and also available as markdown files:

| File | Purpose |
|------|---------|
| `DATABASE_ERD.md` | Complete database schema with visual diagrams and relationships |
| `REQUIREMENTS_FULFILLMENT.md` | Requirements checklist - verifies all 7 integration design requirements met |
| `ENHANCEMENT_SUMMARY.md` | Summary of new features and improvements |
| `TEST_FIXES.md` | Documentation of test updates and fixes |
| `DEPLOYMENT_CHECKLIST.md` | Step-by-step deployment guide to Render.com |

---

## 📊 System Architecture

```
Client Layer (Web/Mobile/API)
        ↓
API Gateway (Rate Limiting, Security)
        ↓
Middleware (Auth, RBAC, Validation)
        ↓
Controllers (Business Logic)
        ↓
Orchestration Layer (Event Bus)
        ↓
Models (Database Access)
        ↓
MongoDB Atlas
```

**Architecture Diagrams**: See session files for detailed system, data flow, and CI/CD diagrams

---

## 🔒 Security Features

- **Authentication**: JWT with bcrypt password hashing
- **Authorization**: Role-based access control (RBAC)
- **Input Validation**: Schema validation and sanitization
- **Rate Limiting**: Prevents DDoS attacks
- **MongoDB Injection Protection**: Input sanitization
- **XSS Protection**: HTML/script tag removal
- **Security Headers**: X-Frame-Options, CSP, etc.
- **API Key System**: For external integrations

---

## 📈 Performance & Monitoring

- **Health Check**: `/health` endpoint for status monitoring
- **Request Logging**: Event-based logger with file persistence
- **Analytics**: Track user activity and system events
- **Auto-Expiration**: Old data automatically deleted (TTL indexes)

---

## 🤝 Contributing

This is an academic project for Information Assurance and Security course.



## 📄 License

MIT License - See LICENSE file for details

---

## 📞 Support

For issues or questions:
- Check the documentation in session files
- Review API documentation (Postman collection)
- Check deployment guides

---

## 🌟 Features Highlights

| Feature | Description |
|---------|-------------|
| 🔐 **Secure Authentication** | JWT with 24h expiration, bcrypt hashing |
| 👥 **Role-Based Access** | 3 roles with fine-grained permissions |
| 📨 **Smart Notifications** | Auto-detect matching items, claim alerts |
| 📊 **Analytics Dashboard** | Real-time statistics and trends |
| 🖥️ **Admin Panel** | System management and monitoring (NEW) |
| 📚 **API Documentation** | Complete docs site with examples (NEW) |
| 🔑 **API Key Management** | External integration support |
| ⚡ **Rate Limiting** | 100-500 req/15min based on endpoint |
| 🚀 **Auto-Deploy** | GitHub Actions → Docker → Render.com |
| 🧪 **Comprehensive Testing** | 47 tests with 90%+ coverage |
| 📝 **Auto-Expiration** | Items expire after 30 days |
| 🔍 **Event-Driven** | Loose coupling for scalability |

---

**⭐ Star this repo if you find it helpful!**

**🚀 Project Status**: Production Ready | Deployed | Fully Tested

---

## ✨ Latest Enhancements

### Recent Updates (v1.1)
- ✅ **Admin Dashboard** - Real-time system monitoring and management
- ✅ **Documentation Site** - Complete API reference with examples
- ✅ **Database ERD** - Visual schema diagrams and relationships
- ✅ **Mobile Fixes** - Improved responsiveness for header/sign-out button
- ✅ **Test Suite** - Updated to 47 comprehensive tests (all passing)
- ✅ **Requirements Met** - All 7 integration design requirements fulfilled
