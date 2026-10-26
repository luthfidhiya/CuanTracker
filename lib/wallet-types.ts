export const WALLET_TYPES = ["Bank", "E-Wallet", "Cash", "Investment"] as const;

export type WalletType = (typeof WALLET_TYPES)[number];

export const WALLET_TYPE_LABELS: Record<WalletType, string> = {
  Bank: "Bank",
  "E-Wallet": "E-wallet",
  Cash: "Tunai",
  Investment: "Investasi",
};

export function walletTypeLabel(type: string) {
  return WALLET_TYPE_LABELS[type as WalletType] ?? type;
}
