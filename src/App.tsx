// src/App.tsx – Final: Lesson Plan Layout + Editable Table + Print Support
import { useState } from "react";
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
      const key = `${MONTHS[d.getMonth()]} – Week ${wk}`;
      (byWeek[key] ??= []).push(h);
    }

    setHolidaysByWeek(byWeek);
    setLoading(false);
  }

  return (
    <div style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1>Holiday Planner</h1>

      {/* Step 1 – Month Picker */}
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

      {/* Step 2 – Country Picker */}
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

      {/* Step 3 – Final Table View */}
      {Object.keys(holidaysByWeek).length > 0 && (
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
                      {holidays.map((h, idx) => {
                        const formatted = new Date(h.date).toISOString().split("T")[0];
                        return (
                          <div key={idx}>
                            {formatted} — {h.localName} ({h.country})
                          </div>
                        );
                      })}
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
