// src/utils/scripts/fetchAllCountries.js  (CommonJS, works in Node 22)
const fs   = require("fs");
const https = require("https");
const path = require("path");

// 1)  put your real key here or read from process.env.VITE_CALENDARIFIC_API_KEY
const API_KEY = "BmYqGbIlIEZW608MBv6tQnZgIzjqO9lP"; // ← Replace this

const url = `https://calendarific.com/api/v2/countries?api_key=${API_KEY}`;
const dest = path.resolve("src/data/countryTable.json");

https.get(url, res => {
  let raw = "";
  res.on("data", chunk => (raw += chunk));
  res.on("end", () => {
    try {
      const json = JSON.parse(raw);
      const countries = json?.response?.countries || [];

      // keep only ISO code + name
      const list = countries.map(c => ({
        code: c["iso-3166"].toUpperCase(),
        name: c.country_name,
      }));

      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, JSON.stringify({ countries: list }, null, 2));
      console.log(`✅  Saved ${list.length} countries → ${dest}`);
    } catch (e) {
      console.error("❌  Parse error:", e);
    }
  });
}).on("error", err => {
  console.error("❌  HTTP error:", err.message);
});
