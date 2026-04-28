import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/StarRating";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Food = { id: string; name: string };

export default function LogMeal() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [foods, setFoods] = useState<Food[]>([]);
  const [selected, setSelected] = useState<Food[]>([]);
  const [query, setQuery] = useState("");
  const [eatenAt, setEatenAt] = useState(() => toLocal(new Date()));
  const [before, setBefore] = useState(0);
  const [beforeNote, setBeforeNote] = useState("");
  const [after, setAfter] = useState(0);
  const [afterNote, setAfterNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.from("foods").select("id, name").order("name").then(({ data }) => setFoods(data ?? []));
  }, []);

  const filtered = foods.filter(
    (f) => f.name.toLowerCase().includes(query.toLowerCase()) && !selected.find((s) => s.id === f.id),
  );
  const exact = foods.find((f) => f.name.toLowerCase() === query.trim().toLowerCase());

  const addNew = async () => {
    if (!query.trim() || !user) return;
    const { data, error } = await supabase
      .from("foods")
      .insert({ name: query.trim(), user_id: user.id })
      .select("id, name")
      .single();
    if (error) return toast.error(error.message);
    setFoods((f) => [...f, data!]);
    setSelected((s) => [...s, data!]);
    setQuery("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (selected.length === 0) return toast.error("Add at least one food");
    setBusy(true);
    const { data: meal, error } = await supabase
      .from("meals")
      .insert({
        user_id: user.id,
        eaten_at: new Date(eatenAt).toISOString(),
        before_rating: before || null,
        before_comment: beforeNote || null,
        after_rating: after || null,
        after_comment: afterNote || null,
      })
      .select("id")
      .single();
    if (error || !meal) {
      setBusy(false);
      return toast.error(error?.message ?? "Failed");
    }
    const rows = selected.map((f) => ({ user_id: user.id, meal_id: meal.id, food_id: f.id }));
    const { error: e2 } = await supabase.from("meal_foods").insert(rows);
    setBusy(false);
    if (e2) return toast.error(e2.message);
    toast.success("Meal logged");
    nav("/");
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <header>
        <h1 className="font-display text-3xl font-semibold">Log a meal</h1>
        <p className="text-muted-foreground mt-1">Capture what you ate and how you felt.</p>
      </header>

      <form onSubmit={submit} className="space-y-5">
        <Card>
          <CardContent className="p-5 space-y-4">
            <Label>Foods eaten</Label>
            {selected.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selected.map((f) => (
                  <Badge key={f.id} className="bg-primary text-primary-foreground gap-1">
                    {f.name}
                    <button type="button" onClick={() => setSelected((s) => s.filter((x) => x.id !== f.id))}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <div className="relative">
              <Input
                placeholder="Search or add a food…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <div className="mt-2 border border-border rounded-md bg-card max-h-48 overflow-auto">
                  {filtered.map((f) => (
                    <button
                      type="button"
                      key={f.id}
                      onClick={() => { setSelected((s) => [...s, f]); setQuery(""); }}
                      className="w-full text-left px-3 py-2 hover:bg-secondary text-sm"
                    >
                      {f.name}
                    </button>
                  ))}
                  {!exact && query.trim() && (
                    <button
                      type="button"
                      onClick={addNew}
                      className="w-full text-left px-3 py-2 hover:bg-secondary text-sm flex items-center gap-2 text-primary font-medium"
                    >
                      <Plus className="h-4 w-4" /> Add "{query.trim()}"
                    </button>
                  )}
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="eaten">When</Label>
              <Input id="eaten" type="datetime-local" value={eatenAt} onChange={(e) => setEatenAt(e.target.value)} className="mt-1.5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-3">
            <Label>How you felt before eating</Label>
            <StarRating value={before} onChange={setBefore} />
            <Textarea placeholder="Optional notes…" value={beforeNote} onChange={(e) => setBeforeNote(e.target.value)} rows={2} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-3">
            <Label>How you felt after eating</Label>
            <StarRating value={after} onChange={setAfter} />
            <Textarea placeholder="Optional notes (you can come back to add this later)…" value={afterNote} onChange={(e) => setAfterNote(e.target.value)} rows={2} />
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={busy} size="lg" className="flex-1">{busy ? "Saving…" : "Save meal"}</Button>
          <Button type="button" variant="ghost" onClick={() => nav(-1)}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}

function toLocal(d: Date) {
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}
