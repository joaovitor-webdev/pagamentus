import { test, expect } from '@playwright/test';

test.describe('Fase 3 (Pendência) - Holerite PDF e Histórico', () => {
  test('gerar holerite do Lucas de 11/2026 e conferir líquido R$ 4.624,05', async ({ page }) => {
    await page.goto('/');
    await page.locator('input[type="email"]').fill('admin@pagamentus.test');
    await page.locator('input[type="password"]').fill('Pagamentus@2026');
    await page.getByRole('button', { name: /entrar/i }).click();

    await page.getByRole('button', { name: 'Folha de Pagamento' }).waitFor({ state: 'visible', timeout: 15000 });
    await page.getByRole('combobox', { name: 'Selecionar Empresa' }).selectOption({ label: 'Tecnologia Horizonte S/A (Fictícia)' });
    await page.getByRole('combobox', { name: 'Competência' }).selectOption('2026-11');
    await page.getByRole('button', { name: 'Folha de Pagamento' }).click();

    await page.getByRole('tab', { name: /4\. Holerite & Histórico/i }).click();

    const cardLucas = page.locator('[data-testid*="holerite-card-Lucas"]').first();
    await expect(cardLucas).toBeVisible({ timeout: 10000 });
    await expect(cardLucas).toContainText('4.624,05');
    await expect(cardLucas).toContainText('Assinatura do Empregado');
    await expect(cardLucas).toContainText('Histórico de Competências');
  });
});
