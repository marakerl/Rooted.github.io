import { useState } from "react";
import { Download } from "lucide-react";
import { format, subDays, startOfDay } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Preset = "7" | "30" | "all" | "custom";

export default function Export() {
  const [preset, setPreset] = useState<Preset>("30");
  const [from, setFrom] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [to, setTo] = useState(format(new Date(), "yyyy-MM-dd"));
  const [busy, setBusy] = useState(false);

  const range = (): { from?: string; to?: string } => {
    if (preset === "all") return {};
    if (preset === "7") return { from: startOfDay(subDays(new Date(), 7)).toISOString() };
    if (preset === "30") return { from: startOfDay(subDays(new Date(), 30)).toISOString() };
    return { from: new Date(from).toISOString(), to: new Date(to + "T23:59:59").toISOString() };
  };

  const exportCsv = async () => {
    setBusy(true);
    try {
      const { from: f, to: t } = range();
      let mq = supabase
        .from("meals")
        .select("id, eaten_at, before_rating, before_comment, after_rating, after_comment, meal_foods(foods(name))")
        .order("eaten_at", { ascending: true });
      if (f) mq = mq.gte("eaten_at", f);
      if (t) mq = mq.lte("eaten_at", t);
      let cq = supabase.from("checkins").select("felt_at, rating, comment").order("felt_at", { ascending: true });
      if (f) cq = cq.gte("felt_at", f);
      if (t) cq = cq.lte("felt_at", t);
      const [{ data: meals, error: e1 }, { data: checkins, error: e2 }] = await Promise.all([mq, cq]);
      if (e1 || e2) throw e1 ?? e2;

      const lines: string[] = [];
      lines.push("type,datetime,foods,before_rating,before_comment,after_rating,after_comment,checkin_rating,checkin_comment");
      (meals ?? []).forEach((m: any) => {
        const foods = (m.meal_foods ?? []).map((mf: any) => mf.foods?.name).filter(Boolean).join("; ");
        lines.push([
          "meal",
          m.eaten_at,
          foods,
          m.before_rating ?? "",
          m.before_comment ?? "",
          m.after_rating ?? "",
          m.after_comment ?? "",
          "", "",
        ].map(csv).join(","));
      });
      (checkins ?? []).forEach((c: any) => {
        lines.push(["checkin", c.felt_at, "", "", "", "", "", c.rating, c.comment ?? ""].map(csv).join(","));
      });

      const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rooted-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${(meals?.length ?? 0)} meals + ${(checkins?.length ?? 0)} check-ins`);
    } catch (e: any) {
      toast.error(e?.message ?? "Export failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <header>
        <h1 className="font-display text-3xl font-semibold">Export</h1>
        <p className="text-muted-foreground mt-1">Download your meals and check-ins as CSV.</p>
      </header>
      <Card>
        <CardContent className="p-5 space-y-4">
          <div>
            <Label>Period</Label>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {(["7", "30", "all", "custom"] as Preset[]).map((p) => (
                <Button key={p} type="button" variant={preset === p ? "default" : "outline"} onClick={() => setPreset(p)} size="sm">
                  {p === "7" ? "7 days" : p === "30" ? "30 days" : p === "all" ? "All time" : "Custom"}
                </Button>
              ))}
            </div>
          </div>
          {preset === "custom" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="from">From</Label>
                <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="to">To</Label>
                <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="mt-1.5" />
              </div>
            </div>
          )}
          <Button onClick={exportCsv} disabled={busy} size="lg" className="w-full">
            <Download className="h-4 w-4" /> {busy ? "Preparing…" : "Download CSV"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function csv(v: any) {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
