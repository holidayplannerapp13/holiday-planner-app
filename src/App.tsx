import React, { useState } from "react";
import culturalHolidayData from "./data/cultural-holidays.json";
import calendarificHolidayData from "./data/calendarific-holidays.json";
import countryTable from "./data/countryTable.json";
import type { Holiday } from "./types";
import "./styles.css";

const codeToName = new Map<string, string>();
countryTable.countries.forEach((c: { code: string; name: string }) => {
  codeToName.set(c.code.toUpperCase(), c.name);
});

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

interface WeekRow {
  week: string;
  lessons: string;
  concepts: string;
  holidayIntegrations: string;
  assessment: string;
  importantDates: string;
}

const App: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [year, setYear] = useState("2025");
  const [allHolidays, setAllHolidays] = useState<Holiday[]>([]);
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [weekData, setWeekData] = useState<WeekRow[]>([]);

  const generateWeeks = (monthIdx: number): WeekRow[] => {
    const rows: WeekRow[] = [];
    const cursor = new Date(+year, monthIdx, 1);
    let wk = 1;
    while (cursor.getMonth() === monthIdx) {
      const start = new Date(cursor);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);

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

  const handleMonthSelect = async (monthLabel: string) => {
    const monthIdx = MONTHS.indexOf(monthLabel);
    setSelectedMonth(monthLabel);
    setSelectedCountries([]);
    setWeekData([]);

    const calendarificHolidays = (calendarificHolidayData as Holiday[]).filter((h) => {
      const d = new Date(h.date);
      return d.getFullYear() === +year && d.getMonth() === monthIdx;
    });

    const culturalHolidays = (culturalHolidayData as Holiday[]).filter((h) => {
      const d = new Date(h.date);
      return d.getFullYear() === +year && d.getMonth() === monthIdx;
    });

    const merged = [...calendarificHolidays, ...culturalHolidays].map((h) => {
      const fullName = codeToName.get(h.country.toUpperCase()) ?? h.country;
      return { ...h, country: fullName };
    });

    setAllHolidays(merged);
    const names = Array.from(new Set(merged.map((h) => h.country))).sort();
    setAvailableCountries(names);
  };

  const toggleCountry = (name: string) => {
    setSelectedCountries((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    );
  };

  const generateLessonPlan = () => {
    if (!selectedMonth) return;
    const monthIdx = MONTHS.indexOf(selectedMonth);
    const filtered = allHolidays.filter((h) => selectedCountries.includes(h.country));

    const rows = generateWeeks(monthIdx).map((row, i) => {
      const wkStart = new Date(+year, monthIdx, 1 + i * 7);
      const wkEnd = new Date(wkStart);
      wkEnd.setDate(wkStart.getDate() + 6);

      const weekHolidays = filtered.filter((h) => {
        const d = new Date(h.date);
        const match = d >= wkStart && d <= wkEnd;
        if (match) {
          console.log(`✅ Matched holiday: ${h.localName || h.name} (${h.country}) on ${h.date} → week ${row.week}`);
        }
        return match;
      });

      return {
        ...row,
        importantDates: weekHolidays
          .map((h) => `${h.date} — ${h.localName || h.name} (${h.country})`)
          .join("\n"),
      };
    });

    setWeekData(rows);
  };

  const updateCell = (idx: number, field: keyof WeekRow, val: string) => {
    setWeekData((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  return (
    <div className="app">
      <h1>Holiday Planner</h1>

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
            Year: <input value={year} onChange={(e) => setYear(e.target.value)} style={{ width: 80 }} />
          </label>
        </>
      )}

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
                  {[
                    "lessons",
                    "concepts",
                    "holidayIntegrations",
                    "assessment",
                    "importantDates",
                  ].map((field) => (
                    <td key={field}>
                      <textarea
                        value={row[field as keyof WeekRow]}
                        onChange={(e) => updateCell(i, field as keyof WeekRow, e.target.value)}
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
