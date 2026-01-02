import React from 'react';
import { DayPicker } from 'react-day-picker';
import type { NutrientEntry } from '@/hooks/useNutrientSchedules';

type Props = {
  entries: NutrientEntry[];
  selected?: Date | undefined;
  onSelect?: (d: Date | undefined) => void;
};

// group entries by YYYY-MM-DD for quick lookup
const groupByDate = (entries: NutrientEntry[]) => {
  const map: Record<string, NutrientEntry[]> = {};
  entries.forEach((e) => {
    const key = e.applicationDate.split('T')[0];
    if (!map[key]) map[key] = [];
    map[key].push(e);
  });
  return map;
};

const NutrientCalendar: React.FC<Props> = ({ entries, selected, onSelect }) => {
  const grouped = groupByDate(entries);

  // Build matchers for dates with entries
  const modifiers = {
    hasEntries: Object.keys(grouped).map((dateStr) => new Date(dateStr)),
  };

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-3">
      <DayPicker
        mode="single"
        selected={selected}
        onSelect={onSelect}
        modifiers={modifiers}
        showOutsideDays
        footer={
          <div className="text-xs text-gray-400">Click a date to view or add nutrient applications</div>
        }
        // Custom day content: show dot if entries exist
        components={{
          DayContent: (props: unknown) => {
            // props type is provided by react-day-picker; narrow as needed
            const p = props as { date: Date };
            const date = p.date;
            const key = date.toISOString().split('T')[0];
            const dayEntries = grouped[key] || [];
            return (
              <div className="flex flex-col items-center">
                <div className="text-sm">{date.getDate()}</div>
                {dayEntries.length > 0 && <div className="w-1 h-1 rounded-full bg-green-400 mt-1" />}
              </div>
            );
          },
        }}
      />
    </div>
  );
};

export default NutrientCalendar;
