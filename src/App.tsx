// Updated App.tsx to match step-by-step layout flow and CSV-style lesson plan output

import { useState, useMemo } from "react";
import { getCalendarificHolidays } from "./utils/fetchCalendarificHolidays";
import type { Holiday } from "./types";
import countryTable from "./data/countryTable.json";
import culturalHolidays from "./data/cultural-holidays.json";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const CURRENT_YEAR = new Date().getFullYear();
type ByWeek = Record<string, Holiday[]>;

export default function App() {
  const [month, setMonth] = useState<string>("");
  const [year, setYear] = useState<number>(CURRENT_YEAR);
  const [holidaysByWeek, setHolidaysByWeek] = useState<ByWeek>({});
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const availableCountryCodes = useMemo(() => {
    const set = new Set<string>();
    for (const { code } of countryTable.countries as any[]) {
      set.add(code.toUpperCase());
    }
    return Array.from(set);
  }, []);

  const countriesWithHolidays = useMemo(() => {
    const nameToCode = new Map<string, string>();
    for (const { name, code } of countryTable.countries as any[]) {
      nameToCode.set(name.toLowerCase(), code.toUpperCase());
    }
    const idx = MONTHS.indexOf(month);
    const holidays = (culturalHolidays as Holiday[]).filter((h) => {
      const d = new Date(h.date);
      const iso = nameToCode.get((h.country ?? "").toLowerCase());
      return d.getFullYear() === year && d.getMonth() === idx && iso;
    });
    return Array.from(new Set(holidays.map((h) => nameToCode.get((h.country ?? "").toLowerCase())!)));
  }, [month, year]);

  async function handleFetch() {
    if (!month || !countriesWithHolidays.length) return;
    setLoading(true);
    const idx = MONTHS.indexOf(month);
    const fetched: Holiday[] = [];

    for (const code of countriesWithHolidays) {
      try {
        const list = await getCalendarificHolidays(code);
        fetched.push(
          ...list.filter((h) => {
            const d = new Date(h.date);
            return d.getFullYear() === year && d.getMonth() === idx;
          })
        );
      } catch (err) {
        console.error("Calendarific fetch failed", code, err);
      }
    }

    const nameToCode = new Map<string, string>();
    for (const { name, code } of countryTable.countries as any[]) {
      nameToCode.set(name.toLowerCase(), code.toUpperCase());
    }

    const cultural = (culturalHolidays as Holiday[]).filter((h) => {
      const d = new Date(h.date);
      const iso = nameToCode.get((h.country ?? "").toLowerCase());
      return d.getFullYear() === year && d.getMonth() === idx && iso && countriesWithHolidays.includes(iso);
    });

    const all = [...fetched, ...cultural];
    const byWeek: ByWeek = {};
    for (const h of all) {
      const d = new Date(h.date);
      const wk = Math.floor((d.getDate() - 1) / 7) + 1;
      const key = `${MONTHS[d.getMonth()]} – Week ${wk}`;
      (byWeek[key] ??= []).push(h);
    }
    setHolidaysByWeek(byWeek);
    setSelectedCountries(countriesWithHolidays);
    setLoading(false);
  }

  return (
    <div style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1>Holiday Planner</h1>

      {!month ? (
        <section>
          <h2>Choose Month</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {MONTHS.map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMonth(m);
                  setHolidaysByWeek({});
                }}
                style={{ padding: "6px 10px", border: "1px solid #333" }}
              >
                {m}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 12 }}>
            <label>Year: </label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              style={{ width: 90 }}
            />
          </div>
        </section>
      ) : !Object.keys(holidaysByWeek).length ? (
        <section>
          <h2>Fetching Holidays in {month} {year}</h2>
          <p>{countriesWithHolidays.length} countries with holidays found.</p>
          <button disabled={loading} onClick={handleFetch}>
            {loading ? "Loading…" : "View Lesson Plan"}
          </button>
        </section>
      ) : (
        <section>
          <h2>{month} {year} – Lesson Plan</h2>
          <table border={1} cellPadding={6} style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead style={{ background: "#f0f0f0" }}>
              <tr>
                <th style={{ width: 150 }}>Week</th>
                <th style={{ width: 200 }}>Important Data</th>
                <th>Musicianship</th>
                <th>Repertoire</th>
                <th>Movement</th>
                <th>Instrument</th>
                <th>Listening</th>
                <th>Other</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => {
                const wk = `${month} – Week ${i + 1}`;
                const holidays = holidaysByWeek[wk] ?? [];
                return (
                  <tr key={wk}>
                    <td>{wk}</td>
                    <td>
                      {holidays.map((h, idx) => (
                        <div key={idx}>
                          {new Date(h.date).toISOString().split("T")[0]} — {h.localName} ({h.country})
                        </div>
                      ))}
                    </td>
                    <td contentEditable></td>
                    <td contentEditable></td>
                    <td contentEditable></td>
                    <td contentEditable></td>
                    <td contentEditable></td>
                    <td contentEditable></td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <button
            onClick={() => window.print()}
            style={{ marginTop: 24, padding: "6px 12px" }}
          >
            Print
          </button>
        </section>
      )}
    </div>
  );
}
