import { test, expect } from '@playwright/test';

test.describe('StartPage', () => {
  test('открывается и показывает форму', async ({ page }) => {
    await page.goto('/');

    await expect(
      page.getByRole('heading', { name: /Видеочат-комната/i })
    ).toBeVisible();

    await expect(page.getByLabel(/Ваше имя/i)).toBeVisible();
    await expect(
      page.getByRole('button', { name: /Создать комнату/i })
    ).toBeVisible();
  });

  test('создаёт комнату и редиректит на /room/:id', async ({ page }) => {
    await page.goto('/');

    await page.getByLabel(/Ваше имя/i).fill('Алекс');
    await page.getByRole('button', { name: /Создать комнату/i }).click();

    await expect(page).toHaveURL(/\/room\/[A-Za-z0-9_-]{10}$/);
    await expect(page.getByText(/Комната:/i)).toBeVisible();

    await expect(page.getByRole('button', { name: /Микрофон/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Камера/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Ссылка/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Выйти/i })).toBeVisible();
  });
});