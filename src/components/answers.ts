// Shapes + colours for answer buttons (contrast checked against the label colour).
export const ANSWER_STYLES = [
  { shape: "▲", bg: "bg-ans-red", text: "text-white", name: "red" },
  { shape: "◆", bg: "bg-ans-blue", text: "text-white", name: "blue" },
  { shape: "●", bg: "bg-ans-amber", text: "text-brand-950", name: "amber" },
  { shape: "■", bg: "bg-ans-purple", text: "text-white", name: "purple" },
] as const;

export const TRUE_FALSE_STYLES = [
  { shape: "✓", bg: "bg-ans-blue", text: "text-white", name: "true" },
  { shape: "✗", bg: "bg-ans-red", text: "text-white", name: "false" },
] as const;

export function stylesFor(type: "multiple" | "truefalse") {
  return type === "truefalse" ? TRUE_FALSE_STYLES : ANSWER_STYLES;
}
