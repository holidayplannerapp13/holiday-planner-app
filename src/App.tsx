// App.tsx – Cross‑year fix + "United States" fix ONLY

import React, { useState, useEffect } from "react";
import culturalHolidayData from "./data/cultural-holidays.json";
import calendarificHolidayData from "./data/calendarific-holidays.json";
import countryTable from "./data/countryTable.json";
import type { Holiday } from "./types";
import "./styles.css";

/* ──────────────────────────────── */
const codeToName = new Map<string, string>();
countryTable.countries.forEach((c: { code: string; name: string }) => {
  codeToName.set(c.code.toUpperCase(), c.name);
});

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const GRADES = ["K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

interface WeekRow {
  week: string;
  lessons: string;
  concepts: string;
  holidayIntegrations: string;
  assessment: string;
  importantDates: string;
  _start: Date;
}
interface Timeframe {
  label: string;
  start: string;
  end: string;
}

/* ──────────────────────────────── */
const App: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [year, setYear] = useState("2025");
  const [allHolidays, setAllHolidays] = useState<Holiday[]>([]);
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [step, setStep] = useState(1);
  const [weekDataSets, setWeekDataSets] = useState<Record<string, WeekRow[]>>({});

  const [semester1, setSemester1] = useState<Timeframe>({ label: "Semester 1", start: "", end: "" });
  const [semester2, setSemester2] = useState<Timeframe>({ label: "Semester 2", start: "", end: "" });
  const [summer, setSummer] = useState<Timeframe>({ label: "Summer", start: "", end: "" });

  /* Load holidays for all years needed by the defined timeframes */
  useEffect(() => {
    const rangeYears = new Set<number>();
    const tfDates = [semester1, semester2, summer];
    tfDates.forEach(tf => {
      if (tf.start && tf.end) {
        const startYear = new Date(tf.start).getFullYear();
        const endYear = new Date(tf.end).getFullYear();
        for (let y = startYear; y <= endYear; y++) rangeYears.add(y);
      }
    });

    const fallbackYear = +year;
    if (rangeYears.size === 0) {
      rangeYears.add(fallbackYear);
      rangeYears.add(fallbackYear + 1);
    }

    const holidays = [...calendarificHolidayData, ...culturalHolidayData]
      .filter(h => rangeYears.has(new Date(h.date).getFullYear()))
      .map(h => {
        const key = h.country.length === 2 ? h.country.toUpperCase() : h.country;
        return {
          ...h,
          country: codeToName.get(key) ?? (key === "US" ? "United States" : h.country)
        };
      });

    setAllHolidays(holidays);
  }, [year, semester1, semester2, summer]);

  /* Populate availableCountries but leave none selected by default */
  useEffect(() => {
    if (allHolidays.length) {
      const names = [...new Set(allHolidays.map(h => h.country))].sort();
      setAvailableCountries(names);
      if (selectedCountries.length === 0) setSelectedCountries([]);
    }
  }, [allHolidays]);

  const toggleGrade = (g: string) =>
    setSelectedGrades(p => (p.includes(g) ? p.filter(x => x !== g) : [...p, g]));
  const toggleCountry = (c: string) =>
    setSelectedCountries(p => (p.includes(c) ? p.filter(x => x !== c) : [...p, c]));

  const generateWeeks = (startDate: Date, endDate: Date, label: string): WeekRow[] => {
    const rows: WeekRow[] = [];
    const cursor = new Date(startDate);
    cursor.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    while (cursor <= endDate) {
      const s = new Date(cursor);
      rows.push({
        week: `${label} – Week ${rows.length + 1}`,
        lessons: "",
        concepts: "",
        holidayIntegrations: "",
        assessment: "",
        importantDates: "",
        _start: new Date(s)
      });
      cursor.setDate(cursor.getDate() + 7);
    }
    return rows;
  };

  const generateLessonPlan = () => {
    const filtered = allHolidays.filter(h => selectedCountries.includes(h.country));
    const result: Record<string, WeekRow[]> = {};
    const timeframes = [semester1, semester2, summer];
    const grades = selectedGrades.length ? selectedGrades : [""];
    grades.forEach(grade => {
      timeframes.forEach(t => {
        if (!t.start || !t.end) return;
        const weeks = generateWeeks(new Date(t.start), new Date(t.end), t.label).map(r => {
          const wkStart = new Date(r._start);
          wkStart.setHours(0, 0, 0, 0);
          const wkEnd = new Date(wkStart);
          wkEnd.setDate(wkStart.getDate() + 6);
          const holidayLines = filtered
            .filter(h => {
              const d = new Date(h.date);
              d.setHours(0, 0, 0, 0);
              return d >= wkStart && d <= wkEnd;
            })
            .map(h => `${h.date} — ${h.localName || h.name} (${h.country})`)
            .join("\n");
          return { ...r, importantDates: holidayLines };
        });
        result[grade ? `${t.label} – Grade ${grade}` : t.label] = weeks;
      });
    });
    setWeekDataSets(result);
    setStep(4);
  };

  return (
    <div className="app">
      <h1>Holiday Planner</h1>
      {step === 1 && (
        <>
          <h2>Select Grades</h2>
          <div className="button-grid grades">
            {GRADES.map(g => (
              <button
                key={g}
                className={`grade-button ${selectedGrades.includes(g) ? "selected" : ""}`}
                onClick={() => toggleGrade(g)}
              >
                {g}
              </button>
            ))}
          </div>
          <button onClick={() => setStep(2)}>Next: Choose Timeframe</button>
        </>
      )}
      {step === 2 && (
        <>
          <h2>Choose Month or Define Timeframe</h2>
          <div className="button-grid">
            {MONTHS.map(m => (
              <button
                key={m}
                className={selectedMonth === m ? "selected" : ""}
                onClick={() => setSelectedMonth(selectedMonth === m ? null : m)}
              >
                {m}
              </button>
            ))}
          </div>
          <div>
            <label>
              Year: <input value={year} onChange={e => setYear(e.target.value)} />
            </label>
          </div>
          <div>
            <h3>Custom Timeframes</h3>
            {[semester1, semester2, summer].map((tf, idx) => (
              <div key={tf.label}>
                <strong>{tf.label}</strong>
                <br />
                Start:{" "}
                <input
                  type="date"
                  value={tf.start}
                  onChange={e => {
                    const v = e.target.value;
                    idx === 0
                      ? setSemester1({ ...tf, start: v })
                      : idx === 1
                      ? setSemester2({ ...tf, start: v })
                      : setSummer({ ...tf, start: v });
                  }}
                />
                End:{" "}
                <input
                  type="date"
                  value={tf.end}
                  onChange={e => {
                    const v = e.target.value;
                    idx === 0
                      ? setSemester1({ ...tf, end: v })
                      : idx === 1
                      ? setSemester2({ ...tf, end: v })
                      : setSummer({ ...tf, end: v });
                  }}
                />
              </div>
            ))}
          </div>
          <button onClick={() => setStep(3)}>Next: Choose Countries</button>
        </>
      )}
      {step === 3 && (
        <>
          <h2>Select Relevant Countries</h2>
          <div className="button-grid">
            {availableCountries.map(name => (
              <button
                key={name}
                className={selectedCountries.includes(name) ? "selected" : ""}
                onClick={() => toggleCountry(name)}
              >
                {name}
              </button>
            ))}
          </div>
          <div style={{ marginTop: "1rem" }}>
            <button onClick={generateLessonPlan}>Next: Generate Lesson Plan</button>
          </div>
        </>
      )}
      {step === 4 && (
        <>
          <h2>Lesson Plans</h2>
          {Object.entries(weekDataSets).map(([label, weeks]) => (
            <div key={label}>
              <h3>{label}</h3>
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
                  {weeks.map((row, i) => (
                    <tr key={i}>
                      <td>{row.week}</td>
                      <td>
                        <textarea value={row.lessons} />
                      </td>
                      <td>
                        <textarea value={row.concepts} />
                      </td>
                      <td>
                        <textarea value={row.holidayIntegrations} />
                      </td>
                      <td>
                        <textarea value={row.assessment} />
                      </td>
                      <td>
                        <textarea value={row.importantDates} readOnly />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export default App;
