// App.tsx – Cross-year + single-month fixes
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

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];
const GRADES = ["K","1","2","3","4","5","6","7","8","9","10","11","12"];

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
  /* UI state */
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [year, setYear] = useState("2025");
  const [allHolidays, setAllHolidays] = useState<Holiday[]>([]);
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [step, setStep] = useState(1);
  const [weekDataSets, setWeekDataSets] = useState<Record<string, WeekRow[]>>({});

  /* Custom time-frame pickers */
  const [semester1, setSemester1] = useState<Timeframe>({ label: "Semester 1", start: "", end: "" });
  const [semester2, setSemester2] = useState<Timeframe>({ label: "Semester 2", start: "", end: "" });
  const [summer,    setSummer]    = useState<Timeframe>({ label: "Summer",     start: "", end: "" });

  /* ─── HOLIDAY LOADER ───────────────────────────── */
  useEffect(() => {
    const rangeYears = new Set<number>();

    /* Include years from custom timeframes */
    [semester1, semester2, summer].forEach(tf => {
      if (tf.start && tf.end) {
        const sY = new Date(tf.start).getFullYear();
        const eY = new Date(tf.end).getFullYear();
        for (let y = sY; y <= eY; y++) rangeYears.add(y);
      }
    });

    /* Include year if a month is selected */
    if (selectedMonth) rangeYears.add(+year);

    /* Fallback: show chosen year + next year */
    if (rangeYears.size === 0) {
      const y = +year;
      rangeYears.add(y);
      rangeYears.add(y + 1);
    }

    /* Load & normalise */
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
  }, [year, selectedMonth, semester1, semester2, summer]);

  /* Populate country list */
  useEffect(() => {
    if (allHolidays.length) {
      const names = [...new Set(allHolidays.map(h => h.country))].sort();
      setAvailableCountries(names);
      if (selectedCountries.length === 0) setSelectedCountries([]);
    }
  }, [allHolidays]);

  /* Helpers */
  const toggleGrade   = (g: string) => setSelectedGrades(p => p.includes(g) ? p.filter(x => x !== g) : [...p, g]);
  const toggleCountry = (c: string) => setSelectedCountries(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c]);

  const generateWeeks = (startDate: Date, endDate: Date, label: string): WeekRow[] => {
    const rows: WeekRow[] = [];
    const cursor = new Date(startDate);
    cursor.setHours(0,0,0,0);
    endDate.setHours(0,0,0,0);
    while (cursor <= endDate) {
      rows.push({
        week: `${label} – Week ${rows.length + 1}`,
        lessons: "", concepts: "", holidayIntegrations: "", assessment: "",
        importantDates: "", _start: new Date(cursor)
      });
      cursor.setDate(cursor.getDate() + 7);
    }
    return rows;
  };

  /* ─── LESSON-PLAN GENERATOR ────────────────────── */
  const generateLessonPlan = () => {
    const filtered = allHolidays.filter(h => selectedCountries.includes(h.country));
    const result: Record<string, WeekRow[]> = {};

    /* Build the active timeframe list */
    const activeTimeframes: Timeframe[] = selectedMonth
      ? (() => {
          const monthIdx = MONTHS.indexOf(selectedMonth);
          const start = new Date(+year, monthIdx, 1);
          const end   = new Date(+year, monthIdx + 1, 0); // last day prev month
          return [{
            label: `${selectedMonth} ${year}`,
            start: start.toISOString().split("T")[0],
            end:   end.toISOString().split("T")[0]
          }];
        })()
      : [semester1, semester2, summer];

    const grades = selectedGrades.length ? selectedGrades : [""];

    grades.forEach(grade => {
      activeTimeframes.forEach(tf => {
        if (!tf.start || !tf.end) return;

        const weeks = generateWeeks(new Date(tf.start), new Date(tf.end), tf.label)
          .map(r => {
            const wkStart = new Date(r._start);
            wkStart.setHours(0,0,0,0);
            const wkEnd = new Date(wkStart); wkEnd.setDate(wkStart.getDate() + 6);

            const holidayLines = filtered
              .filter(h => {
                const d = new Date(h.date); d.setHours(0,0,0,0);
                return d >= wkStart && d <= wkEnd;
              })
              .map(h => `${h.date} — ${h.localName || h.name} (${h.country})`)
              .join("\n");

            return { ...r, importantDates: holidayLines };
          });

        const key = grade ? `${tf.label} – Grade ${grade}` : tf.label;
        result[key] = weeks;
      });
    });

    setWeekDataSets(result);
    setStep(4);
  };

  /* ─── UI  ──────────────────────────────────────── */
  return (
    <div className="app">
      <h1>Holiday Planner</h1>

      {step === 1 && (
        <>
          <h2>Select Grades</h2>
          <div className="button-grid grades">
            {GRADES.map(g => (
              <button key={g}
                className={`grade-button ${selectedGrades.includes(g) ? "selected" : ""}`}
                onClick={() => toggleGrade(g)}>
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
              <button key={m}
                className={selectedMonth === m ? "selected" : ""}
                onClick={() => setSelectedMonth(selectedMonth === m ? null : m)}>
                {m}
              </button>
            ))}
          </div>

          <div>
            <label>
              Year:&nbsp;
              <input value={year} onChange={e => setYear(e.target.value)} />
            </label>
          </div>

          <h3>Custom Timeframes</h3>
          {[semester1, semester2, summer].map((tf, idx) => (
            <div key={tf.label}>
              <strong>{tf.label}</strong><br />
              Start:&nbsp;
              <input type="date" value={tf.start}
                onChange={e => {
                  const v = e.target.value;
                  idx === 0 ? setSemester1({ ...tf, start: v })
                            : idx === 1 ? setSemester2({ ...tf, start: v })
                                         : setSummer({ ...tf, start: v });
                }} />
              End:&nbsp;
              <input type="date" value={tf.end}
                onChange={e => {
                  const v = e.target.value;
                  idx === 0 ? setSemester1({ ...tf, end: v })
                            : idx === 1 ? setSemester2({ ...tf, end: v })
                                         : setSummer({ ...tf, end: v });
                }} />
            </div>
          ))}

          <button onClick={() => setStep(3)}>Next: Choose Countries</button>
        </>
      )}

      {step === 3 && (
        <>
          <h2>Select Relevant Countries</h2>
          <div className="button-grid">
            {availableCountries.map(name => (
              <button key={name}
                className={selectedCountries.includes(name) ? "selected" : ""}
                onClick={() => toggleCountry(name)}>
                {name}
              </button>
            ))}
          </div>

          <div style={{ marginTop: "1rem" }}>
            <button onClick={generateLessonPlan}>
              Next: Generate Lesson Plan
            </button>
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
                    <th>Week</th><th>Lessons</th><th>Concepts</th>
                    <th>Holiday Integrations</th><th>Assessment</th>
                    <th>Important Dates</th>
                  </tr>
                </thead>
                <tbody>
                  {weeks.map((row, i) => (
                    <tr key={i}>
                      <td>{row.week}</td>
                      {["lessons","concepts","holidayIntegrations","assessment","importantDates"]
                        .map((k, idx) => (
                          <td key={idx}>
                            <textarea
                              value={(row as any)[k]}
                              readOnly={k === "importantDates"} />
                          </td>
                        ))}
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
