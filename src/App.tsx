import { useEffect, useState } from "react";
import { getCalendarificHolidays } from "./utils/fetchCalendarificHolidays";
import type { Holiday } from "./types";
import countryTable from "./data/countryTable.json";
import culturalHolidays from "./data/cultural-holidays.json";

/* ---------- constants ---------- */
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const HEADERS = [
  "Week",
  "Important Data",     // ← holidays go here
  "Musicianship",
  "Repertoire",
  "Movement",
  "Instrument",
  "Listening",
  "Other",
];
const CURRENT_YEAR = new Date().getFullYear();

/* ---------- helpers ---------- */
function mondayOf(d: Date) {
  const n = new Date(d);
  const diff = (n.getDay() + 6) % 7; // 0→6,1→0,...6→5
  n.setDate(n.getDate() - diff);
  return n;
}
function schoolWeekLabel(d: Date) {
  const monday = mondayOf(d);
  const weekNo = Math.ceil(monday.getDate() / 7);
  return `${MONTHS[monday.getMonth()]} – Week ${weekNo}`;
}
/* ---------- component ---------- */
export default function App() {
  /* phase: 1-month, 2-countries, 3-output table */
  const [step, setStep] = useState<1|2|3>(1);

  const [year]            = useState(CURRENT_YEAR);
  const [monthIdx,setMonthIdx]   = useState<number | null>(null);

  const [availableCountries,setAvail] = useState<string[]>([]);
  const [selectedCountries, setSel]   = useState<string[]>([]);

  const [holidays,setHolidays] = useState<Holiday[]>([]);
  const [loading,setLoading]   = useState(false);

  /* ------------ STEP 1 ------------ */
  function handleMonth(mIdx: number) {
    setMonthIdx(mIdx);
    setSel([]);
    /* preload full list – we’ll filter later */
    const all = (countryTable.countries as any[]).map(c=>c.code.toUpperCase());
    setAvail(all);
    setStep(2);
  }

  /* ------------ STEP 2 ------------ */
  async function handleContinue() {
    if (!monthIdx || !selectedCountries.length) return;
    setLoading(true);

    const fetched: Holiday[] = [];
    for (const code of selectedCountries) {
      try {
        const list = await getCalendarificHolidays(code);
        fetched.push(...list);
      } catch(e){ console.error("Calendarific fail",code,e);}
    }

    /* merge cultural */
    const name2code = new Map(
      (countryTable.countries as any[]).map(
        ({name,code})=>[name.toLowerCase(),code.toUpperCase()]
      )
    );
    const cultural = (culturalHolidays as Holiday[]).filter(h=>{
      const d = new Date(h.date);
      const iso = name2code.get((h.country??"").toLowerCase());
      return (
        d.getFullYear()===year &&
        d.getMonth()===monthIdx &&
        iso && selectedCountries.includes(iso)
      );
    });

    /* filter for selected month/year */
    const monthHolidays = [...fetched,...cultural].filter(h=>{
      const d = new Date(h.date);
      return d.getFullYear()===year && d.getMonth()===monthIdx;
    });

    setHolidays(monthHolidays);
    setLoading(false);
    setStep(3);
  }

  /* ---------- RENDER ---------- */
  return (
    <div style={{padding:24,fontFamily:"sans-serif"}}>
      <h1>Holiday Planner</h1>

      {/* -------- Step 1 – choose month -------- */}
      {step===1 && (
        <>
          <h2>Choose Month</h2>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {MONTHS.map((m,idx)=>(
              <button key={m}
                onClick={()=>handleMonth(idx)}
                style={{padding:"6px 10px",border:"1px solid #333"}}
              >{m}</button>
            ))}
          </div>
        </>
      )}

      {/* -------- Step 2 – countries -------- */}
      {step===2 && monthIdx!==null && (
        <>
          <h2>Select Countries for {MONTHS[monthIdx]} {year}</h2>
          <div style={{display:"flex",flexWrap:"wrap",gap:6,maxHeight:260,overflowY:"auto"}}>
            {availableCountries.map(code=>{
              const label=(countryTable.countries as any[])
                .find((c)=>c.code===code)?.name;
              return (
                <button key={code}
                  onClick={()=>setSel(prev=>
                    prev.includes(code)?prev.filter(c=>c!==code):[...prev,code]
                  )}
                  style={{
                    padding:"6px 10px",
                    border:"1px solid #333",
                    background:selectedCountries.includes(code)?"#90cdf4":"#fff",
                  }}
                >{code} – {label}</button>
              );
            })}
          </div>
          <button
            style={{marginTop:16,padding:"6px 14px"}}
            disabled={!selectedCountries.length||loading}
            onClick={handleContinue}
          >
            {loading?"Loading…":"Continue"}
          </button>
        </>
      )}

      {/* -------- Step 3 – lesson-plan table -------- */}
      {step===3 && (
        <>
          <h2>{MONTHS[monthIdx!]} {year} – Lesson Plan</h2>
          <Table monthIdx={monthIdx!} holidays={holidays}/>
        </>
      )}
    </div>
  );
}

/* ---------- lesson-plan table ---------- */
function Table({monthIdx,holidays}:{monthIdx:number;holidays:Holiday[]}) {
  /* group per Mon-Fri week */
  const rows: Record<string,string[]> = {};
  for (const h of holidays) {
    const label = schoolWeekLabel(new Date(h.date));
    (rows[label]??=[]).push(`${h.date} — ${h.name} (${h.country})`);
  }

  /* ensure every Mon-Fri block appears even if empty */
  const first = new Date(2025,monthIdx,1);
  const last  = new Date(2025,monthIdx+1,0);
  for (let d=mondayOf(first); d<=last; d.setDate(d.getDate()+7)){
    rows[schoolWeekLabel(d)] = rows[schoolWeekLabel(d)] ?? [];
  }

  return (
    <table border={1} cellPadding={4} style={{width:"100%",borderCollapse:"collapse"}}>
      <thead>
        <tr>
          {HEADERS.map(h=>(
            <th key={h} style={{
              width: h==="Week"||h==="Important Data" ? "10%" : "auto"
            }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Object.keys(rows).sort().map(week=>(
          <tr key={week}>
            <td>{week}</td>
            <td>
              {rows[week].map((line,i)=><div key={i}>{line}</div>)}
            </td>
            {/* empty cells for manual entry */}
            {HEADERS.slice(2).map((_,i)=><td key={i}></td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
