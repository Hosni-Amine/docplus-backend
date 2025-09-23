# DocPlus Backend API Documentation

**Base URL:** `http://localhost:4000/api`  
**Environment:** Development  
**Version:** 1.0.0

## Table of Contents

- [Authentication](#authentication)
- [User Management](#user-management)
- [Office Management](#office-management)

---

## Authentication

### 1. Request OTP Code

**POST** `/auth/request-otp`

Request an OTP code to be sent to the user's email for authentication.

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Response:**

```json
{
  "otp_confirmation_token": "2fffbbd1-98c3-49ff-a080-e6f61d7e9a79",
  "message": "OTP_SENT_SUCCESSFULLY",
  "status": 200
}
```

---

### 2. Verify OTP Code

**POST** `/auth/verify-otp`

Verify the OTP code and authenticate the user.

**Request Body:**

```json
{
  "email": "user@example.com",
  "otp_code": "123456",
  "otp_confirmation_token": "ff3405a6-23e6-4681-92cc-c2a5abc9db57"
}
```

**Response:**

```json
{
  "user": {
    "_id": "68bf5240d2414827256a094d",
    "email": "admin332@example.com",
    "fullname": "John Doe",
    "role": "ADMIN"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "LOGGED_IN_SUCCESSFULLY",
  "status": 200
}
```

---

## User Management

### 1. Create User Account

**POST** `/user`

Create a new user account (Public endpoint).

**Request Body:**

```json
{
  "email": "admin@example.com",
  "phone": "+1234567890",
  "fullname": "John Doe",
  "address": "123 Main St, City, State",
  "role": "ADMIN"
}
```

**Response:**

```json
{
  "user": {
    "_id": "68bf5240d2414827256a094d",
    "email": "admin332@example.com",
    "phone": "+1234567890",
    "fullname": "John Doe",
    "role": "ADMIN",
    "isDeleted": false,
    "isBlocked": false,
    "address": "123 Main St, City, State",
    "created_at": "2025-09-08T22:01:36.440Z",
    "updated_at": "2025-09-08T22:01:36.440Z"
  },
  "status": 201,
  "message": "USER_CREATED_SUCCESSFULLY"
}
```

---

### 2. Get Users with Pagination

**GET** `user/with-pagination`

**Request Body for filter:**

```json
{
  "limit":10,
  "skip":0,
  "role":"ADMIN",
  "fullname":"John"
}
```

**Response:**

```json
{
  "data": [
    {
      "_id": "68bf5240d2414827256a094d",
      "fullname": "John Doe",
      "email": "admin@example.com",
      "role": "ADMIN",
      "photo": "path/to/photo.jpg"
    }
  ],
  "paginatorInfo": {
    "count": 25,
    "currentPage": 1,
    "perPage": 20,
    "totalPages": 2,
    "hasNextPage": true,
    "hasPrevPage": false,
    "nextPage": 2,
    "prevPage": null
  }
}
```

---

### 3. Update User

**PATCH** `/user`

Update user information.

**Request Body:**

```json
{
  "id": "68bf5240d2414827256a094d",
  "fullname": "John Smith",
  "email": "john.smith@example.com",
  "phone": "+1234567890",
  "address": "456 New St, City, State",
  "photo": "base64_encoded_image_or_file_path",
  "isBlocked": false,
  "isDeleted": true
}
```

**Response:**

```json
{
  "user": {
    "_id": "68bf5240d2414827256a094d",
    "fullname": "John Smith",
    "email": "john.smith@example.com",
    "phone": "+1234567890",
    "address": "456 New St, City, State",
    "role": "ADMIN",
    "isBlocked": false,
    "isBlocked": false,
    "photo": "path/to/updated/photo.jpg",
    "created_at": "2025-09-08T22:01:36.440Z",
    "updated_at": "2025-09-08T22:01:36.440Z"
  },
  "status": 200,
  "message": "USER_UPDATED_SUCCESSFULLY"
}
```

---

### 4. Get User by ID

**GET** `/user/:id`

Get a specific user by their ID with populated office information.

**Parameters:**
- `id` (string): User ID

---

### 5. Get Current User

**GET** `/user/me`

Get the currently authenticated user's information.

**Headers:**
- `Authorization: Bearer <token>`

---

### 6. Affect Doctor/Admin to Office

**PATCH** `/user/office-affection`

Assign a doctor or admin to an office.

**Headers:**
- `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "userId": "user_id",
  "officeId": "office_id"
}
```

---

### 7. Remove Doctor/Admin from Office

**PATCH** `/user/office-removal`

Remove a doctor or admin from their assigned office.

**Headers:**
- `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "userId": "user_id"
}
```

---

## Office Management

### 1. Create Office

**POST** `/office`

Create a new office.

**Request Body:**
```json
{
  "name": "Office Name",
  "address": "123 Main St, City, State",
  "city": "City Name",
  "postalCode": "12345",
  "country": "Country Name",
  "fixed_phone": "+1234567890",
  "email": "office@example.com",
  "website": "https://office-website.com",
  "type": "PRIVATE",
  "openingHours": {
    "monday": { "open": "09:00", "close": "17:00", "closed": false },
    "tuesday": { "open": "09:00", "close": "17:00", "closed": false }
  },
  "images": ["image1.jpg", "image2.jpg"],
  "specializations": ["Cardiology", "Dermatology"],
  "insuranceAccepted": ["Insurance A", "Insurance B"]
}
```

---

### 2. Get Offices with Pagination

**GET** `/office/with-pagination`

Get a paginated list of offices with optional filtering.

**Request Body:**
```json
{
  "name": "Office Name",
  "type": "PRIVATE",
  "limit": 10,
  "skip": 0
}
```

---

### 3. Get Office by ID

**GET** `/office/:id`

Get a specific office by its ID.

**Parameters:**
- `id` (string): Office ID

---

### 4. Update Office

**PATCH** `/office`

Update office information.

**Request Body:**
```json
{
  "id": "office_id",
  "name": "Updated Office Name",
  "address": "456 New St, City, State",
  "city": "Updated City",
  "postalCode": "54321",
  "country": "Updated Country",
  "fixed_phone": "+0987654321",
  "email": "updated@example.com",
  "website": "https://updated-website.com",
  "type": "CLINIC",
  "openingHours": {
    "monday": { "open": "08:00", "close": "18:00", "closed": false }
  },
  "images": ["updated_image1.jpg"],
  "specializations": ["Updated Specialization"],
  "insuranceAccepted": ["Updated Insurance"]
}
```

---

### 5. Delete Office

**DELETE** `/office`

Soft delete or restore an office.

**Request Body:**
```json
{
  "officeId": "office_id",
  "isDeleted": true
}
```

**Request Body:**
```json
{
  "officeId": "office_id",
  "isDeleted": false
}
```