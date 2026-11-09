import { Link } from 'react-router-dom';
import { SectionHeader } from '@/components/home/SectionHeader';

const promos = [
  {
    tag: 'Bienvenida',
    title: 'Bono 100% hasta $200.000',
    text: 'En tu primer depósito. Crea tu cuenta y empieza a jugar.',
    cta: 'Reclamar bono',
    to: '/registro',
    image: '/assets/banners/promo-bono.svg',
  },
  {
    tag: 'Liga BetPlay',
    title: 'Vive la Liga BetPlay',
    text: 'Cuotas para cada fecha del fútbol colombiano.',
    cta: 'Ver partidos',
    to: '/apuestas',
    image: '/assets/banners/promo-liga.svg',
  },
  {
    tag: 'Depósitos',
    title: 'Wompi, PSE y Nequi',
    text: 'Recarga tu saldo en segundos desde tu celular.',
    cta: 'Conocer métodos',
    to: '/#pagos',
    image: '/assets/banners/promo-pagos.svg',
  },
  {
    tag: 'Juego responsable',
    title: 'Juega con límites',
    text: 'Apostar es entretenimiento. Solo para mayores de 18.',
    cta: 'Más información',
    to: '/#juego-responsable',
    image: '/assets/banners/promo-responsable.svg',
  },
];

export function PromoBanners() {
  return (
    <section id="bono" aria-labelledby="promos-title" className="container-page mt-12 sm:mt-16">
      <SectionHeader id="promos-title" eyebrow="Promociones" title="Ofertas para ti" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {promos.map((promo) => (
          <article
            key={promo.title}
            className="group relative isolate flex aspect-[16/10] flex-col justify-end overflow-hidden rounded-2xl border border-white/10 bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-gold sm:aspect-[4/3] lg:aspect-[3/4]"
          >
            <img
              src={promo.image}
              alt=""
              loading="lazy"
              className="absolute inset-0 -z-20 h-full w-full object-cover object-[75%_center] transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-bg-primary via-bg-primary/70 to-transparent" aria-hidden="true" />
            <div className="p-4">
              <span className="text-[11px] font-bold uppercase tracking-widest text-gold">{promo.tag}</span>
              <h3 className="mt-1 text-lg font-extrabold leading-tight text-text-primary">{promo.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-white/70">{promo.text}</p>
              <Link
                to={promo.to}
                className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-gold after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-gold focus-visible:after:rounded-2xl"
              >
                {promo.cta} <span aria-hidden="true">→</span>
              </Link>
            </div>
          </article>
        ))}
      </div>
      <p className="mt-3 text-xs text-text-secondary">
        Promociones sujetas a términos y condiciones. Consúltalas antes de registrarte. Solo mayores de 18 años.
      </p>
    </section>
  );
}
