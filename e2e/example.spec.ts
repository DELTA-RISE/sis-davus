import { test, expect } from '@playwright/test';

test('landing page loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/SIS DAVUS/);
    await expect(page.getByText('Controle Total')).toBeVisible();
});

test('login page loads', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible();
});
