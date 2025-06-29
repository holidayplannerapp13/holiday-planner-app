export async function getAllNagerCountries(): Promise<Record<string, string>> {
  const res = await fetch("https://date.nager.at/api/v3/AvailableCountries");
  if (!res.ok) return {};

  const json = await res.json();
  return Object.fromEntries(json.map((entry: any) => [entry.countryCode, entry.name]));
}