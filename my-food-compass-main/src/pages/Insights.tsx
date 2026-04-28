import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { computeInsights, type FoodInsight } from "@/lib/insights";

const bandStyle = {
  avoid: { label: "Avoid", cls: "bg-destructive text-destructive-foreground", border: "border-destructive/40" },
  watch: { label: "Watch", cls: "bg-accent text-accent-foreground", border: "border-accent/40" },
  safe: { label: "Safe", cls: "bg-primary text-primary-foreground", border: "border-primary/30" },
} as const;

export default function Insights() {
  const [data, setData] = useState<FoodInsight[]>([]);

  useEffect(() => {
    (async () => {
      const [{ data: foods }, { data: meals }, { data: checkins }] = await Promise.all([
        supabase.from("foods").select("id, name"),
        supabase.from("meals").select("id, eaten_at, before_rating, after_rating, meal_foods(food_id)"),
        supabase.from("checkins").select("felt_at, rating"),
      ]);
      setData(computeInsights((foods as any) ?? [], (meals as any) ?? [], (checkins as any) ?? []));
    })();
  }, []);

  const bands: FoodInsight["band"][] = ["avoid", "watch", "safe"];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-4xl font-semibold">Insights</h1>
        <p className="text-muted-foreground mt-2">Patterns in your data, including delayed effects up to 24h after eating.</p>
      </header>

      {data.length === 0 && (
        <Card><CardContent className="p-6 text-center text-muted-foreground">Log a few meals and check-ins to see patterns here.</CardContent></Card>
      )}

      {bands.map((b) => {
        const items = data.filter((i) => i.band === b);
        if (items.length === 0) return null;
        const s = bandStyle[b];
        return (
          <section key={b}>
            <h2 className="font-display text-2xl font-semibold mb-3 capitalize">{s.label} foods</h2>
            <div className="space-y-2">
              {items.map((i) => (
                <Card key={i.food.id} className={`border ${s.border}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <p className="font-semibold text-lg">{i.food.name}</p>
                        <p className="text-xs text-muted-foreground">{i.meals} meal{i.meals !== 1 ? "s" : ""} logged</p>
                      </div>
                      <Badge className={s.cls}>{s.label}</Badge>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-2 text-sm mb-2">
                      <Stat label="Avg after" value={i.avgAfter?.toFixed(1) ?? "–"} />
                      <Stat label="Drop (after−before)" value={i.avgDrop != null ? (i.avgDrop > 0 ? "+" : "") + i.avgDrop.toFixed(1) : "–"} />
                      <Stat label="1–24h follow-up" value={i.delayedAvg?.toFixed(1) ?? "–"} />
                    </div>
                    {i.reasons.length > 0 && (
                      <ul className="text-sm text-muted-foreground list-disc list-inside space-y-0.5">
                        {i.reasons.map((r, idx) => <li key={idx}>{r}</li>)}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-secondary/50 rounded-md px-3 py-2">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="font-semibold">{value}</p>
  </div>
);
