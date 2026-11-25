import { test, expect } from '@playwright/test';

test.describe('Fase 6 - Fiscal e IRPF', () => {
  test('aprovar apuração de ISS gera lançamento FISCAL no Diário', async ({ page }) => {
    await page.goto('/');
    await page.locator('input[type="email"]').fill('admin@pagamentus.test');
    await page.locator('input[type="password"]').fill('Pagamentus@2026');
    await page.getByRole('button', { name: /entrar/i }).click();

    await page.getByRole('button', { name: 'Fiscal & Imposto de Renda' }).waitFor({ state: 'visible', timeout: 15000 });
    await page.getByRole('combobox', { name: 'Selecionar Empresa' }).selectOption({ label: 'Tecnologia Horizonte S/A (Fictícia)' });
    await page.getByRole('button', { name: 'Fiscal & Imposto de Renda' }).click();

    const rowIss = page.locator('tr', { hasText: 'ISS' }).first();
    await expect(rowIss).toBeVisible({ timeout: 10000 });

    const btnAprovar = rowIss.getByRole('button', { name: /Aprovar/i });
    if (await btnAprovar.isVisible()) {
      await btnAprovar.click();
      await expect(page.getByText(/provisão contábil gerada no Diário/i)).toBeVisible({ timeout: 10000 });
    }

    await page.getByRole('button', { name: 'Contábil & Diário' }).click();
    const rowFiscal = page.locator('tr', { hasText: /Provisão ISS/i }).filter({ hasText: 'FISCAL' }).first();
    await expect(rowFiscal).toBeVisible({ timeout: 10000 });
  });
});
