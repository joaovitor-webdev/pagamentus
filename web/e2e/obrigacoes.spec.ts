import { test, expect } from '@playwright/test';

test.describe('Fase 7 - Obrigações e Prazos', () => {
  test('gerar calendário 12/2026 da Tecnologia Horizonte e marcar obrigação como entregue com comprovante', async ({ page }) => {
    await page.goto('/');
    await page.locator('input[type="email"]').fill('admin@pagamentus.test');
    await page.locator('input[type="password"]').fill('Pagamentus@2026');
    await page.getByRole('button', { name: /entrar/i }).click();

    await page.getByRole('button', { name: 'Obrigações & Prazos' }).waitFor({ state: 'visible', timeout: 15000 });
    await page.getByRole('combobox', { name: 'Selecionar Empresa' }).selectOption({ label: 'Tecnologia Horizonte S/A (Fictícia)' });
    await page.getByRole('combobox', { name: 'Competência' }).selectOption('2026-12');
    await page.getByRole('button', { name: 'Obrigações & Prazos' }).click();

    await page.getByRole('button', { name: 'Gerar calendário' }).click();
    await expect(page.getByText(/Calendário de 2026-12 gerado/i)).toBeVisible({ timeout: 10000 });

    const btnEntregar = page.getByRole('button', { name: /Marcar Entregue/i }).first();
    await expect(btnEntregar).toBeVisible({ timeout: 10000 });
    await btnEntregar.click();

    await page.getByPlaceholder(/Protocolo/i).fill('Protocolo #2026-12-OK');
    await page.getByRole('button', { name: /Confirmar Entrega/i }).click();
    await expect(page.getByText(/Obrigação marcada como Entregue com comprovante/i)).toBeVisible({ timeout: 10000 });
  });
});
