/**
 * When the weeks array was closed late (see balanceBrackets), the keys meant for the top level, such as ifThen, end up
 * in a last "week" with no trait. Move them back up.
 */
export function liftStrayKeys(plan: Record<string, unknown>) {
  const weeks = plan.weeks as Record<string, unknown>[];
  while (weeks.length && weeks[weeks.length - 1] && typeof weeks[weeks.length - 1] === "object" && !("trait" in weeks[weeks.length - 1])) {
    const stray = weeks.pop()!;
    for (const [k, v] of Object.entries(stray)) if (!(k in plan)) plan[k] = v;
  }
}
