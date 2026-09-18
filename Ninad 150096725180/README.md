# 📚 Library Management System REST API

A production-ready, secure REST API for a Library Management System built with **Node.js**, **Express.js**, **Firebase Firestore**, **JSON Web Tokens (JWT)**, and **Swagger/OpenAPI**.

---

## 🌟 Features

- 🔐 **JWT Authentication & Password Security**: Secure user registration and login with passwords hashed using `bcrypt` (10 salt rounds) and signed JWT tokens with 24-hour expiration.
- 👥 **Role-Based Access Control (RBAC)**: Distinct permissions for **Students** and **Librarians** enforced through modular middleware.
- 📚 **Full Book Management (CRUD)**: Complete lifecycle for books including filtering (category, status, author) and text search.
- 🔄 **Borrow & Return System**: Real-time stock tracking, preventing simultaneous duplicate borrows, auto-calculating 14-day return due dates, and maintaining complete transaction history.
- 👨‍💼 **User Administration**: Librarian-only endpoints to inspect users, update permissions/roles, and manage accounts.
- 🚦 **Rate Limiting**: Protection against DDoS and brute force attacks using `express-rate-limit` (100 requests per 15 minutes globally, 20 requests per 15 minutes for authentication).
- 🛡️ **Enterprise Security Middlewares**: `helmet` security headers, strict input validation with `express-validator`, CORS, and centralized error handling.
- 📝 **Structured Logging**: Request logger capturing HTTP method, path, HTTP status, execution latency (ms), timestamp, and authenticated user identity.
- 📖 **Interactive Swagger / OpenAPI 3.0 Documentation**: Live API testbed available directly at `/api-docs`.
- 📦 **Dual Database Engine**: Seamlessly supports both live **Google Cloud Firebase Firestore** and an instant zero-config **In-Memory Firestore Emulator** for grading and local development.

---

## 🛠️ Tech Stack

| Technology | Purpose |
| :--- | :--- |
| **Node.js** | Server-side JavaScript runtime environment |
| **Express.js** | Fast, unopinionated REST API web framework |
| **Firebase Admin SDK** | Firestore NoSQL Cloud Database |
| **JSON Web Tokens (JWT)** | Stateless authentication and token verification |
| **bcryptjs / bcrypt** | Salting and hashing sensitive user passwords |
| **express-validator** | Declarative schema validation and sanitation |
| **express-rate-limit** | API rate limiting and brute force prevention |
| **Swagger UI & OpenAPI 3.0** | Interactive API documentation |
| **Helmet & CORS** | HTTP security headers and cross-origin resource sharing |

---

## 📁 Project Structure

```
Assignment 6/
├── server.js                     # Express application entry point & setup
├── package.json                 # Project dependencies & npm scripts
├── .env                         # Active environment variables
├── .env.example                 # Template for environment configuration
├── .gitignore                   # Git ignore specifications
├── test-api.js                  # Automated verification test suite (28 tests)
├── README.md                    # Project documentation
├── docs/
│   ├── swagger.yaml             # Complete OpenAPI 3.0 specification
│   └── postman_collection.json # Exported Postman collection for manual testing
└── src/
    ├── config/
    │   ├── firebase.js          # Firestore initialization & mock fallback
    │   └── swagger.js           # Swagger UI setup & custom styling
    ├── controllers/
    │   ├── authController.js    # Register, login, profile logic
    │   ├── bookController.js    # Book CRUD, search, borrow, return
    │   ├── transactionController.js # Transaction queries & history
    │   └── userController.js    # Librarian user management
    ├── middleware/
    │   ├── auth.js              # Bearer token verification
    │   ├── errorHandler.js      # Global 404 & 500 error handlers
    │   ├── logger.js            # Request latency & user logger
    │   ├── rateLimiter.js       # Rate limiters for API & Auth
    │   ├── role.js              # Role authorization guard (student / librarian)
    │   └── validator.js         # Input validation error formatter
    ├── models/
    │   ├── bookModel.js         # Books Firestore collection wrapper
    │   ├── transactionModel.js  # Transactions Firestore collection wrapper
    │   └── userModel.js         # Users Firestore collection wrapper
    └── utils/
        ├── jwt.js               # JWT sign & verify utilities
        ├── seed.js              # Initial demo users & books seed data
        └── validation.js        # express-validator schemas
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v16.x or newer (Tested on Node.js v25)
- **npm**: v8.x or newer

### 1. Installation

Clone or extract the repository, navigate into the directory, and install dependencies:

```bash
cd "Assignment 6"
npm install
```

### 2. Environment Configuration

A `.env` file with default values is already provided. You can inspect or modify `.env` based on `.env.example`:

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=super_secret_jwt_key_library_management_2026
JWT_EXPIRES_IN=24h
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
USE_IN_MEMORY_DB=true
```

