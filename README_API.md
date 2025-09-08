# DocPlus Backend API Documentation

**Base URL:** `http://localhost:4000/api`  
**Environment:** Development  
**Version:** 1.0.0

## Table of Contents
- [Authentication](#authentication)
- [User Management](#user-management)

---

## Authentication

### 1. User Sign In
**POST** `/auth/signin`

Authenticate a user and return a JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
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
    "is_verified": true,
    "is_completed": false,
    "phone": "+1234567890",
    "address": "123 Main St, City, State",
    "created_at": "2025-09-08T22:01:36.440Z",
    "updated_at": "2025-09-08T22:01:36.440Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "LOGGED_IN_SUCCESSFULLY",
  "status": 200
}
```
### 2. User Confirmation
**PATCH** `/auth/confirm`

Verify a user account with confirmation token and set password.

**Request Body:**
```json
{
  "token": "ff3405a6-23e6-4681-92cc-c2a5abc9db57",
  "password": "password123"
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
    "is_verified": true,
    "is_completed": false,
    "phone": "+1234567890",
    "address": "123 Main St, City, State",
    "created_at": "2025-09-08T22:01:36.440Z",
    "updated_at": "2025-09-08T22:01:36.440Z"
  },
  "message": "VERIFIED_SUCCESSFULLY",
  "status": 200
}
```

---

### 3. Request Password Reset
**POST** `/auth/request-reset-password`

Send password reset email to user.

**Request Body:**
```json
{
  "email": "admin332@example.com"
}
```

**Response:**
```json
{
  "user": null,
  "message": "PASSWORD_RESET_REQUEST_SENT_SUCCESSFULLY",
  "status": 200
}
```

---

### 4. Reset Password
**PATCH** `/auth/reset-password`

Reset user password using reset token.

**Request Body:**
```json
{
  "token": "new-reset-token-from-email",
  "password": "newpassword123"
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
    "is_verified": true,
    "is_completed": false,
    "phone": "+1234567890",
    "address": "123 Main St, City, State",
    "created_at": "2025-09-08T22:01:36.440Z",
    "updated_at": "2025-09-08T22:01:36.440Z"
  },
  "message": "PASSWORD_RESET_SUCCESSFULLY",
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
        "isDeleted": false,
        "email": "admin332@example.com",
        "phone": "+1234567890",
        "fullname": "John Doe",
        "role": "ADMIN",
        "is_verified": false,
        "is_completed": false,
        "confirmation_token": "ff3405a6-23e6-4681-92cc-c2a5abc9db57",
        "address": "123 Main St, City, State",
        "_id": "68bf5240d2414827256a094d",
        "created_at": "2025-09-08T22:01:36.440Z",
        "updated_at": "2025-09-08T22:01:36.440Z"
    },
    "status": 201,
    "message": "USER_CREATED_SUCCESSFULLY"
}
