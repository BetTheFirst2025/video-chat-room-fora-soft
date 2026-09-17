import { test, expect } from '@playwright/test';

/**
 * Хелпер: войти в комнату под именем.
 */
async function joinRoom(page, name, roomId = null) {
  if (roomId) {
    await page.goto(`/room/${roomId}`);
    await page.getByLabel(/Ваше имя/i).fill(name);
    await page.getByRole('button', { name: /Войти/i }).click();
  } else {
    await page.goto('/');
    await page.getByLabel(/Ваше имя/i).fill(name);
    await page.getByRole('button', { name: /Создать комнату/i }).click();
    const url = page.url();
    roomId = url.match(/\/room\/([A-Za-z0-9_-]{10})$/)[1];
  }
  await expect(page.getByText(/Комната:/i)).toBeVisible();
  return roomId;
}

test.describe('Room: 2 участника', () => {
  test('оба видят друг друга в списке участников', async ({ browser }) => {
    const ctxA = await browser.newContext();
    const ctxB = await browser.newContext();
    const pageA = await ctxA.newPage();
    const pageB = await ctxB.newPage();

    const roomId = await joinRoom(pageA, 'Алекс');
    await joinRoom(pageB, 'Мария', roomId);

    // Дать Socket.io время обновить состояние
    await pageA.waitForTimeout(500);
    await pageB.waitForTimeout(500);

    // A видит 2 участника
    await expect(pageA.getByText(/Участники \(2\)/)).toBeVisible();
    const listA = pageA.locator('.participants__list');
    await expect(listA.getByText('Алекс')).toBeVisible();
    await expect(listA.getByText('Мария')).toBeVisible();

    // B видит 2 участника
    await expect(pageB.getByText(/Участники \(2\)/)).toBeVisible();
    const listB = pageB.locator('.participants__list');
    await expect(listB.getByText('Алекс')).toBeVisible();
    await expect(listB.getByText('Мария')).toBeVisible();

    await ctxA.close();
    await ctxB.close();
  });

  test('чат работает в реальном времени', async ({ browser }) => {
    const ctxA = await browser.newContext();
    const ctxB = await browser.newContext();
    const pageA = await ctxA.newPage();
    const pageB = await ctxB.newPage();

    const roomId = await joinRoom(pageA, 'Алекс');
    await joinRoom(pageB, 'Мария', roomId);

    // A отправляет сообщение
    await pageA.getByPlaceholder(/Введите сообщение/i).fill('Привет, Мария!');
    await pageA.getByRole('button', { name: /Отправить/i }).click();

    // B видит
    await expect(pageB.getByText('Привет, Мария!')).toBeVisible({ timeout: 5000 });

    // B отвечает
    await pageB.getByPlaceholder(/Введите сообщение/i).fill('Привет, Алекс!');
    await pageB.getByRole('button', { name: /Отправить/i }).click();

    // A видит
    await expect(pageA.getByText('Привет, Алекс!')).toBeVisible({ timeout: 5000 });

    await ctxA.close();
    await ctxB.close();
  });

  test('toggle микрофона виден другому', async ({ browser }) => {
    const ctxA = await browser.newContext();
    const ctxB = await browser.newContext();
    const pageA = await ctxA.newPage();
    const pageB = await ctxB.newPage();

    const roomId = await joinRoom(pageA, 'Алекс');
    await joinRoom(pageB, 'Мария', roomId);

    // A выключает микрофон
    await pageA.getByRole('button', { name: /Микрофон/i }).click();

    // B видит иконку mute у Алекса (в списке участников)
    const listB = pageB.locator('.participants__list');
    await expect(listB.getByTitle(/Микрофон выключен/i)).toBeVisible({
      timeout: 5000,
    });

    await ctxA.close();
    await ctxB.close();
  });
});

test.describe('Room: 4 участника', () => {
  test('4 участника — сетка 2×2', async ({ browser }) => {
    const contexts = await Promise.all([
      browser.newContext(),
      browser.newContext(),
      browser.newContext(),
      browser.newContext(),
    ]);
    const [pageA, pageB, pageC, pageD] = await Promise.all(
      contexts.map((c) => c.newPage())
    );

    const roomId = await joinRoom(pageA, 'Алекс');
    await joinRoom(pageB, 'Мария', roomId);
    await joinRoom(pageC, 'Иван', roomId);
    await joinRoom(pageD, 'Ольга', roomId);

    await pageA.waitForTimeout(1000);

    await expect(pageA.getByText(/Участники \(4\)/)).toBeVisible();
    await expect(pageA.locator('.video-tile')).toHaveCount(4);
    await expect(pageA.locator('.video-grid--4')).toBeVisible();

    await Promise.all(contexts.map((c) => c.close()));
  });
});