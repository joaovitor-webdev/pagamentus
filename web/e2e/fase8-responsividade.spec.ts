import { test, expect } from '@playwright/test';

const ARTIFACT_DIR = 'C:/Users/Sauble/.gemini/antigravity/brain/283220aa-f56c-4fad-a9de-bfa9fe3c839e';

test.describe('Fase 8 - UI/UX, Responsividade (375/768/1440px) e Pendências', () => {
  test('verificar indicadores acionáveis, cadastros completos e tirar prints em 1440px, 768px e 375px', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.locator('input[type="email"]').fill('admin@pagamentus.test');
    await page.locator('input[type="password"]').fill('Pagamentus@2026');
    await page.getByRole('button', { name: /entrar/i }).click();

    await expect(page.getByText('Obrigações vencendo (7 dias)')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Documentos vencendo (30 dias)')).toBeVisible();

    await page.screenshot({ path: `${ARTIFACT_DIR}/dashboard-1440px.png`, fullPage: true });

    await page.setViewportSize({ width: 768, height: 900 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${ARTIFACT_DIR}/dashboard-768px.png`, fullPage: true });

    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${ARTIFACT_DIR}/dashboard-375px.png`, fullPage: true });

    // Voltar para 1440px e conferir Cadastros (Empresas, Clientes/Fornecedores, Documentos)
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.getByRole('button', { name: 'Cadastros & Documentos' }).click();
    await expect(page.getByRole('button', { name: 'Clientes e Fornecedores' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Documentos & Validade/i })).toBeVisible();
    await page.screenshot({ path: `${ARTIFACT_DIR}/cadastros-1440px.png`, fullPage: true });
  });
});
