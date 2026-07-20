// Buckets timestamps into daily counts for the last `days` days (inclusive of today).
// Pulled out of the analytics route so it can be unit tested without a database.
export function bucketByDay(
  timestamps: Date[],
  days: number,
  now: Date = new Date()
): { date: string; count: number }[] {
  const buckets: { date: string; count: number }[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = day.toISOString().slice(0, 10);
    buckets.push({
      date: key,
      count: timestamps.filter((t) => t.toISOString().slice(0, 10) === key).length,
    });
  }

  return buckets;
}
