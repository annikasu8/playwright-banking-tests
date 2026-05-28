import { test, expect } from '@playwright/test';

const FRONTEND_URL = 'http://localhost:5500';

test.describe('Banking App - UI Tests', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(FRONTEND_URL);
  });

  // ============================================
  // Test 1: Login page displays correctly
  // ============================================
  test('login page should display all elements', async ({ page }) => {
    await expect(page).toHaveTitle('Banking App');
    await expect(page.getByRole('heading', { name: '🏦 Banking App' })).toBeVisible();
    await expect(page.getByTestId('username-input')).toBeVisible();
    await expect(page.getByTestId('password-input')).toBeVisible();
    await expect(page.getByTestId('login-btn')).toBeVisible();
  });

  // ============================================
  // Test 2: Successful login
  // ============================================
  test('alice can login with correct credentials', async ({ page }) => {
    await page.getByTestId('username-input').fill('alice');
    await page.getByTestId('password-input').fill('alice123');
    await page.getByTestId('login-btn').click();

    await expect(page.getByTestId('user-name')).toHaveText('Alice Kumar');
    await expect(page.getByTestId('balance')).toBeVisible();
    await expect(page.getByTestId('logout-btn')).toBeVisible();
  });

  // ============================================
  // Test 3: Failed login - wrong password
  // ============================================
  test('login fails with wrong password', async ({ page }) => {
    await page.getByTestId('username-input').fill('alice');
    await page.getByTestId('password-input').fill('wrongpass');
    await page.getByTestId('login-btn').click();

    await expect(page.getByTestId('login-error')).toContainText('Invalid');
    await expect(page.getByTestId('user-name')).not.toBeVisible();
  });

  // ============================================
  // Test 4: Successful money transfer
  // ============================================
  test('alice can transfer money to bob', async ({ page }) => {
    // Login
    await page.getByTestId('username-input').fill('alice');
    await page.getByTestId('password-input').fill('alice123');
    await page.getByTestId('login-btn').click();
    await expect(page.getByTestId('balance')).toBeVisible();

    // Transfer
    await page.getByTestId('recipient-input').fill('bob');
    await page.getByTestId('amount-input').fill('100');
    await page.getByTestId('note-input').fill('UI test transfer');
    await page.getByTestId('transfer-btn').click();

    // Verify
    await expect(page.getByTestId('transfer-message')).toContainText('Transferred');
    await expect(page.getByTestId('transfer-message')).toContainText('100');
  });

  // ============================================
  // Test 5: Insufficient balance error
  // ============================================
  test('shows error when transferring more than balance', async ({ page }) => {
    await page.getByTestId('username-input').fill('alice');
    await page.getByTestId('password-input').fill('alice123');
    await page.getByTestId('login-btn').click();
    await expect(page.getByTestId('balance')).toBeVisible();

    await page.getByTestId('recipient-input').fill('bob');
    await page.getByTestId('amount-input').fill('999999');
    await page.getByTestId('transfer-btn').click();

    await expect(page.getByTestId('transfer-message')).toContainText('Insufficient');
  });

  // ============================================
  // Test 6: Logout flow
  // ============================================
  test('user can logout and return to login', async ({ page }) => {
    await page.getByTestId('username-input').fill('alice');
    await page.getByTestId('password-input').fill('alice123');
    await page.getByTestId('login-btn').click();
    await expect(page.getByTestId('user-name')).toBeVisible();

    await page.getByTestId('logout-btn').click();

    await expect(page.getByTestId('login-btn')).toBeVisible();
    await expect(page.getByTestId('user-name')).not.toBeVisible();
  });

});