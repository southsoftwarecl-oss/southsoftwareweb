import { test, expect } from '@playwright/test';
import { SB_PORT } from '../playwright.config';

const SB = `http://localhost:${SB_PORT}`;
const MOCK = `http://localhost:${SB_PORT + 1}`;

test.describe.configure({ mode: 'serial' });
test.describe('panel con Supabase Auth (mock): invitación, crear contraseña, recuperación', () => {
  test('login pide correo y ofrece recuperar contraseña', async ({ page }) => {
    await page.goto(`${SB}/admin`);
    await expect(page).toHaveURL(/\/admin\/login$/);
    await expect(page.getByLabel('Correo')).toBeVisible();
    await page.getByRole('link', { name: '¿Olvidaste tu contraseña?' }).click();
    await expect(page).toHaveURL(/\/admin\/recuperar$/);
  });

  test('enlace inválido o vencido vuelve al login con aviso', async ({ page }) => {
    await page.goto(`${SB}/admin/confirmar?token_hash=malo&type=invite`);
    await expect(page).toHaveURL(/\/admin\/login\?e=enlace$/);
    await expect(page.getByText('El enlace no es válido o expiró')).toBeVisible();
    await page.goto(`${SB}/admin/confirmar?token_hash=valido&type=signup`);
    await expect(page).toHaveURL(/e=enlace/);
  });

  test('sin sesión, /admin/clave no se muestra', async ({ page }) => {
    await page.goto(`${SB}/admin/clave`);
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('invitación → crear contraseña (validaciones) → entra al panel → salir → login con la nueva', async ({ page, request }) => {
    await page.goto(`${SB}/admin/confirmar?token_hash=valido&type=invite`);
    await expect(page).toHaveURL(/\/admin\/clave\?nuevo=1$/);
    await expect(page.getByRole('heading', { name: 'Bienvenido al panel' })).toBeVisible();
    await expect(page.getByText('owner@example.com')).toBeVisible();
    await page.screenshot({ path: '/workspace/ss_admin/fase2/05-crear-contrasena-desktop.png', fullPage: true }).catch(() => {});
    await expect(page.getByLabel('Nueva contraseña')).toHaveAttribute('minlength', '10');
    await page.getByLabel('Nueva contraseña').fill('sololetrasaqui');
    await page.getByLabel('Repite la contraseña').fill('sololetrasaqui');
    await page.getByRole('button', { name: 'Guardar y entrar' }).click();
    await expect(page.getByText('Usa letras y números.')).toBeVisible();
    await page.getByLabel('Nueva contraseña').fill('Segura12345');
    await page.getByLabel('Repite la contraseña').fill('Distinta12345');
    await page.getByRole('button', { name: 'Guardar y entrar' }).click();
    await expect(page.getByText('no coinciden')).toBeVisible();
    await page.getByLabel('Nueva contraseña').fill('Segura12345');
    await page.getByLabel('Repite la contraseña').fill('Segura12345');
    await page.getByRole('button', { name: 'Guardar y entrar' }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole('heading', { name: 'Inicio' })).toBeVisible();
    expect((await (await request.get(`${MOCK}/__state`)).json()).password).toBe('Segura12345');
    await page.getByRole('button', { name: 'Salir' }).click();
    await expect(page).toHaveURL(/\/admin\/login$/);
    await expect(page.getByRole('heading', { name: 'Panel South Software' })).toBeVisible();
    await page.getByLabel('Correo').fill('owner@example.com');
    await page.getByLabel('Contraseña', { exact: true }).fill('Segura12345');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL(/\/admin$/);
  });

  test('recuperar contraseña: respuesta genérica y pide el correo a Supabase', async ({ page, request }) => {
    await page.goto(`${SB}/admin/recuperar`);
    await page.getByLabel('Correo').fill('owner@example.com');
    await page.getByRole('button', { name: 'Enviar enlace' }).click();
    await expect(page.getByRole('status')).toContainText('Si el correo pertenece al equipo');
    await page.screenshot({ path: '/workspace/ss_admin/fase2/06-recuperar-enviado-desktop.png', fullPage: true }).catch(() => {});
    expect((await (await request.get(`${MOCK}/__state`)).json()).recovers).toContain('owner@example.com');
    await page.goto(`${SB}/admin/confirmar?token_hash=valido&type=recovery`);
    await expect(page).toHaveURL(/\/admin\/clave$/);
    await expect(page.getByRole('heading', { name: 'Nueva contraseña' })).toBeVisible();
  });
});
