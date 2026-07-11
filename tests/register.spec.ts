import { test, expect } from '@playwright/test';

test('User unsuccessfully register using existing email @negative @register', async ({ page }) => {
  await page.goto('https://www.emra.chat/login');
  await page.getByRole('link', { name: 'Sign up' }).click();
  await page.getByRole('textbox', { name: 'Email' }).click();
  await page.getByRole('textbox', { name: 'Email' }).fill('fadhlimaulidri@gmail.com');
  await page.getByRole('textbox', { name: 'Password', exact: true }).click();
  await page.getByRole('textbox', { name: 'Password', exact: true }).fill('tester!3');
  await page.getByRole('textbox', { name: 'Confirm Password' }).click();
  await page.getByRole('textbox', { name: 'Confirm Password' }).fill('tester!3');
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('textbox', { name: 'Full Name' }).click();
  await page.getByRole('textbox', { name: 'Full Name' }).fill('Fadhli Maulidri');
  await page.getByRole('textbox', { name: 'Phone Number' }).click();
  await page.getByRole('textbox', { name: 'Phone Number' }).fill('8123123123');
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('textbox', { name: 'Company Name' }).click();
  await page.getByRole('textbox', { name: 'Company Name' }).fill('fadhlis company');
  await page.getByLabel('Industry').selectOption('ecommerce');
  await page.getByLabel('Company Size').selectOption('1-10');
  await page.getByRole('button', { name: 'Create Account' }).click();
  await expect(page.getByText('Create Account')).toBeVisible();
});