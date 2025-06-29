// src/App.tsx
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
type ByWeek = Record<number, Holiday[]>;

export default function App() {
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [holidaysByWeek, setHolidaysByWeek] = useState<ByWeek>({});
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);
  const [month, setMonth] = useState<string>("");
  const [year, setYear] = useState<number>(CURRENT_YEAR);
  const [loading, setLoading] = useState(false);

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

  async function handleContinue() {
    if (!selectedCountries.length || !month) return;
    setLoading(true);

    const monthIdx = MONTHS.indexOf(month);
    const fetched: Holiday[] = [];

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

    const nameToCode = new Map<string, string>();
    for (const { name, code } of countryTable.countries as any[]) {
      nameToCode.set(name.toLowerCase(), code.toUpperCase());
    }

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

    const byWeek: ByWeek = {};
    for (const h of all) {
      const d = new Date(h.date);
      const wk = Math.floor((d.getDate() - 1) / 7) + 1;
      (byWeek[wk] ??= []).push(h);
    }

    setHolidaysByWeek(byWeek);
    setLoading(false);
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1>Holiday Planner</h1>

      {/* Step 1 – Month & Year */}
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

      {/* Step 2 – Countries */}
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

      {/* Step 3 – Results in lesson plan format */}
      {Object.keys(holidaysByWeek).length > 0 && (
        <>
          <h2>Lesson Plan Output: {month} {year}</h2>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20 }} border={1}>
            <thead>
              <tr>
                <th style={{ width: "8%" }}>Week</th>
                <th style={{ width: "15%" }}>Important dates</th>
                <th>Semester 1 - 5 "Art as Culture"</th>
                <th>Lessons</th>
                <th>Concepts</th>
                <th>Holiday Integrations</th>
                <th>Assessment</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => {
                const week = i + 1;
                const holidays = holidaysByWeek[week] || [];
                return (
                  <tr key={week}>
                    <td>Week {week}</td>
                    <td>
                      <textarea
                        defaultValue={holidays.map(h => `${h.date} – ${h.localName} (${h.country})`).join("\n")}
                        style={{ width: "100%", minHeight: 60 }}
                      />
                    </td>
                    <td><textarea style={{ width: "100%" }} /></td>
                    <td><textarea style={{ width: "100%" }} /></td>
                    <td><textarea style={{ width: "100%" }} /></td>
                    <td><textarea style={{ width: "100%" }} /></td>
                    <td><textarea style={{ width: "100%" }} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <button onClick={handlePrint} style={{ padding: "8px 16px" }}>
            Print
          </button>
        </>
      )}
    </div>
  );
}
