# Lost & Found @ TIP Manila - Database Entity Relationship Diagram (ERD)

## 📊 Database Schema Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         DATABASE ARCHITECTURE                            │
│                        (MongoDB Collections)                             │
└─────────────────────────────────────────────────────────────────────────┘
```

### Entity Relationships

```
                    ┌──────────────────┐
                    │      USERS       │
                    ├──────────────────┤
                    │ _id (ObjectId)   │
                    │ username* (str)  │
                    │ email* (str)     │
                    │ password (hash)  │
                    │ role (enum)      │
                    │ createdAt        │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │    ITEMS     │  │NOTIFICATIONS │  │   API_KEYS   │
    ├──────────────┤  ├──────────────┤  ├──────────────┤
    │ _id (OID)    │  │ _id (OID)    │  │ _id (OID)    │
    │ itemName*    │  │ userId* (FK) │  │ userId* (FK) │
    │ description* │  │ itemId (FK)  │  │ key (unique) │
    │ category*    │  │ type*        │  │ hashedKey    │
    │ status*      │  │ title        │  │ permissions  │
    │ imageURL     │  │ message*     │  │ usageCount   │
    │ studentId*   │  │ priority     │  │ lastUsed     │
    │ studentName* │  │ read         │  │ expiresAt    │
    │ contactInfo* │  │ expiresAt    │  │ createdAt    │
    │ expiresAt    │  │ createdAt    │  └──────────────┘
    │ createdAt    │  └──────────────┘
    └──────────────┘
             │
             ▼
    ┌──────────────────────┐
    │ ANALYTICS_EVENTS     │
    ├──────────────────────┤
    │ _id (ObjectId)       │
    │ eventType*           │
    │ userId (FK)          │
    │ itemId (FK)          │
    │ metadata             │
    │ ipAddress            │
    │ userAgent            │
    │ createdAt            │
    └──────────────────────┘
