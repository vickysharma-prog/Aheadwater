type Day = { date: string; risk: number; rain_mm: number };
type Lab = { date: string; ecoli: number; ie: number; bad: number };

/** Daily risk (line) over daily rain (bars), with the Watch level and the lab samples marked. */
export function RiskChart({ days, usual, lab, eventDay }: { days: Day[]; usual: number; lab: Lab[]; eventDay: string }) {
  const W = 640, H = 220, L = 40, R = 40, T = 12, B = 28;
  const x = (i: number) => L + (i / (days.length - 1)) * (W - L - R);
  const maxRisk = Math.max(0.1, ...days.map((d) => d.risk)) * 1.1;
  const maxRain = Math.max(15, ...days.map((d) => d.rain_mm));
  const yr = (v: number) => T + (1 - v / maxRisk) * (H - T - B);
  const yb = (v: number) => (v / maxRain) * (H - T - B) * 0.45;
  const watch = usual * 5;
  const line = days.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${yr(d.risk).toFixed(1)}`).join("");
  const bw = ((W - L - R) / days.length) * 0.6;

  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Daily risk and rain at the site in May 2021">
        {days.map((d, i) => (
          <rect key={d.date} x={x(i) - bw / 2} y={H - B - yb(d.rain_mm)} width={bw} height={yb(d.rain_mm)} fill="#bfdbfe" />
        ))}
        <line x1={L} x2={W - R} y1={yr(watch)} y2={yr(watch)} stroke="#b45309" strokeDasharray="4 3" />
        <text x={W - R + 4} y={yr(watch) + 4} fontSize="10" fill="#b45309">Watch</text>
        <path d={line} pathLength={1} className="draw-line" fill="none" stroke="#0e6f86" strokeWidth="2.2" />
        {days.map((d, i) =>
          d.date === eventDay ? <circle key={d.date} cx={x(i)} cy={yr(d.risk)} r="5" fill="#0e6f86" stroke="white" strokeWidth="2" /> : null,
        )}
        {lab.map((l) => {
          const i = days.findIndex((d) => d.date === l.date);
          return i < 0 ? null : (
            <g key={l.date}>
              <line x1={x(i)} x2={x(i)} y1={T} y2={H - B} stroke={l.bad ? "#b91c1c" : "#94a3b8"} strokeWidth="1" strokeDasharray="2 2" />
              {l.bad ? (
                <text x={x(i) + 4} y={T + 9} fontSize="10" fill="#b91c1c">
                  lab: {Math.max(l.ie, l.ecoli)} cfu/100 ml
                </text>
              ) : null}
            </g>
          );
        })}
        {[0, maxRisk / 2].map((v) => (
          <text key={v} x={L - 6} y={yr(v) + 3} fontSize="10" textAnchor="end" fill="#64748b">
            {(v * 100).toFixed(0)}%
          </text>
        ))}
        {days.map((d, i) =>
          d.date === eventDay || (i % 5 === 0 && Math.abs(i - days.findIndex((x) => x.date === eventDay)) > 2) ? (
            <text key={d.date} x={x(i)} y={H - 10} fontSize="10" textAnchor="middle" fill={d.date === eventDay ? "#0f172a" : "#64748b"}>
              {Number(d.date.slice(8))} May
            </text>
          ) : null,
        )}
      </svg>
      <figcaption className="mt-1 flex flex-wrap gap-4 text-xs text-slate-500">
        <span><span className="mr-1 inline-block h-0.5 w-4 bg-water align-middle" />Next-day risk</span>
        <span><span className="mr-1 inline-block h-2.5 w-2.5 bg-blue-200 align-middle" />Rain, mm</span>
        <span>Dashed lines: lab samples (grey = clean)</span>
      </figcaption>
    </figure>
  );
}
