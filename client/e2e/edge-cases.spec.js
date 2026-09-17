import { test, expect } from '@playwright/test';

/**
 * Хелпер: войти в комнату.
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

test.describe('Edge cases: ROOM_FULL', () => {
  test('5-й участник видит «Комната заполнена»', async ({ browser }) => {
    const contexts = [];
    // 4 успешных входа
    const roomId = await (async () => {
      const first = await browser.newContext();
      contexts.push(first);
      const page = await first.newPage();
      return joinRoom(page, 'U1');
    })();

    for (let i = 2; i <= 4; i++) {
      const ctx = await browser.newContext();
      contexts.push(ctx);
      const page = await ctx.newPage();
      await joinRoom(page, `U${i}`, roomId);
    }

    // 5-й участник
    const ctx5 = await browser.newContext();
    const page5 = await ctx5.newPage();
    await page5.goto(`/room/${roomId}`);
    await page5.getByLabel(/Ваше имя/i).fill('U5');
    await page5.getByRole('button', { name: /Войти/i }).click();

    // Видит баннер «Комната заполнена»
    await expect(page5.getByText(/Комната заполнена/i)).toBeVisible({
      timeout: 5000,
    });
    // И кнопку «Повторить»
    await expect(
      page5.getByRole('button', { name: /Повторить/i })
    ).toBeVisible();

    await Promise.all(contexts.map((c) => c.close()));
    await ctx5.close();
  });
});

test.describe('Edge cases: медиа', () => {
  test('при отказе в медиа показывается баннер, участник в комнате', async ({
    browser,
  }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();

    // Переопределяем getUserMedia ДО захода
    await page.addInitScript(() => {
      navigator.mediaDevices.getUserMedia = () =>
        Promise.reject(
          Object.assign(new Error('denied'), { name: 'NotAllowedError' })
        );
    });

    await page.goto('/');
    await page.getByLabel(/Ваше имя/i).fill('Алекс');
    await page.getByRole('button', { name: /Создать комнату/i }).click();

    // Участник всё равно в комнате
    await expect(page.getByText(/Комната:/i)).toBeVisible();

    // Видит баннер про медиа
    await expect(page.getByText(/Нет доступа/i)).toBeVisible({
      timeout: 5000,
    });

    await ctx.close();
  });
});

test.describe('Edge cases: WebRTC', () => {
  test('без WebRTC показывается баннер «WebRTC не поддерживается»', async ({
    browser,
  }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();

    // Удаляем RTCPeerConnection ДО захода
    await page.addInitScript(() => {
      Object.defineProperty(window, 'RTCPeerConnection', {
        value: undefined,
        writable: false,
        configurable: false,
      });
    });

    await page.goto('/');

    // Видим баннер
    await expect(page.getByText(/WebRTC не поддерживается/i)).toBeVisible();
    // Нет поля имени
    await expect(page.getByLabel(/Ваше имя/i)).not.toBeVisible();

    await ctx.close();
  });
});

test.describe('Edge cases: пустая комната', () => {
  test('после выхода последнего комната удаляется', async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();

    const roomId = await joinRoom(page, 'Алекс');

    // Закрываем контекст (=выход)
    await ctx.close();

    // Небольшая пауза, чтобы сервер удалил комнату
    await new Promise((r) => setTimeout(r, 500));

    // Заходим снова с тем же roomId
    const ctx2 = await browser.newContext();
    const page2 = await ctx2.newPage();
    await joinRoom(page2, 'Борис', roomId);

    // Комната пересоздана — только 1 участник (Борис)
    await expect(page2.getByText(/Участники \(1\)/)).toBeVisible();
    const list = page2.locator('.participants__list');
    await expect(list.getByText('Борис')).toBeVisible();
    await expect(list.getByText('Алекс')).not.toBeVisible();

    await ctx2.close();
  });
});