// src/utils/fetchCalendarificHolidays.ts
import type { Holiday } from "../types";

// Debug all env variables to ensure bundling worked
console.log("🛠 FULL ENV:", import.meta.env);

// ✅ IMPORTANT: This must exactly match the env key set in Netlify/Vercel
const API_KEY = import.meta.env.VITE_CALENDARIFIC_KEY;

// Confirm it's set at build time (should never be undefined in production)
console.log("🔑 CALENDARIFIC API KEY:", API_KEY);

export async function getCalendarificHolidays(countryCode: string): Promise<Holiday[]> {
  const year = new Date().getFullYear();
  const url = `https://calendarific.com/api/v2/holidays?api_key=${API_KEY}&country=${countryCode}&year=${year}`;

  console.log("📅 Fetching Calendarific holidays for:", countryCode, year);
  console.log("🌐 Final URL:", url);

  const res = await fetch(url);
  const json = await res.json();

  if (!json.response || !json.response.holidays) {
    console.error("❌ Invalid response from Calendarific:", json);
    throw new Error("Invalid API response from Calendarific");
  }

  return json.response.holidays.map((h: any) => ({
    date: h.date.iso,
    country: countryCode,
    name: h.name,
    localName: h.name_local || h.name,
  }));
}
