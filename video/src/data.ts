/** The same demo data used for the README screenshots. */

export type Bill = {
  title: string;
  store: string;
  date: string;
  category: "Grocery" | "Restaurant" | "Shopping";
  totalPaisa: number;
  people: string;
};

export const BILLS: Bill[] = [
  { title: "Weekly Groceries", store: "Imtiaz", date: "18 Oct 2026", category: "Grocery", totalPaisa: 341000, people: "You, Hamza, Sara" },
  { title: "Dinner", store: "Kolachi", date: "15 Oct 2026", category: "Restaurant", totalPaisa: 710000, people: "You, Hamza, Sara" },
  { title: "New shoes", store: "Dolmen Mall", date: "10 Oct 2026", category: "Shopping", totalPaisa: 850000, people: "You" },
  { title: "Monthly Groceries", store: "Imtiaz", date: "4 Oct 2026", category: "Grocery", totalPaisa: 181000, people: "You" },
  { title: "Grocery run", store: "Carrefour", date: "20 Sep 2026", category: "Grocery", totalPaisa: 197000, people: "You" },
];

export type Item = {
  name: string;
  details: string;
  qty: string;
  unitPaisa: number;
  totalPaisa: number;
  split: string;
  assignees: string[];
};

export const WEEKLY_ITEMS: Item[] = [
  {
    name: "Cooking Oil",
    details: "Dalda · 1 litre",
    qty: "1",
    unitPaisa: 56000,
    totalPaisa: 56000,
    split: "Split 3 ways: You Rs. 186.67 · Hamza Rs. 186.67 · Sara Rs. 186.66",
    assignees: ["You", "Hamza", "Sara"],
  },
  {
    name: "Basmati Rice",
    details: "Guard · 5 kg",
    qty: "1",
    unitPaisa: 185000,
    totalPaisa: 185000,
    split: "Split 2 ways: You Rs. 925.00 · Sara Rs. 925.00",
    assignees: ["You", "Sara"],
  },
  { name: "Milk", details: "Olpers · 1 litre", qty: "2", unitPaisa: 29000, totalPaisa: 58000, split: "Paid by Hamza", assignees: ["Hamza"] },
  { name: "Eggs", details: "1 dozen", qty: "1", unitPaisa: 42000, totalPaisa: 42000, split: "Paid by you", assignees: ["You"] },
];

export const SHARES = [
  { name: "Ayesha Khan", paisa: 153167 },
  { name: "Hamza", paisa: 76667 },
  { name: "Sara", paisa: 111166 },
];

export const PRICE_RECORDS = [
  { date: "18 Oct 2026", unit: "Rs. 560.00", change: "Rs. 20.00 (+3.7%)", store: "Imtiaz", bill: "Weekly Groceries" },
  { date: "4 Oct 2026", unit: "Rs. 540.00", change: "Rs. 20.00 (+3.8%)", store: "Imtiaz", bill: "Monthly Groceries" },
  { date: "20 Sep 2026", unit: "Rs. 520.00", change: null, store: "Carrefour", bill: "Grocery run" },
];