```

---

## 📋 Detailed Schema Definitions

### ✨ USERS Collection
**Purpose:** Store user authentication and profile information

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `_id` | ObjectId | Primary Key | Unique user identifier |
| `username` | String | Required, Unique, Min 3 chars | User login name |
| `email` | String | Required, Unique | User email (lowercase) |
| `password` | String | Required, Min 6 chars, Hashed | Bcrypt hashed password |
| `role` | Enum | Default: "user" | Values: user, moderator, admin |
| `createdAt` | Date | Auto, Immutable | Account creation timestamp |
| `updatedAt` | Date | Auto | Last update timestamp |

**Indexes:**
- `username` (unique)
- `email` (unique)
- `role` (for RBAC queries)

**Usage:** User registration, login authentication, role-based access control

---

### 📦 ITEMS Collection
**Purpose:** Store lost & found item reports

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `_id` | ObjectId | Primary Key | Unique item identifier |
| `itemName` | String | Required, Max 100 chars | Name of the item |
| `description` | String | Required, Max 1000 chars | Detailed description |
| `category` | Enum | Required | Values: electronics, accessories, documents, clothing, books, others |
| `status` | Enum | Required, Default: "lost" | Values: lost, found, claimed |
| `studentId` | String | Required | Reporter's student ID |
| `studentName` | String | Required | Reporter's name |
| `contactInfo` | String | Required | Phone or email for contact |
| `location` | String | Optional | Where item was lost/found |
| `imageURL` | String | Optional | Cloudinary or local image URL |
| `dateLostOrFound` | Date | Required | When item was lost/found |
| `expiresAt` | Date | TTL Index (30 days) | Auto-delete after 30 days |
| `createdAt` | Date | Auto | Report creation timestamp |
| `updatedAt` | Date | Auto | Last update timestamp |

**Indexes:**
- `expiresAt` (TTL: deletes after 30 days)
- `status` (for filtering)
- `category` (for filtering)
- `studentId` (for user queries)
- `createdAt` (for sorting)

**Virtual Fields:**
- `expirationStatus` - Computed: active / expiring-soon / expired
- `daysUntilExpiration()` - Method: calculates remaining days

**Usage:** Item listings, search, filtering by status/category, analytics

---

### 🔔 NOTIFICATIONS Collection
**Purpose:** Store user notifications (matches, claims, expiration alerts)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `_id` | ObjectId | Primary Key | Unique notification ID |
| `userId` | ObjectId | Required, FK to Users | Recipient user |
| `itemId` | ObjectId | Optional, FK to Items | Related item (if applicable) |
| `type` | Enum | Required | Values: item_match, item_claimed, item_expiring, system |
| `title` | String | Required, Max 100 chars | Notification title |
| `message` | String | Required, Max 500 chars | Notification message |
| `priority` | Enum | Default: "low" | Values: low, medium, high |
| `read` | Boolean | Default: false | Read status |
| `metadata` | Object | Optional | Additional data (JSON) |
| `expiresAt` | Date | TTL Index (30 days) | Auto-delete after 30 days |
| `createdAt` | Date | Auto | Creation timestamp |

**Indexes:**
- `userId` (for user queries)
- `expiresAt` (TTL: deletes after 30 days)
- `read` (for unread count)
- `itemId` (for item-related queries)

**Methods:**
- `markAsRead()` - Mark notification as read
- `checkItemMatches()` - Find matching items for a user
- `createNotification()` - Create new notification

**Usage:** Real-time alerts, notification center, unread counts

---

### 📊 ANALYTICS_EVENTS Collection
**Purpose:** Track system events for analytics and monitoring

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `_id` | ObjectId | Primary Key | Unique event ID |
| `eventType` | String | Required | Values: item_posted, item_claimed, item_viewed, user_registered, login, search |
| `userId` | ObjectId | Optional, FK to Users | User who performed event |
| `itemId` | ObjectId | Optional, FK to Items | Related item |
| `metadata` | Object | Optional | Custom event data |
| `ipAddress` | String | Optional | Request IP for tracking |
| `userAgent` | String | Optional | Browser/client info |
| `createdAt` | Date | Auto | Event timestamp |

**Indexes:**
- `eventType` (for aggregation queries)
- `userId` (for user activity)
- `itemId` (for item tracking)
- `createdAt` (for date range queries)

**Aggregation Methods:**
- `getDashboardStats()` - Overall platform statistics
- `getItemStats()` - Item-specific analytics
- `getActivityTrends()` - Trends over time
- `getUserEngagement()` - Top active users

**Usage:** Dashboard stats, trend analysis, user engagement metrics

---

### 🔑 API_KEYS Collection
**Purpose:** Store API keys for programmatic access

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `_id` | ObjectId | Primary Key | Unique key ID |
| `userId` | ObjectId | Required, FK to Users | Owner of the key |
| `key` | String | Unique, Returned once only | Plain API key (non-reversible) |
| `hashedKey` | String | Required | SHA256-hashed key for storage |
| `name` | String | Optional | Friendly name for the key |
| `permissions` | Array | Default: ["read"] | Allowed operations: read, write, delete, admin |
| `usageCount` | Number | Default: 0 | Number of times used |
| `lastUsed` | Date | Optional | Timestamp of last use |
| `expiresAt` | Date | TTL Index (1 year) | Auto-revoke after 1 year |
| `createdAt` | Date | Auto | Creation timestamp |

**Indexes:**
- `hashedKey` (unique, for validation)
- `userId` (for key listing)
- `expiresAt` (TTL: deletes after 1 year)

**Usage:** API authentication, third-party integrations, REST client access

---

## 🔄 Data Flow Diagrams

### User Registration & Login Flow
```
┌──────────────┐
│ User Input   │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│ POST /api/auth/register
│ or /login
└──────┬───────────────┘
       │
       ▼
┌─────────────────────────┐
│ Validate input          │
│ (email, password, etc)  │
└──────┬──────────────────┘
       │
       ├─(register)→ Hash password, save to USERS
       │
       ├─(login)→ Compare password with stored hash
       │
       ▼
