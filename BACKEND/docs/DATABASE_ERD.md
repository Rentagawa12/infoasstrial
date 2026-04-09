# Lost & Found System - Database ERD & Schema

## Entity Relationship Diagram (ASCII)

```
┌─────────────┐         ┌──────────────┐       ┌────────────────┐
│    Users    │1────────*│    Items     │1──────*│ Notifications  │
│  (System)   │         │  (System)    │       │   (System)     │
└─────────────┘         └──────────────┘       └────────────────┘
      │                        │                       │
      │ 1 (poster)             │ 1 (item_id)          │
      └────────────────────────┴───────────────────────┘

Relationships:
- Users: 1 ──── * Items (one user can post multiple items)
- Users: 1 ──── * Notifications (one user can receive multiple notifications)
- Items: 1 ──── * Notifications (one item can generate multiple notifications
```

## Collections/Tables

### 1. **Users Collection**
```
{
  _id: ObjectId,
  username: String (unique, min 3 chars),
  email: String (unique, lowercase),
  password: String (hashed bcrypt, min 6 chars),
  role: String (enum: ['user', 'admin']),
  createdAt: Date (default: now)
}

Indexes:
- username (unique)
- email (unique)
```

### 2. **Items Collection**
```
{
  _id: ObjectId,
  itemName: String (required, min 2 chars),
  description: String (required, min 5 chars),
  category: String (enum: ['electronics', 'accessories', 'documents', 'clothing', 'books', 'others']),
  dateLostOrFound: Date (required),
  status: String (enum: ['lost', 'found', 'claimed']),
  contactInfo: String (required, min 5 chars),
  imageURL: String (optional),
  studentId: String (required),
  studentName: String (required),
  location: String (optional),
  createdAt: Date (default: now),
  updatedAt: Date (auto),
  expiresAt: Date (TTL: 30 days from creation)
}

Indexes:
- expiresAt (TTL, auto-delete after 30 days)
- status
- category
- createdAt
- studentId
```

### 3. **Notifications Collection**
```
{
  _id: ObjectId,
  userId: ObjectId (ref: User, required, indexed),
  type: String (enum: ['item_claimed', 'item_posted', 'admin_notice']),
  itemId: ObjectId (ref: Item, optional),
  message: String (required),
  read: Boolean (default: false, indexed),
  metadata: {
    claimedBy: String (optional),
    itemName: String (optional),
    relatedUserId: ObjectId (optional)
  },
  createdAt: Date (default: now, indexed)
}

Indexes:
- userId + read + createdAt (compound index for efficient queries)
- read (for counting unread notifications)
```

## Key Relationships & Constraints

| Relationship | Description | Constraint |
|---|---|---|
| User → Items | One user can post many items | Cascade delete (delete items when user deleted) |
| User → Notifications | One user receives many notifications | User-scoped notifications |
| Item → Notifications | One item generates many notifications | Optional (item can be deleted, notification remains)|
| Users:role | Determines access control | RBAC enforced in middleware |

## Data Validation & Constraints

### User Model
- **Username**: 3-20 alphanumeric, unique
- **Email**: Valid email format, unique, lowercase
- **Password**: Min 6 characters, hashed with bcrypt (10 rounds)
- **Role**: Only 'user' or 'admin'

### Item Model
- **itemName**: Min 2 characters
- **description**: Min 5 characters
- **category**: Must be one of predefined enum values
- **status**: Only 'lost', 'found', or 'claimed'
- **studentId**: Alphanumeric, 4-20 characters
- **studentName**: Min 2 characters
- **expiresAt**: Automatically set to 30 days from creation (TTL)

### Notification Model
- **userId**: Must reference valid User
- **type**: Only predefined notification types
- **message**: Required, non-empty string

## Indexing Strategy

```
User Collection:
- { username: 1 } → UNIQUE (for fast login/lookup)
- { email: 1 } → UNIQUE (for registration validation)

Item Collection:
- { expiresAt: 1 } → TTL (auto-delete expired items)
- { status: 1 } → For filtering
- { category: 1 } → For filtering
- { createdAt: -1 } → For sorting (newest first)
- { studentId: 1 } → For user's items

Notification Collection:
- { userId: 1, read: 1, createdAt: -1 } → COMPOUND (efficient fetch)
- { read: 1 } → For count unread
```

## Performance Characteristics

| Operation | Complexity | Index Used |
|---|---|---|
| User login | O(1) | email index |
| Get user items | O(log n) | studentId index |
| Get unread notifications | O(log n) | userId + read index |
| Auto-expire items | O(n) | expiresAt TTL index |
| Search items by category | O(log n) | category index |

## Scalability Considerations

1. **Current**: MongoDB (single instance)
   - Good for development/MVP
   - Sufficient for <100k items

2. **Future**: Consider
   - MongoDB Atlas (cloud scaling)
   - Sharding on `studentId` or `category` if needed
   - Redis cache for hot items
   - Elasticsearch for advanced search

## Migration Path

If expanding:
1. Keep Users collection as-is (immutable schema)
2. Add `Claims` collection to track who claimed what (audit trail)
3. Add `Categories` ref table if dynamic categories needed
4. Add `Messages` collection for messaging system
