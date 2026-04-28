import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "@/components/StarRating";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function Checkin() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!rating) return toast.error("Add a rating");
    setBusy(true);
    const { error } = await supabase.from("checkins").insert({
      user_id: user.id,
      rating,
      comment: comment || null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Check-in saved");
    nav("/");
  };

  return (
    <div className="space-y-6 max-w-xl">
      <header>
        <h1 className="font-display text-3xl font-semibold">How do you feel right now?</h1>
        <p className="text-muted-foreground mt-1">These standalone check-ins help spot delayed effects.</p>
      </header>
      <form onSubmit={submit}>
        <Card>
          <CardContent className="p-5 space-y-4">
            <div>
              <Label>Rating</Label>
              <div className="mt-2"><StarRating value={rating} onChange={setRating} size="lg" /></div>
            </div>
            <div>
              <Label htmlFor="c">What's going on?</Label>
              <Textarea id="c" value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="Bloated, energetic, foggy…" className="mt-1.5" />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={busy} className="flex-1">{busy ? "Saving…" : "Save check-in"}</Button>
              <Button type="button" variant="ghost" onClick={() => nav(-1)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
