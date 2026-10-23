/** Pantallas de acceso: panel de marca (patrón geométrico sutil, sin fotos) + formulario centrado. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth">
      <div className="auth-brand" aria-hidden="true">
        <svg className="pattern" viewBox="0 0 400 600" preserveAspectRatio="xMidYMid slice">
          <defs><pattern id="g" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0v40" fill="none" stroke="#fff" strokeWidth="1" /></pattern></defs>
          <rect width="400" height="600" fill="url(#g)" /><circle cx="320" cy="140" r="120" fill="none" stroke="#fff" strokeWidth="1.5" /><circle cx="320" cy="140" r="60" fill="none" stroke="#fff" />
        </svg>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative', fontWeight: 600 }}><span className="sb-logo">S</span>South Software</div>
        <div style={{ position: 'relative' }}><h2>Solicitudes, clientes y cobros en un solo lugar.</h2><p>Panel interno del equipo. El acceso es solo por invitación.</p></div>
        <small style={{ position: 'relative' }}>© 2026 South Software</small>
      </div>
      <div className="auth-form"><div className="auth-box"><div className="auth-mlogo"><span className="sb-logo">S</span>South Software</div>{children}</div></div>
    </div>
  );
}
