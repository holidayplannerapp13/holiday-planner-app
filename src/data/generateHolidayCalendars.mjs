// scripts/generateHolidayCalendars.mjs
// Run:  node scripts/generateHolidayCalendars.mjs
import fs from "fs";
import https from "https";

const FEED_URL =
  "https://www.gstatic.com/calendar/holidayservice_v2/holidays.json";
const OUT_PATH = "src/data/holidayCalendars.json";

https
  .get(FEED_URL, (res) => {
    if (res.statusCode !== 200) {
      console.error("Download failed:", res.statusCode);
      res.resume();
      return;
    }
    let raw = "";
    res.setEncoding("utf8");
    res.on("data", (chunk) => (raw += chunk));
    res.on("end", () => {
      const feed = JSON.parse(raw);
      const calendars = feed.calendars.map((c) => ({
        country: String(c.country).toUpperCase(),
        id: c.id,
      }));
      fs.mkdirSync("src/data", { recursive: true });
      fs.writeFileSync(
        OUT_PATH,
        JSON.stringify({ calendars }, null, 2),
        "utf8"
      );
      console.log(`✅  Saved ${calendars.length} calendars → ${OUT_PATH}`);
    });
  })
  .on("error", (e) => console.error("Request error:", e));
