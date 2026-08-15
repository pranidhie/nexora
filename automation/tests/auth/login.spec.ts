import { test, expect } from '@playwright/test';

test('LOGIN-001 - Login with valid credentials', async ({ page }) => {
  await page.goto('http://localhost:5175/');

  const emailInput = page.locator('#email');
  await emailInput.fill('admin@nexora.com');

  const passwordInput = page.locator('#password');
  await passwordInput.fill('Nexora@123');

  const signInButton = page.locator('button[type="submit"]');
  await signInButton.click();

  const welcomeMessage = page.getByRole('heading', {
    name: 'Welcome, NEXORA Administrator',
  });

  await expect(welcomeMessage).toBeVisible();
});

test('LOGIN-002 - Login with invalid password', async ({ page }) => {
  await page.goto('http://localhost:5175/');

  await page.locator('#email').fill('admin@nexora.com');
  await page.locator('#password').fill('WrongPassword123');

  await page.locator('button[type="submit"]').click();

  const errorMessage = page.getByRole('alert');
  await expect(errorMessage).toHaveText('Invalid email or password.');
});

test('LOGIN-003 - Login with invalid email', async ({ page }) => {
  await page.goto('http://localhost:5175/');

  await page.locator('#email').fill('invalid@nexora.com');
  await page.locator('#password').fill('Nexora@123');

  await page.locator('button[type="submit"]').click();

  const errorMessage = page.getByRole('alert');
  await expect(errorMessage).toHaveText('Invalid email or password.');
});

test('LOGIN-004 - Login with invalid email and invalid password', async ({ page }) => {
  await page.goto('http://localhost:5175/');

  await page.locator('#email').fill('invalid@nexora.com');
  await page.locator('#password').fill('WrongPassword123');

  await page.locator('button[type="submit"]').click();

  const errorMessage = page.getByRole('alert');
  await expect(errorMessage).toHaveText('Invalid email or password.');
});

test('LOGIN-005 - Login with empty email', async ({ page }) => {
  await page.goto('http://localhost:5175/');

  await page.locator('#password').fill('Nexora@123');

  await page.locator('button[type="submit"]').click();

  const errorMessage = page.getByRole('alert');
  await expect(errorMessage).toHaveText('Email and password are required.');
});

test('LOGIN-006 - Login with empty password', async ({ page }) => {
  await page.goto('http://localhost:5175/');

  await page.locator('#email').fill('admin@nexora.com');

  await page.locator('button[type="submit"]').click();

  const errorMessage = page.getByRole('alert');
  await expect(errorMessage).toHaveText('Email and password are required.');
});

test('LOGIN-007 - Login with both fields empty', async ({ page }) => {
  await page.goto('http://localhost:5175/');

  await page.locator('button[type="submit"]').click();

  const errorMessage = page.getByRole('alert');
  await expect(errorMessage).toHaveText('Email and password are required.');
});

test('LOGIN-008 - Password should be masked', async ({ page }) => {
  await page.goto('http://localhost:5175/');

  const passwordInput = page.locator('#password');

  await expect(passwordInput).toHaveAttribute('type', 'password');
});

test('LOGIN-009 - Show and hide password', async ({ page }) => {
  await page.goto('http://localhost:5175/');

  const passwordInput = page.locator('#password');
  const showButton = page.getByRole('button', { name: 'Show' });

  await expect(passwordInput).toHaveAttribute('type', 'password');

  await showButton.click();
  await expect(passwordInput).toHaveAttribute('type', 'text');

  const hideButton = page.getByRole('button', { name: 'Hide' });
  await hideButton.click();

  await expect(passwordInput).toHaveAttribute('type', 'password');
});

test('LOGIN-010 - Logout after successful login', async ({ page }) => {
  await page.goto('http://localhost:5175/');

  await page.locator('#email').fill('admin@nexora.com');
  await page.locator('#password').fill('Nexora@123');
  await page.locator('button[type="submit"]').click();

  const welcomeMessage = page.getByRole('heading', {
    name: 'Welcome, NEXORA Administrator',
  });

  await expect(welcomeMessage).toBeVisible();

  await page.getByRole('button', { name: 'Sign out' }).click();

  await expect(
    page.getByRole('heading', { name: 'Welcome back' }),
  ).toBeVisible();
});