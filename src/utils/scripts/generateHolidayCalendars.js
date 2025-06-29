// src/scripts/generateHolidayCalendars.js
import fs from "fs";
import https from "https";

const FEED_URL = "https://www.gstatic.com/calendar/holidayservice_v2/holidays.json";
const DEST = "src/data/holidayCalendars.json";

https.get(FEED_URL, (res) => {
  let data = "";
  res.on("data", (chunk) => (data += chunk));
  res.on("end", () => {
    try {
      const json = JSON.parse(data);
      const full = {
        calendars: json.calendars
          .filter((c) => c.country && c.id)
          .map((c) => ({
            country: c.country.toUpperCase(),
            id: c.id,
          })),
      };

      fs.mkdirSync("src/data", { recursive: true });
      fs.writeFileSync(DEST, JSON.stringify(full, null, 2));
      console.log(`✅ Saved ${full.calendars.length} countries to ${DEST}`);
    } catch (err) {
      console.error("❌ Failed to parse response:", err);
    }
  });
}).on("error", (err) => {
  console.error("❌ Failed to fetch from Google:", err);
});
