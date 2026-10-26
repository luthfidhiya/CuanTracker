import { Amount, type AmountTone } from "./amount";
import { Card } from "./misc";

export function Stat({
  label,
  value,
  tone = "neutral",
  footer,
}: {
  label: string;
  value: number;
  tone?: AmountTone;
  /** Extra line under the amount, e.g. the change from last month. */
  footer?: React.ReactNode;
}) {
  return (
    <Card className="px-4 py-3">
      <p className="text-xs text-muted">{label}</p>
      {/* Wrap rather than truncate: a cut-off amount is worse than a two-line one. */}
      <Amount value={value} tone={tone} className="mt-1 block whitespace-normal wrap-anywhere text-base font-semibold" />
      {footer}
    </Card>
  );
}
