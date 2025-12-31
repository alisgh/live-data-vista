import React, { useEffect, useMemo, useState } from 'react';

// Simple nutrient type so adding new nutrients is easy later
type Nutrient = {
  id: string;
  name: string;
  amountMl: number;
};

// Default weekly nutrients — extend this array to add more nutrients (e.g. Bio-Bloom)
const DEFAULT_NUTRIENTS: Nutrient[] = [
  { id: 'bio-grow', name: 'Bio-Grow', amountMl: 2 },
  { id: 'cal-mag', name: 'Cal-Mag', amountMl: 1 },
];

const msPerWeek = 7 * 24 * 60 * 60 * 1000;

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const addDays = (d: Date, days: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
};

// Compute the next scheduled weekly dose after "today" based on a start date
export function computeNextDoseDate(startDate: Date): Date {
  const s = startOfDay(startDate);
  const today = startOfDay(new Date());

  if (s > today) return s; // schedule starts in the future

  const weeksSince = Math.floor((today.getTime() - s.getTime()) / msPerWeek);
  return addDays(s, (weeksSince + 1) * 7);
}

const formatDate = (d: Date) => d.toLocaleDateString();

const NutrientSchedule: React.FC = () => {
  // Start the schedule from today
  const [startDate] = useState<Date>(() => startOfDay(new Date()));

  // Keep nutrients in state to allow future UI edits / extensions
  const [nutrients] = useState<Nutrient[]>(DEFAULT_NUTRIENTS);

  // Next scheduled dose updates automatically whenever startDate or the current day changes
  const [nextDose, setNextDose] = useState<Date>(() => computeNextDoseDate(startDate));

  // Update nextDose on mount and once a day (simple interval)
  useEffect(() => {
    setNextDose(computeNextDoseDate(startDate));

    // Recompute at midnight to keep "nextDose" accurate if the user leaves the page open
    const interval = setInterval(() => {
      setNextDose(computeNextDoseDate(startDate));
    }, 60 * 60 * 1000); // hourly check is lightweight and enough for this use-case

    return () => clearInterval(interval);
  }, [startDate]);

  const totalPerWeek = useMemo(() => {
    return nutrients.reduce((acc, n) => acc + n.amountMl, 0);
  }, [nutrients]);

  return (
    <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-xl">
      <h2 className="text-lg font-semibold text-gray-200 mb-3">Nutrient Schedule</h2>

      <div className="text-sm text-gray-300 mb-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Start date</span>
          <span className="font-medium">{formatDate(startDate)}</span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-gray-400">Next scheduled dose</span>
          <span className="font-medium">{formatDate(nextDose)}</span>
        </div>
      </div>

      <div className="mt-2">
        <div className="text-gray-400 text-sm mb-2">Nutrients per week</div>

        <ul className="space-y-2">
          {nutrients.map((n) => (
            <li key={n.id} className="flex items-center justify-between text-sm">
              <span className="text-gray-200">{n.name}</span>
              <span className="text-gray-300">{n.amountMl} ml / week</span>
            </li>
          ))}
        </ul>

        <div className="mt-4 border-t border-gray-700 pt-3 flex items-center justify-between text-sm text-gray-300">
          <span className="text-gray-400">Total</span>
          <span className="font-medium">{totalPerWeek} ml / week</span>
        </div>

        <p className="mt-3 text-xs text-gray-500">⚡ Extensible: add new nutrients to the DEFAULT_NUTRIENTS array.</p>
      </div>
    </div>
  );
};

export default NutrientSchedule;
