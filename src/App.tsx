// src/App.tsx  – Calendarific edition (Month → Countries → Calendarific + Cultural merge)
import { useEffect, useState } from "react";
import { getCalendarificHolidays } from "./utils/fetchCalendarificHolidays";
import type { Holiday } from "./types";
import countryTable from "./data/countryTable.json";
import culturalHolidays from "./data/cultural-holidays.json";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const CURRENT_YEAR = new Date().getFullYear();

type ByWeek = Record<string, Holiday[]>; // Month‑Week → holidays array

export default function App() {
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [holidaysByWeek, setHolidaysByWeek] = useState<ByWeek>({});
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);
  const [month, setMonth] = useState<string>("");
  const [year, setYear] = useState<number>(CURRENT_YEAR);
  const [loading, setLoading] = useState(false);

  /* -------------------------------------------------
     When a month is chosen, reset state & load every
     valid ISO code from the country table.
  ------------------------------------------------- */
  function handleSelectMonth(m: string) {
    setMonth(m);
    setSelectedCountries([]);
    setHolidaysByWeek({});
    const countrySet = new Set<string>();
    for (const { code } of countryTable.countries as any[]) {
      countrySet.add(code.toUpperCase());
    }
    setAvailableCountries(Array.from(countrySet).sort());
  }

  /* -------------------------------------------------
     Fetch Calendarific holidays + merge cultural
     holidays that match month, year, *and* one of
     the selected ISO codes (using a name→code map).
  ------------------------------------------------- */
  async function handleContinue() {
    if (!selectedCountries.length || !month) return;
    setLoading(true);

    const monthIdx = MONTHS.indexOf(month);
    const fetched: Holiday[] = [];

    // Calendarific slice
    for (const code of selectedCountries) {
      try {
        const list = await getCalendarificHolidays(code);
        fetched.push(
          ...list.filter((h) => {
            const d = new Date(h.date);
            return d.getFullYear() === year && d.getMonth() === monthIdx;
          })
        );
      } catch (err) {
        console.error("Calendarific fetch failed", code, err);
      }
    }

    // Build name→ISO lookup once
    const nameToCode = new Map<string, string>();
    for (const { name, code } of countryTable.countries as any[]) {
      nameToCode.set(name.toLowerCase(), code.toUpperCase());
    }

    // Cultural slice (match month/year & selected ISO codes)
    const cultural = (culturalHolidays as Holiday[]).filter((h) => {
      const d = new Date(h.date);
      const iso = nameToCode.get((h.country ?? "").toLowerCase());
      return (
        d.getFullYear() === year &&
        d.getMonth() === monthIdx &&
        iso && selectedCountries.includes(iso)
      );
    });

    const all = [...fetched, ...cultural];

    // Bucket by week of month
    const byWeek: ByWeek = {};
    for (const h of all) {
      const d = new Date(h.date);
      const wk = Math.floor((d.getDate() - 1) / 7) + 1; // 1‑4/5
      const key = `${MONTHS[d.getMonth()]}-Week${wk}`;
      (byWeek[key] ??= []).push(h);
    }

    setHolidaysByWeek(byWeek);
    setLoading(false);
  }

  /* -------------------------------------------------
     UI
  ------------------------------------------------- */
  return (
    <div style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1>Holiday Planner</h1>

      {/* Step 1 – Month & year */}
      <section style={{ marginBottom: 24 }}>
        <h2>Choose Month</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {MONTHS.map((m) => (
            <button
              key={m}
              onClick={() => handleSelectMonth(m)}
              style={{
                padding: "6px 10px",
                border: "1px solid #333",
                background: m === month ? "#c6f6d5" : "#fff",
              }}
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

      {/* Step 2 – Countries */}
      {month && (
        <section style={{ marginBottom: 24 }}>
          <h2>Select Countries for {month} {year}</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {availableCountries.map((code) => {
              const label = (countryTable.countries as any[]).find((c) => c.code === code)?.name;
              return (
                <button
                  key={code}
                  onClick={() =>
                    setSelectedCountries((prev) =>
                      prev.includes(code)
                        ? prev.filter((c) => c !== code)
                        : [...prev, code]
                    )
                  }
                  style={{
                    padding: "6px 10px",
                    border: "1px solid #333",
                    background: selectedCountries.includes(code) ? "#90cdf4" : "#fff",
                  }}
                >
                  {code} – {label}
                </button>
              );
            })}
          </div>

          <button
            style={{ marginTop: 16, padding: "6px 14px" }}
            disabled={!selectedCountries.length || loading}
            onClick={handleContinue}
          >
            {loading ? "Loading…" : "Continue"}
          </button>
        </section>
      )}

      {/* Results */}
      {Object.keys(holidaysByWeek).length > 0 && (
        <section>
          <h2>Holiday Output by Week</h2>
          {Object.keys(holidaysByWeek)
            .sort()
            .map((wk) => (
              <div key={wk} style={{ marginBottom: 20 }}>
                <h3>{wk}</h3>
                <ul>
                  {holidaysByWeek[wk].map((h, i) => (
                    <li key={i}>
                      {h.date} — {h.localName} ({h.country})
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </section>
      )}
    </div>
  );
}
