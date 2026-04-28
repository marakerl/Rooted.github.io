import { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type FoodRow = { id: string; name: string; notes: string | null; meal_count: number };

export default function Foods() {
  const { user } = useAuth();
  const [items, setItems] = useState<FoodRow[]>([]);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const load = async () => {
    const { data: foods } = await supabase.from("foods").select("id, name, notes").order("name");
    const { data: counts } = await supabase.from("meal_foods").select("food_id");
    const map = new Map<string, number>();
    (counts ?? []).forEach((r) => map.set(r.food_id, (map.get(r.food_id) ?? 0) + 1));
    setItems((foods ?? []).map((f) => ({ ...f, meal_count: map.get(f.id) ?? 0 })));
  };

  useEffect(() => { load(); }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;
    const { error } = await supabase.from("foods").insert({ user_id: user.id, name: name.trim(), notes: notes.trim() || null });
    if (error) return toast.error(error.message);
    setName(""); setNotes("");
    toast.success("Food added");
    load();
  };

  const del = async (id: string) => {
    const { error } = await supabase.from("foods").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const saveEdit = async (id: string) => {
    if (!editName.trim()) return;
    const { error } = await supabase.from("foods").update({ name: editName.trim() }).eq("id", id);
    if (error) return toast.error(error.message);
    setEditing(null);
    load();
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <header>
        <h1 className="font-display text-3xl font-semibold">Foods library</h1>
        <p className="text-muted-foreground mt-1">Reusable foods you log meals with.</p>
      </header>

      <Card>
        <CardContent className="p-5">
          <form onSubmit={add} className="flex flex-col sm:flex-row gap-2">
            <Input placeholder="Food name (e.g. oat milk)" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="Notes / tags" value={notes} onChange={(e) => setNotes(e.target.value)} />
            <Button type="submit"><Plus className="h-4 w-4" /> Add</Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {items.length === 0 && <p className="text-muted-foreground text-center py-8">No foods yet.</p>}
        {items.map((f) => (
          <Card key={f.id} className="border-border/60">
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                {editing === f.id ? (
                  <div className="flex gap-2">
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus />
                    <Button size="icon" variant="ghost" onClick={() => saveEdit(f.id)}><Check className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setEditing(null)}><X className="h-4 w-4" /></Button>
                  </div>
                ) : (
                  <>
                    <p className="font-medium">{f.name}</p>
                    {f.notes && <p className="text-xs text-muted-foreground truncate">{f.notes}</p>}
                  </>
                )}
              </div>
              <span className="text-xs text-muted-foreground shrink-0">{f.meal_count} log{f.meal_count !== 1 ? "s" : ""}</span>
              {editing !== f.id && (
                <>
                  <Button size="icon" variant="ghost" onClick={() => { setEditing(f.id); setEditName(f.name); }}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => del(f.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
