export function AdminDashboard() {
  return (
    <div className="container-page py-8">
      <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">Panel administrativo</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Área restringida para usuarios con rol <span className="text-gold">admin</span>.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {['Partidos', 'Usuarios', 'Apuestas'].map((item) => (
          <div key={item} className="card-surface p-5">
            <p className="text-sm text-text-secondary">Gestión de</p>
            <p className="text-lg font-semibold text-text-primary">{item}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-dashed border-border-subtle p-6 text-sm text-text-secondary">
        Módulo base listo para conectarse a la API de administración (CRUD de ligas, equipos,
        partidos, cuotas y usuarios).
      </div>
    </div>
  );
}