┌─────────────────────┐
│ Generate JWT token  │
│ (userId + role)     │
└──────┬──────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Log event → ANALYTICS_EVENTS │
│ (user_registered/login)      │
└──────────────────────────────┘
```

### Item Submission & Notification Flow
```
┌──────────────────┐
│ User submits     │
│ lost/found item  │
└──────┬───────────┘
       │
       ▼
┌─────────────────────────────┐
│ POST /api/items             │
│ (multipart: form + image)   │
└──────┬──────────────────────┘
       │
       ▼
┌────────────────────────┐
│ Validate item data     │
│ (required fields, etc) │
└──────┬─────────────────┘
       │
       ▼
┌──────────────────────┐
│ Upload image         │
│ → Cloudinary (or     │
│   /uploads/ local)   │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Save to ITEMS        │
│ Set expiresAt        │
│ (current + 30 days)  │
└──────┬───────────────┘
       │
       ▼
┌────────────────────────────────┐
│ Event Bus: emit('item:created')│
└──────┬─────────────────────────┘
       │
       ├→ Check NOTIFICATIONS
       │  for user matches
       │
       ├→ Log to ANALYTICS_EVENTS
       │  (item_posted)
       │
       └→ Create NOTIFICATIONS
          (item_match alerts)
```

### Analytics Query Flow
```
┌────────────────────┐
│ GET /api/analytics/│
│ dashboard          │
└──────┬─────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ Aggregate ITEMS collection      │
│ - Count by status (lost/found/  │
│   claimed)                      │
│ - Count by category             │
│ - Avg claim time                │
└──────┬──────────────────────────┘
       │
       ├→ Aggregate ANALYTICS_EVENTS
       │  - Total users, items posted
       │  - User engagement stats
       │
       ├→ Calculate KEY METRICS
       │  - Success rate
       │  - Avg expiration
       │
       └→ Return dashboard JSON
```

---

## 📈 Data Relationships Summary

| From | To | Type | Description |
|------|----|----|-------------|
| USERS | ITEMS | 1:N | One user posts many items |
| USERS | NOTIFICATIONS | 1:N | One user receives many notifications |
| USERS | ANALYTICS_EVENTS | 1:N | One user generates many events |
| USERS | API_KEYS | 1:N | One user has many API keys |
| ITEMS | NOTIFICATIONS | 1:N | One item triggers many notifications |
| ITEMS | ANALYTICS_EVENTS | 1:N | One item generates many events |

---

## 🔐 Cascading Operations

| Operation | Cascade Behavior |
|-----------|-----------------|
| **User Delete** | ❌ Prevented (items still referenced) |
| **Item Expires** | ✅ Auto-delete via TTL index (30 days) |
| **Item Delete** | ✅ Orphan notifications remain for history |
| **Notification Cleanup** | ✅ Auto-delete via TTL index (30 days) |
| **API Key Expiration** | ✅ Auto-delete via TTL index (1 year) |

---

## 📊 Indexing Strategy

### Performance Indexes
- **Frequently Queried Fields:** status, category, userId, eventType
- **Sorting Operations:** createdAt, expiresAt
- **Unique Constraints:** username, email, hashedKey
- **TTL Indexes:** expiresAt (automatic cleanup)

### Query Optimization
```javascript
// Fast queries with indexes:
db.items.find({ status: "lost", category: "electronics" })  // Index: status + category
db.notifications.find({ userId: ObjectId(...), read: false }) // Index: userId + read
db.analytics_events.find({ createdAt: { $gte: Date } })     // Index: createdAt
```

---

## 🎯 Summary

- **Collections:** 5 (Users, Items, Notifications, Analytics, API Keys)
- **Total Indexes:** 20+ (for performance optimization)
- **Relationships:** 4 primary relationships (1:N)
- **TTL Collections:** 3 (Items, Notifications, API Keys - auto-cleanup)
- **Data Integrity:** Foreign Keys via ObjectId references (application-level enforced)
