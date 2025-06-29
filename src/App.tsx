// App.tsx — Calendarific + Cultural holidays, filtered by country + editable planner
import React, { useState } from "react";
import culturalHolidayData from "./data/cultural-holidays.json";
import countryTable from "./data/countryTable.json";
import { getCalendarificHolidays } from "./utils/fetchCalendarificHolidays";
import type { Holiday } from "./types";
import "./styles.css";

interface WeekRow {
  week: string;
  lessons: string;
  concepts: string;
  holidayIntegrations: string;
  assessment: string;
  importantDates: string;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const App: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [year, setYear] = useState("2025");
  const [weekData, setWeekData] = useState<WeekRow[]>([]);
  const [allHolidays, setAllHolidays] = useState<Holiday[]>([]);
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);

  const generateWeeks = (monthIndex: number): WeekRow[] => {
    const d = new Date(parseInt(year), monthIndex, 1);
    const rows: WeekRow[] = [];
    let wk = 1;
    while (d.getMonth() === monthIndex) {
      rows.push({
        week: `${MONTHS[monthIndex]} – Week ${wk}`,
        lessons: "",
        concepts: "",
        holidayIntegrations: "",
        assessment: "",
        importantDates: ""
      });
      d.setDate(d.getDate() + 7);
      wk++;
    }
    return rows;
  };

  const handleMonthSelect = async (monthLabel: string) => {
    const monthIdx = MONTHS.indexOf(monthLabel);
    setSelectedMonth(monthLabel);
    setSelectedCountries([]);

    const calendarificCountries = countryTable.countries.map(c => c.code);
    const calendarificResults = await Promise.all(
      calendarificCountries.map(async (code) => {
        try {
          const res = await getCalendarificHolidays(code);
          return res.filter((h) => {
            const d = new Date(h.date);
            return d.getFullYear() === parseInt(year) && d.getMonth() === monthIdx;
          });
        } catch {
          return [];
        }
      })
    );
    const calendarificHolidays = calendarificResults.flat();

    const culturalHolidays: Holiday[] = (culturalHolidayData as Holiday[]).filter((h) => {
      const d = new Date(h.date);
      return d.getFullYear() === parseInt(year) && d.getMonth() === monthIdx;
    });

    const merged = [...calendarificHolidays, ...culturalHolidays];
    setAllHolidays(merged);

    const countries = Array.from(new Set(merged.map((h) => h.country))).sort();
    setAvailableCountries(countries);
  };

  const handleCountrySelect = (code: string) => {
    setSelectedCountries((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const generateLessonPlan = () => {
    if (!selectedMonth) return;
    const monthIdx = MONTHS.indexOf(selectedMonth);

    const filteredHolidays = allHolidays.filter((h) => selectedCountries.includes(h.country));

    const rows = generateWeeks(monthIdx).map((row) => {
      const wkNum = parseInt(row.week.split(" ")[2]) - 1;
      const weekStart = new Date(parseInt(year), monthIdx, 1 + wkNum * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const weekHolidays = filteredHolidays.filter((h) => {
        const hd = new Date(h.date);
        return hd >= weekStart && hd <= weekEnd;
      });

      return {
        ...row,
        importantDates: weekHolidays
          .map((h) => `${h.date} — ${h.localName || h.name} (${h.country})`)
          .join("\n")
      };
    });

    setWeekData(rows);
  };

  const onCellChange = (idx: number, field: keyof WeekRow, val: string) => {
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
            <button key={m} onClick={() => handleMonthSelect(m)} style={{ margin: 4 }}>{m}</button>
          ))}
          <br />
          <label style={{ marginTop: 12, display: "inline-block" }}>
            Year: <input value={year} onChange={(e) => setYear(e.target.value)} style={{ width: 80 }} />
          </label>
        </>
      )}

      {selectedMonth && availableCountries.length > 0 && selectedCountries.length === 0 && (
        <>
          <h2>Step 2 – Select Countries with Holidays</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {availableCountries.map((c) => (
              <button
                key={c}
                onClick={() => handleCountrySelect(c)}
                style={{
                  padding: "6px 10px",
                  border: "1px solid #333",
                  background: selectedCountries.includes(c) ? "#90cdf4" : "#fff",
                }}
              >
                {c}
              </button>
            ))}
          </div>
          <button onClick={generateLessonPlan} style={{ marginTop: 16 }}>Generate Lesson Plan</button>
        </>
      )}

      {selectedMonth && weekData.length > 0 && (
        <>
          <h2>{selectedMonth} {year} – Lesson Plan</h2>
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
                  {(["lessons", "concepts", "holidayIntegrations", "assessment", "importantDates"] as const).map((field) => (
                    <td key={field}>
                      <textarea
                        value={row[field] as string}
                        onChange={(e) => onCellChange(i, field, e.target.value)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <button onClick={() => window.print()} style={{ marginTop: 16 }}>Print</button>
        </>
      )}
    </div>
  );
};

export default App;
