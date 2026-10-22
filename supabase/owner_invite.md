# Alta del dueño del panel (paso para Mathias — no se ejecuta sin su confirmación del correo)
1. Supabase → Authentication → Users → "Invite user" con el correo que confirme Mathias (propuesto: contacto@southsoftware.cl).
2. Al aceptar la invitación y crear su contraseña, en SQL editor:
   insert into public.staff (user_id, role, display_name)
   select id, 'owner', 'Dueño' from auth.users where email = '<correo confirmado>';
3. Authentication → Providers → Email: desactivar "Allow new users to sign up" (sin registro público).
4. (Recomendado) Activar MFA TOTP y luego poner ADMIN_REQUIRE_MFA=1.
