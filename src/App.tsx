// App.tsx – Updated for grade selection styling and clarity

import React, { useState, useEffect } from "react";
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
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const GRADES = ["K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

interface WeekRow {
  week: string;
  lessons: string;
  concepts: string;
  holidayIntegrations: string;
  assessment: string;
  importantDates: string;
}

interface Timeframe {
  label: string;
  start: string;
  end: string;
}

const App: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [year, setYear] = useState("2025");
  const [allHolidays, setAllHolidays] = useState<Holiday[]>([]);
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [step, setStep] = useState<number>(1);
  const [weekDataSets, setWeekDataSets] = useState<Record<string, WeekRow[]>>({});

  const [semester1, setSemester1] = useState<Timeframe>({ label: "Semester 1", start: "", end: "" });
  const [semester2, setSemester2] = useState<Timeframe>({ label: "Semester 2", start: "", end: "" });
  const [summer, setSummer] = useState<Timeframe>({ label: "Summer", start: "", end: "" });

  useEffect(() => {
    const holidays = [...calendarificHolidayData, ...culturalHolidayData]
      .filter((h: Holiday) => new Date(h.date).getFullYear() === +year)
      .map((h: Holiday) => ({
        ...h,
        country: codeToName.get(h.country.toUpperCase()) ?? h.country
      }));
    setAllHolidays(holidays);
  }, [year]);

  useEffect(() => {
    if (!selectedMonth && allHolidays.length > 0) {
      const names = Array.from(new Set(allHolidays.map((h) => h.country))).sort();
      setAvailableCountries(names);
      setSelectedCountries(names);
    }
  }, [allHolidays, selectedMonth]);

  const toggleGrade = (grade: string) => {
    setSelectedGrades((prev) =>
      prev.includes(grade) ? prev.filter((g) => g !== grade) : [...prev, grade]
    );
  };

  const toggleCountry = (name: string) => {
    setSelectedCountries((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    );
  };

  const generateWeeks = (startDate: Date, endDate: Date, label: string): WeekRow[] => {
    const rows: WeekRow[] = [];
    const cursor = new Date(startDate);
    let wk = 1;
    while (cursor <= endDate) {
      const weekStart = new Date(cursor);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      rows.push({
        week: `${label} – Week ${wk}`,
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

  const generateLessonPlan = () => {
    const filtered = allHolidays.filter((h) => selectedCountries.includes(h.country));
    const result: Record<string, WeekRow[]> = {};
    const timeframes = [semester1, semester2, summer];
    const grades = selectedGrades.length > 0 ? selectedGrades : [""];

    grades.forEach((grade) => {
      timeframes.forEach((t) => {
        if (!t.start || !t.end || isNaN(Date.parse(t.start)) || isNaN(Date.parse(t.end))) return;

        const start = new Date(t.start);
        const end = new Date(t.end);

        const weeks = generateWeeks(start, end, t.label).map((row, i) => {
          const wkStart = new Date(start);
          wkStart.setDate(wkStart.getDate() + i * 7);
          wkStart.setHours(0, 0, 0, 0);

          const wkEnd = new Date(wkStart);
          wkEnd.setDate(wkStart.getDate() + 6);
          wkEnd.setHours(0, 0, 0, 0);

          const weekHolidays = filtered.filter((h) => {
            const d = new Date(h.date);
            d.setHours(0, 0, 0, 0);
            return d >= wkStart && d <= wkEnd;
          });

          return {
            ...row,
            importantDates: weekHolidays
              .map((h) => `${h.date} — ${h.localName || h.name} (${h.country})`)
              .join("\n"),
          };
        });

        const label = grade ? `${t.label} – Grade ${grade}` : t.label;
        result[label] = weeks;
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
            {GRADES.map((g) => (
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
            {MONTHS.map((m) => (
              <button
                key={m}
                className={selectedMonth === m ? "selected" : ""}
                onClick={() => setSelectedMonth(m)}
              >
                {m}
              </button>
            ))}
          </div>
          <div>
            <label>
              Year: <input value={year} onChange={(e) => setYear(e.target.value)} />
            </label>
          </div>
          <div>
            <h3>Custom Timeframes</h3>
            {[semester1, semester2, summer].map((tf, idx) => (
              <div key={tf.label}>
                <strong>{tf.label}</strong><br />
                Start: <input
                  type="date"
                  value={tf.start}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (idx === 0) setSemester1({ ...tf, start: val });
                    if (idx === 1) setSemester2({ ...tf, start: val });
                    if (idx === 2) setSummer({ ...tf, start: val });
                  }}
                />
                End: <input
                  type="date"
                  value={tf.end}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (idx === 0) setSemester1({ ...tf, end: val });
                    if (idx === 1) setSemester2({ ...tf, end: val });
                    if (idx === 2) setSummer({ ...tf, end: val });
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
            {availableCountries.map((name) => (
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
                      <td><textarea value={row.lessons} onChange={() => {}} /></td>
                      <td><textarea value={row.concepts} onChange={() => {}} /></td>
                      <td><textarea value={row.holidayIntegrations} onChange={() => {}} /></td>
                      <td><textarea value={row.assessment} onChange={() => {}} /></td>
                      <td><textarea value={row.importantDates} readOnly /></td>
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
