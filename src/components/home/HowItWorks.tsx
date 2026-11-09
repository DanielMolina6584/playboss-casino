import { Link } from 'react-router-dom';
import { SectionHeader } from '@/components/home/SectionHeader';

const steps = [
  { title: 'Regístrate', text: 'Crea tu cuenta gratis en un minuto. Debes ser mayor de 18 años.', icon: '/assets/illustrations/step-register.svg' },
  { title: 'Deposita', text: 'Recarga tu saldo con Wompi, PSE o Nequi de forma segura.', icon: '/assets/illustrations/step-deposit.svg' },
  { title: 'Apuesta y gana', text: 'Elige tu partido, arma tu cupón y sigue la emoción.', icon: '/assets/illustrations/step-bet.svg' },
];

export function HowItWorks() {
  return (
    <section aria-labelledby="how-title" className="container-page mt-12 sm:mt-16">
      <SectionHeader id="how-title" eyebrow="Empieza ya" title="Cómo funciona" description="Tres pasos y estás dentro del juego." />
      <ol className="grid gap-4 md:grid-cols-3">
        {steps.map((step, i) => (
          <li key={step.title} className="card-surface relative overflow-hidden p-6">
            <span className="absolute right-4 top-1 select-none text-7xl font-black text-white/[0.04]" aria-hidden="true">
              {i + 1}
            </span>
            <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-gold/10 ring-1 ring-gold/30">
              <img src={step.icon} alt="" className="h-8 w-8" loading="lazy" />
            </span>
            <h3 className="mt-4 text-lg font-bold text-text-primary">
              <span className="text-gold">{i + 1}.</span> {step.title}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">{step.text}</p>
          </li>
        ))}
      </ol>
      <div className="mt-6 flex justify-center">
        <Link to="/registro" className="btn-primary px-8">
          Crear mi cuenta <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}
