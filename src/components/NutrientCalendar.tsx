import React from 'react';
import { DayPicker } from 'react-day-picker';
import type { NutrientEntry } from '@/hooks/useNutrientSchedules';

type Props = {
  entries: NutrientEntry[];
  selected?: Date | undefined;
  onSelect?: (d: Date | undefined) => void;
  className?: string;
};

// pad helper
const pad = (n: number) => String(n).padStart(2, '0');

// Convert a Date to a local YYYY-MM-DD key (avoids timezone shifts)
const dateToKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Convert an ISO or date-only string to a local YYYY-MM-DD key safely
const isoToLocalKey = (iso: string) => {
  // If only date provided (YYYY-MM-DD) append T00:00:00 so it's parsed as local midnight
  const safe = iso.length === 10 ? `${iso}T00:00:00` : iso;
  const d = new Date(safe);
  return dateToKey(d);
};

// group entries by YYYY-MM-DD for quick lookup (in local time)
const groupByDate = (entries: NutrientEntry[]) => {
  const map: Record<string, NutrientEntry[]> = {};
  entries.forEach((e) => {
    const key = isoToLocalKey(e.applicationDate);
    if (!map[key]) map[key] = [];
    map[key].push(e);
  });
  return map;
};

// Map stage to color
const STAGE_COLOR: Record<'veg' | 'flower', string> = {
  veg: 'bg-green-400',
  flower: 'bg-pink-400',
};

const NutrientCalendar: React.FC<Props> = ({ entries, selected, onSelect, className }) => {
  const grouped = groupByDate(entries);

  return (
    <div className="w-full">
      <DayPicker
        className={`rdp-large w-full ${className || ''}`}
        mode="single"
        selected={selected}
        onSelect={onSelect}
        showOutsideDays
        footer={
          <div className="text-xs text-gray-400">Click a date to view or add nutrient applications</div>
        }
        // Custom day content: show larger dot(s) if entries exist
        components={{
          DayContent: (props: unknown) => {
            const p = props as { date: Date };
            const date = p.date;
            const key = dateToKey(date);
            const dayEntries = grouped[key] || [];
            // Find if veg/flower present
            const hasVeg = dayEntries.some(e => e.stage === 'veg');
            const hasFlower = dayEntries.some(e => e.stage === 'flower');
            return (
              <div className="flex flex-col items-center">
                <div className="text-sm font-medium">{date.getDate()}</div>
                <div className="mt-2 flex gap-1">
                  {hasVeg && <span className="w-2 h-2 rounded-full bg-green-400" title="Veg" />}
                  {hasFlower && <span className="w-2 h-2 rounded-full bg-pink-400" title="Flower" />}
                </div>
              </div>
            );
          },
        }}
      />
    </div>
  );
};

export default NutrientCalendar;
