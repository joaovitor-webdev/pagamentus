import { test, expect } from '@playwright/test';

test.describe('Fase 5 - Módulo Financeiro', () => {
  test('baixa de título no Financeiro gera lançamento automático no Diário', async ({ page }) => {
    await page.goto('/');
    await page.locator('input[type="email"]').fill('admin@pagamentus.test');
    await page.locator('input[type="password"]').fill('Pagamentus@2026');
    await page.getByRole('button', { name: /entrar/i }).click();

    await page.getByRole('button', { name: 'Contas a Pagar/Receber' }).waitFor({ state: 'visible', timeout: 15000 });
    await page.getByRole('combobox', { name: 'Selecionar Empresa' }).selectOption({ label: 'Tecnologia Horizonte S/A (Fictícia)' });
    await page.getByRole('button', { name: 'Contas a Pagar/Receber' }).click();

    const row = page.locator('tr', { hasText: 'Cliente Alpha Consultoria' }).first();
    await expect(row).toBeVisible({ timeout: 10000 });

    const btnBaixa = row.getByRole('button', { name: /Registrar Baixa/i });
    if (await btnBaixa.isVisible()) {
      await btnBaixa.click();
      await page.getByRole('button', { name: /Confirmar Baixa/i }).click();
      await expect(page.getByText(/lançamento contábil gerado automaticamente/i)).toBeVisible({ timeout: 10000 });
    }

    await page.getByRole('button', { name: 'Contábil & Diário' }).click();
    const rowDiario = page.locator('tr', { hasText: /Recebimento título Cliente Alpha Consultoria/i }).first();
    await expect(rowDiario).toBeVisible({ timeout: 10000 });
    await expect(rowDiario).toContainText('FINANCEIRO');
    await expect(rowDiario).toContainText('12.500,00');
  });
});
