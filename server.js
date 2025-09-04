const path = require('path');
const fs = require('fs');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;

// Paths
const DB_PATH = path.join(__dirname, 'data.sqlite');
const VIEWS_DIR = path.join(__dirname, 'views');

// Ensure views directory exists
if (!fs.existsSync(VIEWS_DIR)) {
  fs.mkdirSync(VIEWS_DIR);
}

// View engine
app.set('view engine', 'ejs');
app.set('views', VIEWS_DIR);

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'change-this-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 8 },
  })
);

// Static files (serve existing site)
app.use(express.static(__dirname));

// DB init
const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  );

  db.run(
    `CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  );

  // Seed default admin if none exists
  db.get('SELECT COUNT(1) as count FROM admin_users', (err, row) => {
    if (err) return console.error('DB error:', err);
    if (row && row.count === 0) {
      const username = 'admin';
      const passwordHash = bcrypt.hashSync('admin123', 10);
      db.run(
        'INSERT INTO admin_users (username, password_hash) VALUES (?, ?)',
        [username, passwordHash],
        (e) => {
          if (e) console.error('Failed to seed admin user:', e);
          else console.log('Seeded default admin user: admin / admin123');
        }
      );
    }
  });
});

// Auth helpers
function ensureAuth(req, res, next) {
  if (req.session && req.session.userId) return next();
  return res.redirect('/admin/login');
}

// Routes
app.get('/admin/login', (req, res) => {
  res.render('login', { error: null });
});

app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).render('login', { error: 'Missing credentials' });
  }
  db.get('SELECT * FROM admin_users WHERE username = ?', [username], (err, user) => {
    if (err) return res.status(500).render('login', { error: 'Server error' });
    if (!user) return res.status(401).render('login', { error: 'Invalid credentials' });
    const ok = bcrypt.compareSync(password, user.password_hash);
    if (!ok) return res.status(401).render('login', { error: 'Invalid credentials' });
    req.session.userId = user.id;
    req.session.username = user.username;
    res.redirect('/admin');
  });
});

app.get('/admin/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/admin/login');
  });
});

app.get('/admin', ensureAuth, (req, res) => {
  db.all('SELECT * FROM contact_messages ORDER BY created_at DESC', (err, rows) => {
    if (err) return res.status(500).send('Server error');
    res.render('dashboard', { username: req.session.username, messages: rows });
  });
});

// Public contact form endpoint
app.post('/contact', (req, res) => {
  const { name, email, phone, message } = req.body;
  if (!name || !email) {
    return res.status(400).send('Name and Email are required');
  }
  db.run(
    'INSERT INTO contact_messages (name, email, phone, message) VALUES (?, ?, ?, ?)',
    [name, email, phone || '', message || ''],
    (err2) => {
      if (err2) return res.status(500).send('Failed to save message');
      res.redirect('/#cont');
    }
  );
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


