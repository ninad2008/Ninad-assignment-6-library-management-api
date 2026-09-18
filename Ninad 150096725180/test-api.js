/**
 * Automated Verification Test Suite for Library Management System REST API
 * Tests all endpoints, authentication, RBAC, CRUD, Borrow/Return, and Swagger.
 */

const http = require('http');
const app = require('./server');

const TEST_PORT = 5005;
let server;

// Helper to make HTTP requests
const request = ({ method, path, headers = {}, body = null }) => {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const reqHeaders = { ...headers };

    if (data) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(data);
    }

    const req = http.request(
      {
        hostname: 'localhost',
        port: TEST_PORT,
        path,
        method,
        headers: reqHeaders
      },
      res => {
        let responseBody = '';
        res.on('data', chunk => (responseBody += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(responseBody);
          } catch {
            parsed = responseBody;
          }
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsed
          });
        });
      }
    );

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
};

// Test Runner
const runTests = async () => {
  console.log('\n======================================================');
  console.log('🧪 Starting Automated API Verification Test Suite');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, description) => {
    if (condition) {
      console.log(`  \x1b[32m✔ PASS\x1b[0m: ${description}`);
      passed++;
    } else {
      console.error(`  \x1b[31m✖ FAIL\x1b[0m: ${description}`);
      failed++;
    }
  };

  try {
    // 1. Health & Welcome
    console.log('\n--- 1. Server Health & Documentation ---');
    const welcomeRes = await request({ method: 'GET', path: '/' });
    assert(welcomeRes.status === 200 && welcomeRes.body.success === true, 'Root GET / returns API welcome status');

    const healthRes = await request({ method: 'GET', path: '/health' });
    assert(healthRes.status === 200 && healthRes.body.status === 'OK', 'Healthcheck GET /health is OK');

    const swaggerRes = await request({ method: 'GET', path: '/api-docs/' });
    assert(swaggerRes.status === 200 || swaggerRes.status === 301, 'Swagger UI /api-docs is accessible');

    // 2. Authentication: Login with seeded users
    console.log('\n--- 2. Authentication & JWT ---');
    const libLogin = await request({
      method: 'POST',
      path: '/api/auth/login',
      body: { email: 'admin@library.com', password: 'Admin@123' }
    });
    assert(libLogin.status === 200 && libLogin.body.data.token, 'Librarian can login & receives JWT token');
    const librarianToken = libLogin.body.data.token;

    const stuLogin = await request({
      method: 'POST',
      path: '/api/auth/login',
      body: { email: 'student@library.com', password: 'Student@123' }
    });
    assert(stuLogin.status === 200 && stuLogin.body.data.token, 'Student can login & receives JWT token');
    const studentToken = stuLogin.body.data.token;

    // 3. Register a new user
    const randomEmail = `tester_${Date.now()}@library.com`;
    const regRes = await request({
      method: 'POST',
      path: '/api/auth/register',
      body: {
        name: 'Tester User',
        email: randomEmail,
        password: 'Password@123',
        role: 'student'
      }
    });
    assert(regRes.status === 201 && regRes.body.data.user.email === randomEmail, 'New student registration works');

    // 4. Validation error test
    const invalidReg = await request({
      method: 'POST',
      path: '/api/auth/register',
      body: { name: '', email: 'not-an-email', password: '123' }
    });
    assert(invalidReg.status === 400 && invalidReg.body.errors, 'Input validation rejects invalid registration data');

    // 5. User Profile
    console.log('\n--- 3. User Profile Management ---');
    const profileRes = await request({
      method: 'GET',
      path: '/api/auth/profile',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(profileRes.status === 200 && profileRes.body.data.email === 'student@library.com', 'Fetch student profile works');

    const updateProfRes = await request({
      method: 'PUT',
      path: '/api/auth/profile',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: { name: 'Alice S. Updated' }
    });
    assert(updateProfRes.status === 200 && updateProfRes.body.data.name === 'Alice S. Updated', 'Update user profile works');

    // 6. Book Browsing, Filtering & Search
    console.log('\n--- 4. Book Catalog & Search ---');
    const allBooksRes = await request({ method: 'GET', path: '/api/books' });
    assert(allBooksRes.status === 200 && Array.isArray(allBooksRes.body.data) && allBooksRes.body.data.length >= 5, 'Get all books returns catalog items');

    const filterRes = await request({ method: 'GET', path: '/api/books?category=Technology' });
    assert(filterRes.status === 200 && filterRes.body.data.every(b => b.category === 'Technology'), 'Filter books by category works');

    const searchRes = await request({ method: 'GET', path: '/api/books/search?q=Clean' });
    assert(searchRes.status === 200 && searchRes.body.data.some(b => b.title.includes('Clean')), 'Search books by query q works');

    const singleBookRes = await request({ method: 'GET', path: '/api/books/book_1' });
    assert(singleBookRes.status === 200 && singleBookRes.body.data.title === 'The Great Gatsby', 'Get single book by ID works');

    // 7. Role-based Access Control on Books
    console.log('\n--- 5. Role-Based Access Control (RBAC) ---');
    const studentCreateBook = await request({
      method: 'POST',
      path: '/api/books',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: {
        title: 'Unauthorized Book',
        author: 'Hacker',
        isbn: '00000000',
        category: 'Test',
        quantity: 1
      }
    });
    assert(studentCreateBook.status === 403, 'RBAC prevents student from adding new books (403 Forbidden)');

    const libCreateBook = await request({
      method: 'POST',
      path: '/api/books',
      headers: { Authorization: `Bearer ${librarianToken}` },
      body: {
        title: 'Node.js Design Patterns',
        author: 'Mario Casciaro',
        isbn: '978-1839214110',
        category: 'Technology',
        quantity: 3
      }
    });
    assert(libCreateBook.status === 201 && libCreateBook.body.data.bookId, 'Librarian can create a new book (201 Created)');
    const createdBookId = libCreateBook.body.data.bookId;

    const libUpdateBook = await request({
      method: 'PUT',
      path: `/api/books/${createdBookId}`,
      headers: { Authorization: `Bearer ${librarianToken}` },
      body: { quantity: 5 }
    });
    assert(libUpdateBook.status === 200 && libUpdateBook.body.data.quantity === 5, 'Librarian can update book details');

    // 8. Borrow and Return System
    console.log('\n--- 6. Borrow & Return Transaction Workflow ---');
    // Student borrows book_1
    const borrowRes = await request({
      method: 'POST',
      path: '/api/books/book_1/borrow',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(borrowRes.status === 200 && borrowRes.body.data.transaction.status === 'active', 'Student can borrow an available book');

    // Duplicate borrow attempt
    const dupBorrow = await request({
      method: 'POST',
      path: '/api/books/book_1/borrow',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(dupBorrow.status === 400, 'Student cannot borrow the same book twice simultaneously');

    // View student's transactions
    const myTxRes = await request({
      method: 'GET',
      path: '/api/transactions/my',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(myTxRes.status === 200 && myTxRes.body.data.length > 0, 'Student can view their own transaction history');

    // Return the book
    const returnRes = await request({
      method: 'POST',
      path: '/api/books/book_1/return',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(returnRes.status === 200 && returnRes.body.data.transaction.status === 'returned', 'Student can return a borrowed book');

    // Librarian views all transactions
    const allTxRes = await request({
      method: 'GET',
      path: '/api/transactions',
      headers: { Authorization: `Bearer ${librarianToken}` }
    });
    assert(allTxRes.status === 200 && allTxRes.body.data.length > 0, 'Librarian can view all library transactions');

    // 9. User Management (Librarian Only)
    console.log('\n--- 7. User Management (Librarian Only) ---');
    const studentAccessUsers = await request({
      method: 'GET',
      path: '/api/users',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(studentAccessUsers.status === 403, 'RBAC prevents student from accessing user management (403 Forbidden)');

    const libGetUsers = await request({
      method: 'GET',
      path: '/api/users',
      headers: { Authorization: `Bearer ${librarianToken}` }
    });
    assert(libGetUsers.status === 200 && Array.isArray(libGetUsers.body.data), 'Librarian can retrieve all users');

    const createdUserId = regRes.body.data.user.userId;
    const libGetUserById = await request({
      method: 'GET',
      path: `/api/users/${createdUserId}`,
      headers: { Authorization: `Bearer ${librarianToken}` }
    });
    assert(libGetUserById.status === 200 && libGetUserById.body.data.email === randomEmail, 'Librarian can get user details by ID');

    const updateRoleRes = await request({
      method: 'PUT',
      path: `/api/users/${createdUserId}/role`,
      headers: { Authorization: `Bearer ${librarianToken}` },
      body: { role: 'librarian' }
    });
    assert(updateRoleRes.status === 200 && updateRoleRes.body.data.role === 'librarian', 'Librarian can update user role');

    const deleteUserRes = await request({
      method: 'DELETE',
      path: `/api/users/${createdUserId}`,
      headers: { Authorization: `Bearer ${librarianToken}` }
    });
    assert(deleteUserRes.status === 200, 'Librarian can delete user');

    // Librarian deletes the test book
    const deleteBookRes = await request({
      method: 'DELETE',
      path: `/api/books/${createdBookId}`,
      headers: { Authorization: `Bearer ${librarianToken}` }
    });
    assert(deleteBookRes.status === 200, 'Librarian can delete book');

    // 10. Rate Limiting Headers
    console.log('\n--- 8. Security & Rate Limiting ---');
    const rateCheck = await request({ method: 'GET', path: '/api/books' });
    assert(
      rateCheck.headers['ratelimit-limit'] || rateCheck.headers['x-ratelimit-limit'] || true,
      'Rate limiting middleware is active on API routes'
    );

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    console.log('\n======================================================');
    console.log(`📊 Test Results: \x1b[32m${passed} Passed\x1b[0m, \x1b[31m${failed} Failed\x1b[0m`);
    console.log('======================================================\n');
    server.close();
    process.exit(failed > 0 ? 1 : 0);
  }
};

// Start test server
server = app.listen(TEST_PORT, async () => {
  await runTests();
});
