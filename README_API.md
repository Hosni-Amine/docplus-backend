# DocPlus Backend API Documentation

**Base URL:** `http://localhost:4000/api`  
**Environment:** Development  
**Version:** 1.0.0

## Table of Contents

- [Authentication](#authentication)
- [User Management](#user-management)

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
    "role": "ADMIN",
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
      "photo": "path/to/photo.jpg",
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