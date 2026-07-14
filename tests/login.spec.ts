import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';

test('User successfully login using valid credential', async ({ page }) => {

  // Precondition
  const loginPage = new LoginPage(page)
  await page.goto('https://www.emra.chat/login');

  //Step
  await loginPage.loginAs("testingemrachat@yopmail.com", "tester!23")

  // Expected Result
  await expect(page.getByRole('button', { name: 'Tester emra' })).toBeVisible();
});

test('User unsuccessfully login using invalid credential', async ({ page }) => {
  // Precondition
  const loginPage = new LoginPage(page)
  await page.goto('https://www.emra.chat/login');

  //Step
  await loginPage.loginAs("testingemrachat@yopmail.com", "tester!12345")

  // Expected Result
  await expect(page.getByText('Invalid credentials')).toBeVisible();
});