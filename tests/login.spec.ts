import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login/login.page';
import dataUser from '../data/user.json'
import { pushTestResultToAgentQ } from '../helper/agentq-helper';


  test.describe('Authentication Tests', () => {
  let testStartTime: number;

  test.beforeEach(async () => {
    testStartTime = Date.now();
  });

  test.afterEach(async ({}, testInfo) => {
    const executionTime = Date.now() - testStartTime;
    const errorDetails = testInfo.errors.map(e => e.message).join('; ');
    const title = testInfo.title ?? 'Unknown test';
    const status = testInfo.status ?? 'unknown';
    await pushTestResultToAgentQ(title, status, executionTime, errorDetails);
  });

test('1 User successfully login using valid credential @login @positive @p0 @smoke', async ({ page }) => {

  // Precondition
  const email = dataUser['regular_user']['email']
  const password = dataUser['regular_user']['password']
  const loginPage = new LoginPage(page)
  await page.goto('https://www.emra.chat/login');

  //Step
  await loginPage.loginAs(email, password)

  // Expected Result
  await expect(page.getByRole('button', { name: 'Tester emra' })).toBeVisible();
});

test('User unsuccessfully login using invalid credential @login @negative @p1', async ({ page }) => {
  // Precondition
  const loginPage = new LoginPage(page)
  await page.goto('https://www.emra.chat/login');

  //Step
  await loginPage.loginAs("testingemrachat@yopmail.com", "tester!12345")

  // Expected Result
  await expect(page.getByText('Invalid credentials')).toBeVisible();
});

});