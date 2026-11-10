export function AdminTable({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="card-surface overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-border-subtle text-xs uppercase tracking-wider text-text-secondary">
          <tr>{head.map((h) => <th key={h} scope="col" className="px-4 py-3 font-semibold">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">{children}</tbody>
      </table>
    </div>
  );
}
