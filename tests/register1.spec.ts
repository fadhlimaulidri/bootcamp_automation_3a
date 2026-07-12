import { test, expect } from '@playwright/test';

test('User Unsuccessfully register using existing email', async ({ page }) => {
  await page.goto('https://www.emra.chat/login');
  await expect(page.getByRole('link', { name: 'Emra Emra' })).toBeVisible();

  await page.getByRole('link', { name: 'Sign up' }).click();
  await expect(page.getByRole('button', { name: 'Next' })).toBeVisible();

  await page.getByRole('textbox', { name: 'Email' }).click();
  await page.getByRole('textbox', { name: 'Email' }).fill('sofiaanjarsari@gmail.com');
  await page.getByRole('textbox', { name: 'Password', exact: true }).click();
  await page.getByRole('textbox', { name: 'Password', exact: true }).press('CapsLock');
  await page.getByRole('textbox', { name: 'Password', exact: true }).fill('N');
  await page.getByRole('textbox', { name: 'Password', exact: true }).press('CapsLock');
  await page.getByRole('textbox', { name: 'Password', exact: true }).fill('Nsel@1234');
  await page.getByRole('textbox', { name: 'Confirm Password' }).click();
  await page.getByRole('textbox', { name: 'Confirm Password' }).press('CapsLock');
  await page.getByRole('textbox', { name: 'Confirm Password' }).fill('N');
  await page.getByRole('textbox', { name: 'Confirm Password' }).press('CapsLock');
  await page.getByRole('textbox', { name: 'Confirm Password' }).fill('Nsel@1234');
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('textbox', { name: 'Full Name' }).click();
  await page.getByRole('textbox', { name: 'Full Name' }).press('CapsLock');
  await page.getByRole('textbox', { name: 'Full Name' }).fill('S');
  await page.getByRole('textbox', { name: 'Full Name' }).press('CapsLock');
  await page.getByRole('textbox', { name: 'Full Name' }).fill('Shofia ');
  await page.getByRole('textbox', { name: 'Full Name' }).press('CapsLock');
  await page.getByRole('textbox', { name: 'Full Name' }).fill('Shofia A');
  await page.getByRole('textbox', { name: 'Full Name' }).press('CapsLock');
  await page.getByRole('textbox', { name: 'Full Name' }).fill('Shofia Anjarsari');
  await page.getByRole('textbox', { name: 'Phone Number' }).click();
  await page.getByRole('textbox', { name: 'Phone Number' }).fill('851234567');
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('textbox', { name: 'Company Name' }).click();
  await page.getByRole('textbox', { name: 'Company Name' }).press('CapsLock');
  await page.getByRole('textbox', { name: 'Company Name' }).fill('SHOPEEE');
  await page.getByLabel('Industry').selectOption('ecommerce');
  await page.getByLabel('Company Size').selectOption('1-10');
  await page.getByRole('button', { name: 'Create Account' }).click();
  await expect(page.getByRole('button', { name: 'Shofia Anjarsari' })).toBeVisible();

  await page.getByRole('listitem').filter({ hasText: 'Company registered' }).click();
  await page.getByText('Account created successfully!').click();
});