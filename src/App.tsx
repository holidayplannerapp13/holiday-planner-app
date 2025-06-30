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
  const [weekDataSets, setWeekDataSets] = useState<Record<string, WeekRow[]>>({});

  const [semester1, setSemester1] = useState<Timeframe>({ label: "Semester 1", start: "", end: "" });
  const [semester2, setSemester2] = useState<Timeframe>({ label: "Semester 2", start: "", end: "" });
  const [summer, setSummer] = useState<Timeframe>({ label: "Summer", start: "", end: "" });

  useEffect(() => {
    const holidays = [...calendarificHolidayData, ...culturalHolidayData]
      .filter((h: Holiday) => {
        const d = new Date(h.date);
        return d.getFullYear() === +year;
      })
      .map((h: Holiday) => {
        const fullName = codeToName.get(h.country.toUpperCase()) ?? h.country;
        return { ...h, country: fullName };
      });
    setAllHolidays(holidays);
  }, [year]);

  useEffect(() => {
    if (!selectedMonth && allHolidays.length > 0) {
      const names = Array.from(new Set(allHolidays.map((h) => h.country))).sort();
      setAvailableCountries(names);
      setSelectedCountries(names);
    }
  }, [allHolidays, selectedMonth]);

  const generateWeeks = (startDate: Date, endDate: Date, label: string): WeekRow[] => {
    const rows: WeekRow[] = [];
    const cursor = new Date(startDate);
    let wk = 1;
    while (cursor <= endDate) {
      const start = new Date(cursor);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
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

  const handleMonthSelect = async (monthLabel: string) => {
    const monthIdx = MONTHS.indexOf(monthLabel);
    setSelectedMonth(monthLabel);
    setSelectedCountries([]);
    setWeekDataSets({});

    const holidays = [...calendarificHolidayData, ...culturalHolidayData].filter((h: Holiday) => {
      const d = new Date(h.date);
      return d.getFullYear() === +year && d.getMonth() === monthIdx;
    }).map((h: Holiday) => {
      const fullName = codeToName.get(h.country.toUpperCase()) ?? h.country;
      return { ...h, country: fullName };
    });

    setAllHolidays(holidays);
    const names = Array.from(new Set(holidays.map((h) => h.country))).sort();
    setAvailableCountries(names);
  };

  const toggleCountry = (name: string) => {
    setSelectedCountries((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    );
  };

  const generateLessonPlan = () => {
    const filtered = allHolidays.filter((h) => selectedCountries.includes(h.country));
    const result: Record<string, WeekRow[]> = {};

    const processTimeframe = (t: Timeframe) => {
      if (!t.start || !t.end) return;
      const start = new Date(t.start);
      const end = new Date(t.end);

      const weeks = generateWeeks(start, end, t.label).map((row, i) => {
        const wkStart = new Date(start);
        wkStart.setDate(start.getDate() + i * 7);
        const wkEnd = new Date(wkStart);
        wkEnd.setDate(wkStart.getDate() + 6);

        const weekHolidays = filtered.filter((h) => {
          const d = new Date(h.date);
          return d >= wkStart && d <= wkEnd;
        });

        return {
          ...row,
          importantDates: weekHolidays
            .map((h) => `${h.date} — ${h.localName || h.name} (${h.country})`)
            .join("\n"),
        };
      });
      result[t.label] = weeks;
    };

    [semester1, semester2, summer].forEach(processTimeframe);
    setWeekDataSets(result);
  };

  const updateCell = (label: string, idx: number, field: keyof WeekRow, val: string) => {
    setWeekDataSets((prev) => {
      const copy = { ...prev };
      copy[label][idx] = { ...copy[label][idx], [field]: val };
      return copy;
    });
  };

  return (
    <div className="app">
      <h1>Holiday Planner</h1>

      {!selectedMonth && (
        <>
          <h2>Step 1 – Choose Month or Define Timeframe</h2>
          {MONTHS.map((m) => (
            <button key={m} onClick={() => handleMonthSelect(m)} style={{ margin: 4 }}>{m}</button>
          ))}
          <br />
          <label style={{ display: "block", marginTop: 12 }}>
            Year: <input value={year} onChange={(e) => setYear(e.target.value)} style={{ width: 80 }} />
          </label>

          <div className="timeframes">
            {[semester1, semester2, summer].map((t, i) => (
              <div key={t.label} style={{ marginTop: 10 }}>
                <strong>{t.label}</strong><br />
                Start: <input type="date" value={t.start} onChange={(e) => {
                  const update = [semester1, semester2, summer];
                  update[i] = { ...update[i], start: e.target.value };
                  [setSemester1, setSemester2, setSummer][i](update[i]);
                }} />
                End: <input type="date" value={t.end} onChange={(e) => {
                  const update = [semester1, semester2, summer];
                  update[i] = { ...update[i], end: e.target.value };
                  [setSemester1, setSemester2, setSummer][i](update[i]);
                }} />
              </div>
            ))}

            <button onClick={generateLessonPlan} style={{ marginTop: 16 }}>
              Generate Lesson Plan
            </button>
          </div>
        </>
      )}

      {Object.keys(weekDataSets).length > 0 && (
        <>
          {Object.entries(weekDataSets).map(([label, weeks]) => (
            <div key={label}>
              <h2>{label} – Lesson Plan</h2>
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
                    <tr key={row.week}>
                      <td>{row.week}</td>
                      {["lessons", "concepts", "holidayIntegrations", "assessment", "importantDates"].map(
                        (field) => (
                          <td key={field}>
                            <textarea
                              value={row[field as keyof WeekRow]}
                              onChange={(e) => updateCell(label, i, field as keyof WeekRow, e.target.value)}
                            />
                          </td>
                        )
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          <button onClick={() => window.print()} style={{ marginTop: 16 }}>Print</button>
        </>
      )}
    </div>
  );
};

export default App;
