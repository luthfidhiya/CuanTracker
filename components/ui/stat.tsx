import { Amount, type AmountTone } from "./amount";
import { Card } from "./misc";

export function Stat({ label, value, tone = "neutral" }: { label: string; value: number; tone?: AmountTone }) {
  return (
    <Card className="px-4 py-3">
      <p className="text-xs text-muted">{label}</p>
      {/* Wrap rather than truncate: a cut-off amount is worse than a two-line one. */}
      <Amount value={value} tone={tone} className="mt-1 block whitespace-normal wrap-anywhere text-base font-semibold" />
    </Card>
  );
}
