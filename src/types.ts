export interface Holiday {
  date: string;
  endDate?: string; // optional, for multi-day holidays
  name: string;
  localName: string;
  country: string;
  description?: string; // optional, cultural only
  type?: string[];      // optional, calendarific only
  month?: string;       // optional, cultural only
  week?: number;        // optional, cultural only
}
