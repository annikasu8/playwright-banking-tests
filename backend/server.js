// ============================================
// Banking App - Backend API
// ============================================
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// ============================================
// In-Memory Database (restart aithe reset)
// ============================================
const users = {
  alice: { password: 'alice123', name: 'Alice Kumar', balance: 10000 },
  bob:   { password: 'bob123',   name: 'Bob Reddy',   balance: 5000  },
};

const transactions = []; // {from, to, amount, note, timestamp}
const tokens = {};       // {token: username}

// Helper: random token generate
function generateToken() {
  return 'tok_' + Math.random().toString(36).substring(2, 15);
}

// Middleware: token verify
function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !tokens[token]) {
    return res.status(401).json({ error: 'Unauthorized — please login' });
  }
  req.username = tokens[token];
  next();
}

// ============================================
// Routes
// ============================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Banking API running' });
});

// LOGIN
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = users[username];

  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const token = generateToken();
  tokens[token] = username;

  res.json({
    token,
    username,
    name: user.name,
  });
});

// GET BALANCE
app.get('/api/balance', authenticate, (req, res) => {
  const user = users[req.username];
  res.json({
    username: req.username,
    name: user.name,
    balance: user.balance,
  });
});

// GET TRANSACTIONS
app.get('/api/transactions', authenticate, (req, res) => {
  const userTxns = transactions.filter(
    t => t.from === req.username || t.to === req.username
  );
  res.json(userTxns.reverse()); // Latest first
});

// TRANSFER MONEY
app.post('/api/transfer', authenticate, (req, res) => {
  const { to, amount, note } = req.body;
  const from = req.username;
  const sender = users[from];
  const receiver = users[to];

  // Validations
  if (!receiver) {
    return res.status(400).json({ error: 'Recipient not found' });
  }
  if (from === to) {
    return res.status(400).json({ error: 'Cannot transfer to yourself' });
  }
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Amount must be greater than 0' });
  }
  if (sender.balance < amount) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }

  // Execute transfer
  sender.balance -= amount;
  receiver.balance += amount;

  const txn = {
    id: 'txn_' + Date.now(),
    from,
    to,
    amount,
    note: note || '',
    timestamp: new Date().toISOString(),
  };
  transactions.push(txn);

  res.json({
    success: true,
    transaction: txn,
    newBalance: sender.balance,
  });
});

// LOGOUT
app.post('/api/logout', authenticate, (req, res) => {
  const token = req.headers.authorization.replace('Bearer ', '');
  delete tokens[token];
  res.json({ success: true });
});

// ============================================
// Start Server
// ============================================
app.listen(PORT, () => {
  console.log(`🏦 Banking API running at http://localhost:${PORT}`);
  console.log(`👥 Test users: alice/alice123, bob/bob123`);
});