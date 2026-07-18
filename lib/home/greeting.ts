/**
 * Time-of-day greeting for the dashboard header ("Bom dia, Rafael").
 * Morning: 6am-noon, afternoon: noon-6pm, night: 6pm-6am.
 */
export function getGreeting(date: Date): string {
  const hour = date.getHours();

  if (hour >= 6 && hour < 12) {
    return "Bom dia";
  }
  if (hour >= 12 && hour < 18) {
    return "Boa tarde";
  }
  return "Boa noite";
}
