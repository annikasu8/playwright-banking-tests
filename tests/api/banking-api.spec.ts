import { test, expect } from '@playwright/test';

// Base URL — mana backend running place
const BASE_URL = 'http://localhost:3001';

test.describe('Banking API Tests', () => {

  // ============================================
  // Test 1: Health Check
  // ============================================
  test('GET /api/health - server should be healthy', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/health`);
    
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(body.status).toBe('OK');
    expect(body.message).toBe('Banking API running');
  });

  // ============================================
  // Test 2: Login Success
  // ============================================
  test('POST /api/login - alice can login with correct credentials', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/login`, {
      data: {
        username: 'alice',
        password: 'alice123',
      },
    });

    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(body.username).toBe('alice');
    expect(body.name).toBe('Alice Kumar');
    expect(body.token).toBeTruthy(); // token undi ani check
    expect(body.token).toContain('tok_'); // format correct na
  });

  // ============================================
  // Test 3: Login Failure (Negative Test)
  // ============================================
  test('POST /api/login - wrong password should return 401', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/login`, {
      data: {
        username: 'alice',
        password: 'wrong_password',
      },
    });

    expect(response.status()).toBe(401);
    
    const body = await response.json();
    expect(body.error).toContain('Invalid');
  });

  // ============================================
  // Test 4: Get Balance (Protected Endpoint)
  // ============================================
  test('GET /api/balance - logged in user can see balance', async ({ request }) => {
    // First login to get token
    const loginResponse = await request.post(`${BASE_URL}/api/login`, {
      data: { username: 'alice', password: 'alice123' },
    });
    const { token } = await loginResponse.json();

    // Now use token to get balance
    const response = await request.get(`${BASE_URL}/api/balance`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(response.status()).toBe(200);
    
    const body = await response.json();
expect(body.username).toBe('alice');
expect(body.name).toBe('Alice Kumar');
expect(typeof body.balance).toBe('number');
expect(body.balance).toBeGreaterThanOrEqual(0);
  });

  // ============================================
  // Test 5: Balance Without Token (Security Test)
  // ============================================
  test('GET /api/balance - without token should return 401', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/balance`);
    
    expect(response.status()).toBe(401);
  });

  // ============================================
  // Test 6: Money Transfer (Full Flow)
  // ============================================
  test('POST /api/transfer - alice can transfer money to bob', async ({ request }) => {
    // Step 1: Login as alice
    const loginResponse = await request.post(`${BASE_URL}/api/login`, {
      data: { username: 'alice', password: 'alice123' },
    });
    const { token } = await loginResponse.json();

    // Step 2: Get balance BEFORE transfer
    const beforeResponse = await request.get(`${BASE_URL}/api/balance`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const beforeBalance = (await beforeResponse.json()).balance;

    // Step 3: Transfer ₹500 to bob
    const transferAmount = 500;
    const transferResponse = await request.post(`${BASE_URL}/api/transfer`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        to: 'bob',
        amount: transferAmount,
        note: 'Test transfer from Playwright',
      },
    });

    expect(transferResponse.status()).toBe(200);
    
    const transferBody = await transferResponse.json();
    expect(transferBody.success).toBe(true);
    expect(transferBody.newBalance).toBe(beforeBalance - transferAmount);
  });

  // ============================================
  // Test 7: Insufficient Balance (Negative)
  // ============================================
  test('POST /api/transfer - cannot transfer more than balance', async ({ request }) => {
    const loginResponse = await request.post(`${BASE_URL}/api/login`, {
      data: { username: 'alice', password: 'alice123' },
    });
    const { token } = await loginResponse.json();

    const response = await request.post(`${BASE_URL}/api/transfer`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        to: 'bob',
        amount: 999999, // Way more than alice has
        note: 'Should fail',
      },
    });

    expect(response.status()).toBe(400);
    
    const body = await response.json();
    expect(body.error).toContain('Insufficient');
  });

});