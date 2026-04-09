# Lost & Found API Documentation

**Base URL**: `https://infoassproj.onrender.com/api`

## Authentication
All protected endpoints require JWT token in header:
```
Authorization: Bearer {token}
```

---

## Auth Endpoints

### Register
- **POST** `/auth/register`
- **Auth**: Not required
- **Body** (`application/json`):
  ```json
  {
    "username": "john_doe",
    "email": "john@tip.edu.ph",
    "password": "SecurePass123"
  }
  ```
- **Response** (201):
  ```json
  {
    "message": "User registered successfully",
    "token": "eyJhbGc...",
    "user": { "id": "...", "username": "john_doe", "email": "john@tip.edu.ph", "role": "user" }
  }
  ```

### Login
- **POST** `/auth/login`
- **Auth**: Not required
- **Body**: `{ "email": "john@tip.edu.ph", "password": "SecurePass123" }`
- **Response** (200): Same as register

### Get Current User
- **GET** `/auth/me`
- **Auth**: Required
- **Response** (200): `{ "_id": "...", "username": "...", "email": "...", "role": "..." }`

---

## Item Endpoints

### Get All Items
- **GET** `/items?status=lost&q=phone`
- **Auth**: Not required
- **Query Params**: `status` (lost/found/claimed), `q` (search term)
- **Response** (200): Array of items

### Create Item
- **POST** `/items`
- **Auth**: Required
- **Body** (`multipart/form-data`):
  - `itemName`, `description`, `category`, `dateLostOrFound`, `status`, `contactInfo`, `studentId`, `studentName`
  - `image` (optional, 5MB max)
- **Response** (201): Created item object

### Update Item Status
- **PATCH** `/items/{itemId}`
- **Auth**: Required
- **Body**: `{ "status": "claimed" }`
- **Response** (200): Updated item

### Delete Item
- **DELETE** `/items/{itemId}`
- **Auth**: Required (admin only)
- **Response** (204): No content

---

## Notification Endpoints

### Get Notifications
- **GET** `/notifications?page=1&limit=20`
- **Auth**: Required
- **Response** (200):
  ```json
  {
    "notifications": [...],
    "pagination": { "total": 50, "page": 1, "limit": 20, "pages": 3 },
    "unreadCount": 5
  }
  ```

### Mark as Read
- **PATCH** `/notifications/{notificationId}/read`
- **Auth**: Required
- **Response** (200): Updated notification

### Mark All as Read
- **PATCH** `/notifications/read/all`
- **Auth**: Required
- **Response** (200): `{ "message": "...", "modifiedCount": 3 }`

### Delete Notification
- **DELETE** `/notifications/{notificationId}`
- **Auth**: Required
- **Response** (200): `{ "message": "Notification deleted" }`

---

## User Endpoints

### Get Profile
- **GET** `/users/profile`
- **Auth**: Required
- **Response** (200): User object

### Update Profile
- **PATCH** `/users/profile`
- **Auth**: Required
- **Body**: `{ "username": "new_name", "email": "new@email.com" }`
- **Response** (200): `{ "message": "Profile updated", "user": {...} }`

### Get My Items
- **GET** `/users/my-items?page=1&limit=10&status=lost`
- **Auth**: Required
- **Response** (200): `{ "items": [...], "pagination": {...} }`

### Delete Account
- **DELETE** `/users/profile`
- **Auth**: Required
- **Body**: `{ "password": "currentPassword" }`
- **Response** (200): `{ "message": "Account deleted" }`

---

## Admin Endpoints

### Get Dashboard
- **GET** `/admin/dashboard`
- **Auth**: Required (admin only)
- **Response** (200):
  ```json
  {
    "summary": { "totalUsers": 100, "totalItems": 500, "claimedItems": 150 },
    "itemsByCategory": [...],
    "recentActivity": [...]
  }
  ```

### Get All Users
- **GET** `/admin/users?page=1&limit=20&search=john`
- **Auth**: Required (admin only)
- **Response** (200): `{ "users": [...], "pagination": {...} }`

### Get All Items
- **GET** `/admin/items?page=1&limit=20&status=lost&category=electronics`
- **Auth**: Required (admin only)
- **Response** (200): `{ "items": [...], "pagination": {...} }`

### Delete User
- **DELETE** `/admin/users/{userId}`
- **Auth**: Required (admin only)
- **Response** (200): `{ "message": "User ... deleted", "deletedUserId": "..." }`

### Delete Item
- **DELETE** `/admin/items/{itemId}`
- **Auth**: Required (admin only)
- **Response** (204): No content

### Get System Logs
- **GET** `/admin/logs?level=all&limit=100`
- **Auth**: Required (admin only)
- **Response** (200): `{ "logs": [...], "count": 50 }`

---

## Error Responses

| Status | Response |
|---|---|
| 400 | `{ "error": "Bad request reason" }` |
| 401 | `{ "error": "Unauthorized" }` (invalid token) |
| 403 | `{ "error": "Forbidden" }` (insufficient permissions) |
| 404 | `{ "error": "Not found" }` |
| 422 | `{ "error": "Validation error", "errors": [...] }` |
| 429 | `{ "error": "Too many requests" }` (rate limited) |
| 500 | `{ "error": "Internal server error" }` |

---

## Rate Limiting

- **General**: 100 requests per 15 minutes
- **Auth**: 5 requests per 15 minutes
- **Item Creation**: 20 items per hour

Headers: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`
