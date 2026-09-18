const bcrypt = require('bcryptjs');

const initialUsers = [
  {
    userId: 'user_librarian_1',
    name: 'Chief Librarian',
    email: 'admin@library.com',
    password: 'Admin@123', // Will be hashed when seeded
    role: 'librarian',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    userId: 'user_student_1',
    name: 'Alice Student',
    email: 'student@library.com',
    password: 'Student@123', // Will be hashed when seeded
    role: 'student',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const initialBooks = [
  {
    bookId: 'book_1',
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    isbn: '978-0743273565',
    category: 'Fiction',
    status: 'available',
    quantity: 5,
    createdAt: new Date().toISOString()
  },
  {
    bookId: 'book_2',
    title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
    author: 'Robert C. Martin',
    isbn: '978-0132350884',
    category: 'Technology',
    status: 'available',
    quantity: 3,
    createdAt: new Date().toISOString()
  },
  {
    bookId: 'book_3',
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    isbn: '978-0060935467',
    category: 'Classic',
    status: 'available',
    quantity: 4,
    createdAt: new Date().toISOString()
  },
  {
    bookId: 'book_4',
    title: 'JavaScript: The Good Parts',
    author: 'Douglas Crockford',
    isbn: '978-0596517748',
    category: 'Programming',
    status: 'available',
    quantity: 2,
    createdAt: new Date().toISOString()
  },
  {
    bookId: 'book_5',
    title: 'Design Patterns: Elements of Reusable Object-Oriented Software',
    author: 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides',
    isbn: '978-0201633610',
    category: 'Software Engineering',
    status: 'available',
    quantity: 2,
    createdAt: new Date().toISOString()
  }
];

const getHashedSeedUsers = async () => {
  const users = [];
  for (const user of initialUsers) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(user.password, salt);
    users.push({
      ...user,
      password: hashedPassword
    });
  }
  return users;
};

module.exports = {
  initialUsers,
  initialBooks,
  getHashedSeedUsers
};