#### Connecting Real Firebase Firestore (Optional)
To connect a live Firebase project, set `USE_IN_MEMORY_DB=false` and provide either:
- A path to your `serviceAccountKey.json`:
  ```env
  FIREBASE_SERVICE_ACCOUNT_KEY=./path/to/serviceAccountKey.json
  ```
- Or individual environment credentials:
  ```env
  FIREBASE_PROJECT_ID=your-project-id
  FIREBASE_CLIENT_EMAIL=your-service-account@...
  FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
  ```

> **Note**: If no Firebase credentials are provided or `USE_IN_MEMORY_DB=true`, the API automatically starts in **In-Memory Firestore mode**, allowing immediate evaluation without configuring Google Cloud accounts!

### 3. Running the Server

Start in production mode:
```bash
npm start
```

Start in development mode with hot-reloading:
```bash
npm run dev
```

The server will start on `http://localhost:5000`.

---

## 🧪 Automated Testing

Run the included automated verification suite containing **28 tests**:

```bash
npm test
```

This suite validates:
1. Server health check (`/` and `/health`)
2. Swagger UI documentation availability (`/api-docs`)
3. User authentication & password hashing (Student & Librarian)
4. Input validation rejections (400)
5. User profile retrieval and updating
6. Book catalog fetching, category filtering, search query matching, and ID lookups
7. Role-Based Access Control (rejecting student attempts to create/edit books with 403 Forbidden)
8. Librarian book addition and updates
9. Book borrowing workflow (quantity decrement, status change, 14-day due date calculation)
10. Duplicate active borrow prevention
11. Book return workflow (quantity increment, status restoration, transaction completion)
12. Transaction history inspection for both students and librarians
13. User management (viewing users, updating roles, account deletion)
14. API rate limit headers

---

## 🔑 Default Seed Accounts

When running for the first time, the database is pre-seeded with:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Librarian** | `admin@library.com` | `Admin@123` | Full CRUD on books, view/delete users, view all transactions |
| **Student** | `student@library.com` | `Student@123` | View books, search, borrow, return, view personal transactions |

---

## 📋 API Endpoints Reference

### 🔐 Authentication (`/api/auth`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new user (Student or Librarian) |
| `POST` | `/api/auth/login` | Public | Login with email & password to receive JWT |
| `GET` | `/api/auth/profile` | Authenticated | Retrieve authenticated user profile |
| `PUT` | `/api/auth/profile` | Authenticated | Update user name, email, or password |

### 📚 Books (`/api/books`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/books` | Public | Get all books (filters: `?category=`, `?status=`, `?author=`) |
| `GET` | `/api/books/search` | Public | Search books by keyword (`?q=Clean`) |
| `GET` | `/api/books/:id` | Public | Get single book details by ID |
| `POST` | `/api/books` | Librarian | Add a new book to catalog |
| `PUT` | `/api/books/:id` | Librarian | Update existing book details |
| `DELETE` | `/api/books/:id` | Librarian | Delete a book by ID |
| `POST` | `/api/books/:id/borrow` | Student | Borrow an available book |
| `POST` | `/api/books/:id/return` | Student | Return a previously borrowed book |

### 🔄 Transactions (`/api/transactions`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/transactions/my` | Authenticated | View current user's borrowing history |
| `GET` | `/api/transactions` | Librarian | View all library transactions with user & book details |

