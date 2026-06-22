import type { GoalKey } from "@/lib/types/assessment";

export const goalOptions: Array<{ key: GoalKey; label: string }> = [
  { key: "fat_loss_metabolic", label: "Fat loss / appetite control / metabolic improvement" },
  { key: "muscle_preservation", label: "Muscle preservation during weight loss" },
  { key: "recovery_injury", label: "Recovery from injury or training stress" },
  { key: "hormone_gh_axis", label: "Hormone-adjacent optimization / GH-axis support" },
  { key: "energy_mitochondrial", label: "Energy / mitochondrial support" },
  { key: "cognition_mood_focus", label: "Cognition / mood / focus" },
  { key: "inflammation_oxidative", label: "Inflammation / oxidative stress" },
  { key: "skin_hair_connective", label: "Skin, hair, or connective tissue support" },
  { key: "general_longevity", label: "General longevity interest" }
];

export const goalLabels = Object.fromEntries(goalOptions.map((goal) => [goal.key, goal.label])) as Record<GoalKey, string>;
