import { test, expect } from '@playwright/test';

const ARTIFACT_DIR = 'C:/Users/Sauble/.gemini/antigravity/brain/283220aa-f56c-4fad-a9de-bfa9fe3c839e';

test.describe('Fase 8 - UI/UX, Responsividade (375/768/1440px) e Pendências', () => {
  test('verificar indicadores acionáveis, scrollWidth zero overflow e tirar prints em 1440px, 768px e 375px', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.locator('input[type="email"]').fill('admin@pagamentus.test');
    await page.locator('input[type="password"]').fill('Pagamentus@2026');
    await page.getByRole('button', { name: /entrar/i }).click();

    await expect(page.getByText('Obrigações vencendo (7 dias)')).toBeVisible({ timeout: 15000 });
    await page.getByRole('combobox', { name: 'Selecionar Empresa' }).selectOption({ label: 'Tecnologia Horizonte S/A (Fictícia)' });
    await page.waitForTimeout(800);

    for (const width of [1440, 768, 375]) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForTimeout(300);
      const sw = await page.evaluate(() => document.documentElement.scrollWidth);
      console.log(`VIEWPORT ${width}px -> scrollWidth: ${sw}px`);
      expect(sw).toBeLessThanOrEqual(width);
      await page.screenshot({ path: `${ARTIFACT_DIR}/dashboard-${width}px.png`, fullPage: true });
    }

    await page.setViewportSize({ width: 1440, height: 900 });
    const mainText = await page.locator('main').innerText();
    console.log('=== PAINEL (VISÃO GERAL) ===\n' + mainText);
  });
});
