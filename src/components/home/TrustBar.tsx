const items = [
  { title: 'Apuestas seguras', description: 'Tus datos siempre protegidos', icon: '/assets/icons/icon-crown.png' },
  { title: 'Pagos rápidos', description: 'Depósitos y retiros ágiles', icon: '/assets/icons/icon-shield.png' },
  { title: 'Bonos exclusivos', description: 'Las mejores promociones', icon: '/assets/icons/icon-lock.png' },
  { title: 'Juego responsable', description: 'Límites y control para ti', icon: '/assets/icons/icon-trophy.png' },
];

export function TrustBar() {
  return (
    <section id="beneficios" aria-label="Beneficios de PlayBoss" className="container-page mt-4 sm:mt-5">
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {items.map((item) => (
          <li key={item.title} className="card-surface flex flex-col items-start gap-3 p-4 sm:flex-row sm:items-center">
            <img src={item.icon} alt="" className="h-10 w-10 shrink-0 rounded-lg object-contain" loading="lazy" />
            <div>
              <p className="text-sm font-semibold text-text-primary">{item.title}</p>
              <p className="mt-0.5 text-xs leading-snug text-text-secondary">{item.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
