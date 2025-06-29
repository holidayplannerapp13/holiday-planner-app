export interface Holiday {
  date: string;
  name: string;
  localName: string;
  country: string;
  month?: string; // cultural only
  week?: number;  // cultural only
}
