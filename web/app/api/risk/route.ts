// Next-day and day-after risk for the Ghent sites, from today's Open-Meteo forecast.
import { liveRisk } from "@/lib/risk";

export async function GET() {
  try {
    const risks = await liveRisk();
    return Response.json(
      risks.map((r) => ({ id: r.site.id, day: r.day, risk: r.risk, usual: r.usual, level: r.level })),
      { headers: { "cache-control": "public, s-maxage=3600" } },
    );
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 502 });
  }
}