### 👤 User Management (`/api/users`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/users` | Librarian | Get list of all registered users (passwords omitted) |
| `GET` | `/api/users/:id` | Librarian | Get user profile details by ID |
| `PUT` | `/api/users/:id/role` | Librarian | Promote/demote user role (`student` or `librarian`) |
| `DELETE` | `/api/users/:id` | Librarian | Delete a user account |

---

## 📖 Swagger API Documentation

Open your browser and navigate to:
```
http://localhost:5000/api-docs
```

The Swagger UI provides:
- Live interactive requests (`Try it out`)
- Complete request body schemas and parameter definitions
- Authentication helper (`Authorize` button where you can paste `Bearer <your_token>`)
- Detailed response models and status codes

---

## 📮 Testing with Postman

A complete Postman Collection is included in [`docs/postman_collection.json`](file:///docs/postman_collection.json):

1. Open Postman.
2. Click **Import** and select `Assignment 6/docs/postman_collection.json`.
3. The collection is pre-configured with environment variables `{{baseUrl}}` (`http://localhost:5000`), `{{studentToken}}`, and `{{librarianToken}}`.
4. Run the **Login as Librarian** or **Login as Student** request; the test scripts in the collection automatically store the JWT in collection variables for subsequent calls!

---

## 📝 Example Requests & Responses

### 1. User Registration
`POST /api/auth/register`

**Request:**
```json
{
  "name": "Jane Doe",
  "email": "jane.doe@library.com",
  "password": "SecurePassword123",
  "role": "student"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "userId": "usr_1789738101178_tpwphd0",
      "name": "Jane Doe",
      "email": "jane.doe@library.com",
      "role": "student",
      "createdAt": "2026-09-18T13:28:21.122Z",
      "updatedAt": "2026-09-18T13:28:21.122Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. Borrow a Book
`POST /api/books/book_1/borrow`
*Header: `Authorization: Bearer <Student_JWT>`*

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Book 'The Great Gatsby' borrowed successfully. Please return by due date.",
  "data": {
    "transaction": {
      "transactionId": "tx_1789738101185_kd92b",
      "userId": "user_student_1",
      "bookId": "book_1",
      "type": "borrow",
      "borrowDate": "2026-09-18T13:28:21.185Z",
      "returnDate": null,
      "dueDate": "2026-10-02T13:28:21.185Z",
      "status": "active"
    },
    "remainingQuantity": 4
  }
}
```

### 3. Return a Book
`POST /api/books/book_1/return`
*Header: `Authorization: Bearer <Student_JWT>`*

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Book 'The Great Gatsby' returned successfully. Thank you!",
  "data": {
    "transaction": {
      "transactionId": "tx_1789738101185_kd92b",
      "userId": "user_student_1",
      "bookId": "book_1",
      "type": "return",
      "borrowDate": "2026-09-18T13:28:21.185Z",
      "returnDate": "2026-09-18T13:28:21.187Z",
      "dueDate": "2026-10-02T13:28:21.185Z",
      "status": "returned"
    },
    "availableQuantity": 5
  }
}
```

---

## 🛡️ Database Schema

### Users Collection (`users`)
```json
{
  "userId": "string",
  "name": "string",
  "email": "string (unique)",
  "password": "string (bcrypt hashed)",
  "role": "student | librarian",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### Books Collection (`books`)
```json
{
  "bookId": "string",
  "title": "string",
  "author": "string",
  "isbn": "string",
  "category": "string",
  "status": "available | borrowed",
  "quantity": "number",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### Transactions Collection (`transactions`)
```json
{
  "transactionId": "string",
  "userId": "string",
  "bookId": "string",
  "type": "borrow | return",
  "borrowDate": "timestamp",
  "returnDate": "timestamp | null",
  "dueDate": "timestamp (+14 days)",
  "status": "active | returned | overdue"
}
```

---

## 👨‍💻 Author

**Ninad Nilesh Deodhare**  
Built for the **Library Management System API Assignment**.
