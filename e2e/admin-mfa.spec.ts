import { test, expect, type Page } from '@playwright/test';
import { MFA_PORT, SB_PORT } from '../playwright.config';

const M = `http://localhost:${MFA_PORT}`;
const MMOCK = `http://localhost:${MFA_PORT + 1}`;
const SB = `http://localhost:${SB_PORT}`;
const SBMOCK = `http://localhost:${SB_PORT + 1}`;

async function login(page: Page, base: string, password: string) {
  await page.goto(`${base}/admin/login`);
  await page.getByLabel('Correo').fill('owner@example.com');
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Entrar' }).click();
}

test.describe.configure({ mode: 'serial' });
test.describe('MFA TOTP', () => {
  test('sin exigencia: Seguridad muestra estado y permite registrar la app', async ({ page, request }) => {
    const { password } = await (await request.get(`${SBMOCK}/__state`)).json();
    await request.get(`${SBMOCK}/__reset_mfa`);
    await login(page, SB, password);
    await expect(page).toHaveURL(new RegExp(`${SB}/admin$`));
    await page.goto(`${SB}/admin/seguridad`);
    await expect(page.getByTestId('mfa-state')).toContainText('Aún no activada');
    await expect(page.getByTestId('mfa-state')).toContainText('Todavía no es obligatoria');
    await page.getByRole('button', { name: 'Activar verificación en dos pasos' }).click();
    await expect(page.getByRole('img', { name: /Código QR/ })).toBeVisible();
    await page.getByLabel('Código de 6 dígitos').fill('000000');
    await page.getByRole('button', { name: 'Confirmar y activar' }).click();
    await expect(page.getByText('Código incorrecto')).toBeVisible();
    await page.getByLabel('Código de 6 dígitos').fill('123 456');
    await page.getByRole('button', { name: 'Confirmar y activar' }).click();
    await expect(page.getByText('tu app quedó registrada')).toBeVisible();
    await page.reload();
    await expect(page.getByTestId('mfa-state')).toContainText('Activada en tu cuenta');
    await expect(page.getByRole('list', { name: 'Apps registradas' }).getByRole('listitem')).toHaveCount(1);
    await request.get(`${SBMOCK}/__reset_mfa`); // no afectar otras pruebas
  });

  test('con ADMIN_REQUIRE_MFA=1 y sin factor: se enrola en /admin/mfa (no queda bloqueado), luego exige el código', async ({ page, request }) => {
    await request.get(`${MMOCK}/__reset_mfa`);
    await page.goto(`${M}/admin`);
    await expect(page).toHaveURL(/\/admin\/login/);
    await login(page, M, 'Inicial123456');
    await expect(page).toHaveURL(/\/admin\/mfa$/);
    await expect(page.getByRole('heading', { name: 'Activa la verificación en dos pasos' })).toBeVisible();
    // sin aal2 el panel no se muestra
    await page.goto(`${M}/admin/solicitudes`);
    await expect(page).toHaveURL(/\/admin\/mfa$/);
    await page.getByRole('button', { name: 'Activar verificación en dos pasos' }).click();
    await page.getByLabel('Código de 6 dígitos').fill('123456');
    await page.getByRole('button', { name: 'Confirmar y activar' }).click();
    await expect(page).toHaveURL(new RegExp(`${M}/admin$`));
    await page.goto(`${M}/admin/seguridad`);
    await expect(page.getByTestId('mfa-state')).toContainText('Obligatoria para todo el equipo');
    // no puede quitar su único factor con la exigencia activa
    page.once('dialog', (d) => d.accept());
    await page.getByRole('button', { name: /^Quitar / }).click();
    await expect(page.getByText('no puedes quitar tu único factor')).toBeVisible();
    // salir y volver a entrar: pide el código
    await page.getByRole('button', { name: 'Salir' }).click();
    await login(page, M, 'Inicial123456');
    await expect(page).toHaveURL(/\/admin\/mfa$/);
    await expect(page.getByRole('heading', { name: 'Verificación en dos pasos' })).toBeVisible();
    await page.getByLabel('Código de 6 dígitos').fill('111111');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.getByText('Código incorrecto o vencido')).toBeVisible();
    await page.getByLabel('Código de 6 dígitos').fill('123456');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL(new RegExp(`${M}/admin$`));
  });
});
