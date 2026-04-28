import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Utensils, HeartPulse, TrendingDown, Sprout } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { computeInsights, type FoodInsight } from "@/lib/insights";

type RecentMeal = {
  id: string;
  eaten_at: string;
  after_rating: number | null;
  before_rating: number | null;
  meal_foods: { foods: { name: string } }[];
};

const Index = () => {
  const [recent, setRecent] = useState<RecentMeal[]>([]);
  const [topAvoid, setTopAvoid] = useState<FoodInsight[]>([]);

  useEffect(() => {
    (async () => {
      const { data: meals } = await supabase
        .from("meals")
        .select("id, eaten_at, before_rating, after_rating, meal_foods(food_id, foods(name))")
        .order("eaten_at", { ascending: false })
        .limit(5);
      setRecent((meals as any) ?? []);

      const [{ data: foods }, { data: allMeals }, { data: checkins }] = await Promise.all([
        supabase.from("foods").select("id, name"),
        supabase.from("meals").select("id, eaten_at, before_rating, after_rating, meal_foods(food_id)"),
        supabase.from("checkins").select("felt_at, rating"),
      ]);
      const insights = computeInsights((foods as any) ?? [], (allMeals as any) ?? [], (checkins as any) ?? []);
      setTopAvoid(insights.filter((i) => i.band === "avoid").slice(0, 3));
    })();
  }, []);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm text-muted-foreground">{format(new Date(), "EEEE, MMMM d")}</p>
        <h1 className="font-display text-4xl font-semibold mt-1">Today</h1>
        <p className="text-muted-foreground mt-2">A quiet moment to listen to your body.</p>
      </header>

      <div className="grid sm:grid-cols-3 gap-3">
        <Link to="/log-meal">
          <Card className="hover:shadow-leaf transition-shadow cursor-pointer border-border/60">
            <CardContent className="p-5 flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-gradient-leaf flex items-center justify-center">
                <Utensils className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">Log a meal</h3>
                <p className="text-xs text-muted-foreground">Before & after rating</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/checkin">
          <Card className="hover:shadow-leaf transition-shadow cursor-pointer border-border/60">
            <CardContent className="p-5 flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-accent flex items-center justify-center">
                <HeartPulse className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">Quick check-in</h3>
                <p className="text-xs text-muted-foreground">How do you feel now?</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/foods">
          <Card className="hover:shadow-leaf transition-shadow cursor-pointer border-border/60">
            <CardContent className="p-5 flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-secondary flex items-center justify-center">
                <Sprout className="h-5 w-5 text-secondary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">Foods library</h3>
                <p className="text-xs text-muted-foreground">Manage what you eat</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-2xl font-semibold">Recent meals</h2>
          <Link to="/log-meal"><Button variant="ghost" size="sm">+ New</Button></Link>
        </div>
        {recent.length === 0 ? (
          <Card><CardContent className="p-6 text-center text-muted-foreground">No meals logged yet. Start with your first one.</CardContent></Card>
        ) : (
          <div className="space-y-2">
            {recent.map((m) => (
              <Card key={m.id} className="border-border/60">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">{format(new Date(m.eaten_at), "MMM d, HH:mm")}</p>
                    <p className="font-medium truncate">{m.meal_foods.map((mf) => mf.foods?.name).filter(Boolean).join(", ") || "(no foods)"}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {m.before_rating != null && <Badge variant="secondary">before {m.before_rating}</Badge>}
                    {m.after_rating != null && <Badge className="bg-primary text-primary-foreground">after {m.after_rating}</Badge>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {topAvoid.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="h-5 w-5 text-destructive" />
            <h2 className="font-display text-2xl font-semibold">Watch out</h2>
          </div>
          <div className="space-y-2">
            {topAvoid.map((i) => (
              <Card key={i.food.id} className="border-destructive/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold">{i.food.name}</p>
                    <Badge variant="destructive">avoid</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{i.reasons[0]}</p>
                </CardContent>
              </Card>
            ))}
            <Link to="/insights" className="text-sm text-primary hover:underline inline-block mt-2">See all insights →</Link>
          </div>
        </section>
      )}
    </div>
  );
};

export default Index;
