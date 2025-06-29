// src/App.tsx — Calendarific + cultural holidays, normalized country names
import React, { useState } from "react";
import culturalHolidayData from "./data/cultural-holidays.json";
import countryTable from "./data/countryTable.json";
import { getCalendarificHolidays } from "./utils/fetchCalendarificHolidays";
import type { Holiday } from "./types";
import "./styles.css";

/* ---------- helpers ---------- */

// quick lookup tables
const codeToName = new Map<string, string>();
const nameToCode = new Map<string, string>();
countryTable.countries.forEach((c: { code: string; name: string }) => {
  codeToName.set(c.code.toUpperCase(), c.name);
  nameToCode.set(c.name, c.code.toUpperCase());
});

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

interface WeekRow {
  week: string;
  lessons: string;
  concepts: string;
  holidayIntegrations: string;
  assessment: string;
  importantDates: string;
}

/* ---------- component ---------- */

const App: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [year, setYear] = useState("2025");

  const [allHolidays, setAllHolidays] = useState<Holiday[]>([]);
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);   // full names
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);     // full names

  const [weekData, setWeekData] = useState<WeekRow[]>([]);

  /* ---- utils ---- */

  const generateWeeks = (monthIdx: number): WeekRow[] => {
    const rows: WeekRow[] = [];
    let wk = 1;
    const cursor = new Date(+year, monthIdx, 1);

    while (cursor.getMonth() === monthIdx) {
      rows.push({
        week: `${MONTHS[monthIdx]} – Week ${wk}`,
        lessons: "",
        concepts: "",
        holidayIntegrations: "",
        assessment: "",
        importantDates: "",
      });
      cursor.setDate(cursor.getDate() + 7);
      wk++;
    }
    return rows;
  };

  /* ---- step 1 ---- */

  const handleMonthSelect = async (monthLabel: string) => {
    const monthIdx = MONTHS.indexOf(monthLabel);
    setSelectedMonth(monthLabel);
    setSelectedCountries([]);
    setWeekData([]);

    /* Calendarific slice */
    const calendarificISO = countryTable.countries.map((c: any) => c.code);
    const calResults = await Promise.all(
      calendarificISO.map(async (code) => {
        try {
          const list = await getCalendarificHolidays(code);
          return list.filter((h) => {
            const d = new Date(h.date);
            return d.getFullYear() === +year && d.getMonth() === monthIdx;
          });
        } catch { return []; }
      }),
    );
    const calendarificHolidays = calResults.flat();

    /* Cultural slice */
    const culturalHolidays: Holiday[] = (culturalHolidayData as Holiday[]).filter((h) => {
      const d = new Date(h.date);
      return d.getFullYear() === +year && d.getMonth() === monthIdx;
    });

    const merged = [...calendarificHolidays, ...culturalHolidays];

    /* Normalise country names */
    const mergedWithNames = merged.map((h) => {
      const fullName = codeToName.get(h.country) ?? h.country;
      return { ...h, country: fullName };           // overwrite country with full name
    });

    setAllHolidays(mergedWithNames);

    const names = Array.from(new Set(mergedWithNames.map((h) => h.country))).sort();
    setAvailableCountries(names);
  };

  /* ---- step 2 ---- */

  const toggleCountry = (name: string) =>
    setSelectedCountries((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name],
    );

  /* ---- step 3 ---- */

  const generateLessonPlan = () => {
    if (!selectedMonth) return;
    const monthIdx = MONTHS.indexOf(selectedMonth);

    const filtered = allHolidays.filter((h) => selectedCountries.includes(h.country));

    const rows = generateWeeks(monthIdx).map((row) => {
      const wkNum = parseInt(row.week.split(" ")[2]) - 1;
      const wkStart = new Date(+year, monthIdx, 1 + wkNum * 7);
      const wkEnd = new Date(wkStart);
      wkEnd.setDate(wkEnd.getDate() + 6);

      const weekHol = filtered.filter((h) => {
        const d = new Date(h.date);
        return d >= wkStart && d <= wkEnd;
      });

      return {
        ...row,
        importantDates: weekHol
          .map((h) => `${h.date} — ${h.localName || h.name} (${h.country})`)
          .join("\n"),
      };
    });

    setWeekData(rows);
  };

  const updateCell = (idx: number, field: keyof WeekRow, val: string) =>
    setWeekData((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });

  /* ---------- render ---------- */

  return (
    <div className="app">
      <h1>Holiday Planner</h1>

      {/* ───────── Step 1 ───────── */}
      {!selectedMonth && (
        <>
          <h2>Step 1 – Choose Month</h2>
          {MONTHS.map((m) => (
            <button key={m} onClick={() => handleMonthSelect(m)} style={{ margin: 4 }}>
              {m}
            </button>
          ))}
          <br />
          <label style={{ marginTop: 12, display: "inline-block" }}>
            Year:{" "}
            <input
              value={year}
              onChange={(e) => setYear(e.target.value)}
              style={{ width: 80 }}
            />
          </label>
        </>
      )}

      {/* ───────── Step 2 ───────── */}
      {selectedMonth && availableCountries.length > 0 && weekData.length === 0 && (
        <>
          <h2>Step 2 – Select Countries with Holidays</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {availableCountries.map((name) => (
              <button
                key={name}
                onClick={() => toggleCountry(name)}
                aria-pressed={selectedCountries.includes(name)}
                style={{
                  padding: "6px 10px",
                  border: "1px solid #333",
                  background: selectedCountries.includes(name) ? "#90cdf4" : "#fff",
                }}
              >
                {name}
              </button>
            ))}
          </div>

          {selectedCountries.length > 0 && (
            <button onClick={generateLessonPlan} style={{ marginTop: 16 }}>
              Generate Lesson Plan
            </button>
          )}
        </>
      )}

      {/* ───────── Step 3 ───────── */}
      {weekData.length > 0 && (
        <>
          <h2>
            {selectedMonth} {year} – Lesson Plan
          </h2>
          <table className="lesson-plan">
            <thead>
              <tr>
                <th>Week</th>
                <th>Lessons</th>
                <th>Concepts</th>
                <th>Holiday Integrations</th>
                <th>Assessment</th>
                <th>Important Dates</th>
              </tr>
            </thead>
            <tbody>
              {weekData.map((row, i) => (
                <tr key={row.week}>
                  <td>{row.week}</td>
                  {(
                    ["lessons","concepts","holidayIntegrations","assessment","importantDates"] as const
                  ).map((field) => (
                    <td key={field}>
                      <textarea
                        value={row[field]}
                        onChange={(e) => updateCell(i, field, e.target.value)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <button onClick={() => window.print()} style={{ marginTop: 16 }}>
            Print
          </button>
        </>
      )}
    </div>
  );
};

export default App;
