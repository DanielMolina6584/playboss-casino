import type { WithdrawalStatus } from '@/types';
import { withdrawalStatusLabels } from '@/services/walletService';

const CLS: Record<WithdrawalStatus, string> = {
  pending: 'bg-gold/15 text-gold',
  paid: 'bg-emerald-500/15 text-emerald-400',
  rejected: 'bg-red-500/15 text-red-400',
};

export function WithdrawalStatusBadge({ status }: { status: WithdrawalStatus }) {
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${CLS[status]}`}>{withdrawalStatusLabels[status]}</span>;
}
