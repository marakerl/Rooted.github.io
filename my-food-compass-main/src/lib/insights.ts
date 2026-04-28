// Correlation engine: compute per-food impact from meals + checkins (delayed effect).
import { differenceInHours } from "date-fns";

export type Meal = {
  id: string;
  eaten_at: string;
  before_rating: number | null;
  after_rating: number | null;
  meal_foods: { food_id: string }[];
};
export type Food = { id: string; name: string };
export type Checkin = { felt_at: string; rating: number };

export type FoodInsight = {
  food: Food;
  meals: number;
  avgAfter: number | null;
  avgDrop: number | null; // avg(after - before); negative = feels worse
  delayedAvg: number | null; // avg checkin rating in 1-24h after eating this food
  delayedSamples: number;
  score: number; // higher = worse
  band: "safe" | "watch" | "avoid";
  reasons: string[];
};

const MIN_SAMPLES = 3;
const DELAY_HOURS = 24;

export function computeInsights(foods: Food[], meals: Meal[], checkins: Checkin[]): FoodInsight[] {
  return foods
    .map<FoodInsight>((food) => {
      const fmeals = meals.filter((m) => m.meal_foods.some((mf) => mf.food_id === food.id));
      const afters = fmeals.map((m) => m.after_rating).filter((v): v is number => v != null);
      const drops = fmeals
        .filter((m) => m.before_rating != null && m.after_rating != null)
        .map((m) => (m.after_rating as number) - (m.before_rating as number));

      const avgAfter = afters.length ? mean(afters) : null;
      const avgDrop = drops.length ? mean(drops) : null;

      // Delayed: for each meal of this food, average checkins within 1..DELAY_HOURS after.
      const delayedRatings: number[] = [];
      fmeals.forEach((m) => {
        const eaten = new Date(m.eaten_at);
        checkins.forEach((c) => {
          const h = differenceInHours(new Date(c.felt_at), eaten);
          if (h >= 1 && h <= DELAY_HOURS) delayedRatings.push(c.rating);
        });
      });
      const delayedAvg = delayedRatings.length ? mean(delayedRatings) : null;

      // Score: combine. Higher = worse.
      // - avgAfter below 5 contributes (5 - avgAfter)
      // - negative drop contributes -avgDrop
      // - delayedAvg below 6 contributes (6 - delayedAvg) * 0.7
      let score = 0;
      const reasons: string[] = [];
      if (avgAfter != null) {
        const c = Math.max(0, 5 - avgAfter);
        score += c;
        if (c > 0) reasons.push(`Avg after eating ${avgAfter.toFixed(1)}/10 across ${afters.length} meal${afters.length > 1 ? "s" : ""}`);
      }
      if (avgDrop != null) {
        const c = Math.max(0, -avgDrop);
        score += c;
        if (avgDrop < -0.5) reasons.push(`Drops ${avgDrop.toFixed(1)} pts from before to after (${drops.length} meal${drops.length > 1 ? "s" : ""})`);
      }
      if (delayedAvg != null) {
        const c = Math.max(0, 6 - delayedAvg) * 0.7;
        score += c;
        if (delayedAvg < 6) reasons.push(`Felt ${delayedAvg.toFixed(1)}/10 in the 1–24h after (${delayedRatings.length} check-in${delayedRatings.length > 1 ? "s" : ""})`);
      }

      const enoughData = fmeals.length >= MIN_SAMPLES;
      let band: FoodInsight["band"] = "safe";
      if (enoughData) {
        if (score >= 2) band = "avoid";
        else if (score >= 0.8) band = "watch";
      } else {
        reasons.unshift(`Need ${MIN_SAMPLES - fmeals.length} more log${MIN_SAMPLES - fmeals.length > 1 ? "s" : ""} to judge`);
      }

      return {
        food,
        meals: fmeals.length,
        avgAfter,
        avgDrop,
        delayedAvg,
        delayedSamples: delayedRatings.length,
        score,
        band,
        reasons,
      };
    })
    .sort((a, b) => b.score - a.score);
}

function mean(xs: number[]) {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}
