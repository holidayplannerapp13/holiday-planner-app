export interface Holiday {
  date: string;       // "2025-09-15"
  country: string;    // "US"
  name?: string;      // Optional English name (same as localName)
  localName: string;  // Native script or default name
}
