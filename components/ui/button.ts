const base =
  "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors";

const variants = {
  primary: "bg-ink text-canvas hover:bg-accent",
  secondary: "border border-line text-ink hover:border-muted",
} as const;

export function buttonClass(variant: keyof typeof variants = "primary") {
  return `${base} ${variants[variant]}`;
}
