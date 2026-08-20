export function StarRating({
  value,
  count,
  houses,
}: {
  value: number;
  count?: number;
  houses?: number;
}) {
  const rounded = Math.round(value * 2) / 2;
  const stars = Array.from({ length: 5 }, (_, i) => {
    const n = i + 1;
    if (rounded >= n) return "full";
    if (rounded + 0.5 === n) return "half";
    return "empty";
  });

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="tabular-nums font-semibold text-primary-navy">
        {value.toFixed(1)}
      </span>
      <span className="tracking-tight text-amber-500" aria-hidden>
        {stars.map((s, i) => (
          <span key={i}>{s === "empty" ? "☆" : "★"}</span>
        ))}
      </span>
      {typeof count === "number" ? (
        <span className="text-text-secondary">{count} reviews</span>
      ) : null}
      {typeof houses === "number" ? (
        <span className="text-text-secondary">· {houses} houses</span>
      ) : null}
    </div>
  );
}
