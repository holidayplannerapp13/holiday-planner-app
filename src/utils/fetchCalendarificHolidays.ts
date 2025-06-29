// src/utils/fetchCalendarificHolidays.ts
import type { Holiday } from "../types";

const API_KEY = import.meta.env.VITE_CALENDARIFIC_API_KEY;

export async function getCalendarificHolidays(countryCode: string): Promise<Holiday[]> {
  const year = new Date().getFullYear();
  const url = `https://calendarific.com/api/v2/holidays?api_key=${API_KEY}&country=${countryCode}&year=${year}`;

  const res = await fetch(url);
  const json = await res.json();

  if (!json.response || !json.response.holidays) {
    throw new Error("Invalid API response from Calendarific");
  }

  return json.response.holidays.map((h: any) => ({
    date: h.date.iso,
    country: countryCode,
    name: h.name,
    localName: h.name_local || h.name,
  }));
}
