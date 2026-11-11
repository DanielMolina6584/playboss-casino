import { SectionHeader } from '@/components/home/SectionHeader';

const methods = [
  { name: 'Mercado Pago', detail: 'Checkout seguro', style: 'font-extrabold tracking-tight' },
  { name: 'PSE', detail: 'Débito desde tu banco', style: 'font-black tracking-widest' },
  { name: 'Tarjetas', detail: 'Débito y crédito', style: 'font-bold tracking-wide' },
];

export function PaymentMethods() {
  return (
    <section id="pagos" aria-labelledby="payments-title" className="container-page mt-12 sm:mt-16">
      <div className="card-surface grid gap-6 p-6 hover:bg-card sm:p-8 lg:grid-cols-[1fr_1.4fr] lg:items-center">
        <SectionHeader
          id="payments-title"
          eyebrow="Pagos"
          title="Deposita fácil y seguro"
          description="Métodos locales para recargar tu saldo en segundos y retirar tus ganancias sin complicaciones."
        />
        <ul className="grid gap-3 sm:grid-cols-3">
          {methods.map((m) => (
            <li
              key={m.name}
              className="flex flex-col items-center gap-1 rounded-xl border border-white/10 bg-bg-primary px-4 py-5 text-center"
            >
              <span className={`text-2xl text-gold ${m.style}`}>{m.name}</span>
              <span className="text-xs text-text-secondary">{m.detail}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
