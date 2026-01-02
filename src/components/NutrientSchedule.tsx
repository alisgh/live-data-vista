import React, { useMemo, useState } from 'react';
import NutrientCalendar from './NutrientCalendar';
import { useNutrientSchedules, NutrientEntry } from '@/hooks/useNutrientSchedules';

const DEFAULT_NUTRIENT_NAMES = ['Bio-Grow', 'Bio-Bloom', 'Top-Max', 'Cal-Mag'];

// Parse ISO or date-only strings safely so local dates don't shift due to timezone
const safeDateFromIso = (iso: string) => new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
const formatDate = (iso?: string) => (iso ? safeDateFromIso(iso).toLocaleDateString() : '');

const NutrientSchedule: React.FC = () => {
  const { entries, isLoading, error, createEntry, updateEntry, deleteEntry } = useNutrientSchedules();

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  // Form state for create/edit
  const [form, setForm] = useState<{
    id?: number | null;
    nutrientName: string;
    amountMl: string;
    applicationDate: string;
    notes: string;
    stage: 'veg' | 'flower';
  }>({ nutrientName: DEFAULT_NUTRIENT_NAMES[0], amountMl: '2', applicationDate: new Date().toISOString().split('T')[0], notes: '', stage: 'veg' });

  // Filter entries for selected date
  const selectedKey = selectedDate ? selectedDate.toISOString().split('T')[0] : null;
  const entriesByDate = useMemo(() => {
    if (!selectedKey) return [] as NutrientEntry[];
    return entries.filter((e) => e.applicationDate.split('T')[0] === selectedKey);
  }, [entries, selectedKey]);

  const handleSelectDate = (d: Date | undefined) => {
    setSelectedDate(d);
    setForm((f) => ({ ...f, applicationDate: d ? d.toISOString().split('T')[0] : f.applicationDate }));
  };

  const resetForm = () => {
    setForm({ nutrientName: DEFAULT_NUTRIENT_NAMES[0], amountMl: '2', applicationDate: new Date().toISOString().split('T')[0], notes: '', stage: 'veg' });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: Omit<NutrientEntry, 'id' | 'createdAt' | 'updatedAt'> = {
        nutrientName: form.nutrientName,
        amountMl: Number(form.amountMl),
        applicationDate: form.applicationDate,
        notes: form.notes || null,
        stage: form.stage,
      };

      if (form.id) {
        await updateEntry(form.id, payload);
      } else {
        await createEntry(payload);
      }

      resetForm();
      setShowDialog(false);
      // Refresh selected date view naturally by virtue of entries state updating in the hook
    } catch (err) {
      // error is handled by hook; optionally show toast
      console.error(err);
    }
  };

  const onEdit = (entry: NutrientEntry) => {
    setForm({ id: entry.id, nutrientName: entry.nutrientName, amountMl: String(entry.amountMl), applicationDate: entry.applicationDate.split('T')[0], notes: entry.notes || '', stage: entry.stage });
    setShowDialog(true);
  };

  const onDelete = async (id?: number) => {
    if (!id) return;
    if (!confirm('Delete this nutrient schedule?')) return;
    try {
      await deleteEntry(id);
    } catch (err) {
      console.error(err);
    }
  };

  // Modal dialog state
  const [showDialog, setShowDialog] = useState(false);

  return (
    <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-xl">
      <h2 className="text-lg font-semibold text-gray-200 mb-3">Nutrient Schedule</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <NutrientCalendar entries={entries} selected={selectedDate} onSelect={handleSelectDate} className="w-full" />
        </div>

        <div className="md:col-span-1">
          <div className="mb-3 text-sm text-gray-300">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Selected date</span>
              <span className="font-medium">{selectedDate ? selectedDate.toLocaleDateString() : 'None'}</span>
            </div>
            <div className="text-xs text-gray-500 mt-2">Click a day to view or schedule nutrients for that date.</div>
          </div>

          <button
            className="w-full py-2 px-4 bg-green-600 text-white rounded shadow hover:bg-green-700 transition mb-4"
            onClick={() => { resetForm(); setShowDialog(true); }}
          >
            ➕ Add Nutrient
          </button>

          {/* Modal Dialog */}
          {showDialog && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md shadow-xl relative">
                <h3 className="text-lg font-semibold text-gray-200 mb-4">{form.id ? 'Edit Nutrient' : 'Add Nutrient'}</h3>
                <form onSubmit={onSubmit} className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-400">Nutrient name</label>
                    <input className="w-full mt-1 p-2 bg-gray-800 border border-gray-700 rounded" value={form.nutrientName} onChange={(e) => setForm({ ...form, nutrientName: e.target.value })} />
                    <div className="text-xs text-gray-500 mt-1">Try: {DEFAULT_NUTRIENT_NAMES.join(', ')}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-400">Amount (ml)</label>
                      <input type="number" min="0" step="0.1" className="w-full mt-1 p-2 bg-gray-800 border border-gray-700 rounded" value={form.amountMl} onChange={(e) => setForm({ ...form, amountMl: e.target.value })} />
                    </div>

                    <div>
                      <label className="text-xs text-gray-400">Date</label>
                      <input type="date" className="w-full mt-1 p-2 bg-gray-800 border border-gray-700 rounded" value={form.applicationDate} onChange={(e) => setForm({ ...form, applicationDate: e.target.value })} />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-400">Stage</label>
                    <div className="flex gap-2 mt-1">
                      <button
                        type="button"
                        className={`px-3 py-1 rounded font-medium border ${form.stage === 'veg' ? 'bg-green-500 text-black border-green-600' : 'bg-gray-800 text-gray-300 border-gray-700'}`}
                        onClick={() => setForm({ ...form, stage: 'veg' })}
                      >
                        Veg
                      </button>
                      <button
                        type="button"
                        className={`px-3 py-1 rounded font-medium border ${form.stage === 'flower' ? 'bg-pink-500 text-black border-pink-600' : 'bg-gray-800 text-gray-300 border-gray-700'}`}
                        onClick={() => setForm({ ...form, stage: 'flower' })}
                      >
                        Flower
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-400">Notes (optional)</label>
                    <textarea className="w-full mt-1 p-2 bg-gray-800 border border-gray-700 rounded" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button type="submit" className="px-4 py-2 bg-green-500 text-black rounded shadow">{form.id ? 'Save' : 'Add'}</button>
                    <button type="button" className="px-4 py-2 bg-gray-700 text-white rounded shadow" onClick={() => { setShowDialog(false); resetForm(); }}>Cancel</button>
                  </div>

                  {error && <div className="text-sm text-red-400 mt-2">{error}</div>}
                </form>
                <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-200" onClick={() => { setShowDialog(false); resetForm(); }}>&times;</button>
              </div>
            </div>
          )}

          <div className="mt-4">
            <h3 className="text-sm text-gray-200 mb-2">Entries {selectedDate ? `on ${selectedDate.toLocaleDateString()}` : ''}</h3>

            {isLoading && <div className="text-sm text-gray-400">Loading...</div>}

            {!isLoading && entriesByDate.length === 0 && <div className="text-sm text-gray-500">No entries for this date.</div>}

            <ul className="space-y-2">
              {entriesByDate.map((e) => (
                <li key={e.id} className={`p-2 border rounded flex items-start justify-between ${e.stage === 'veg' ? 'bg-green-900/40 border-green-700' : e.stage === 'flower' ? 'bg-pink-900/40 border-pink-700' : 'bg-gray-900 border-gray-700'}`}>
                  <div>
                    <div className="text-sm font-medium flex items-center gap-2">
                      <span>{e.nutrientName} — {e.amountMl} ml</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${e.stage === 'veg' ? 'bg-green-500 text-black' : 'bg-pink-500 text-black'}`}>{e.stage === 'veg' ? 'Veg' : 'Flower'}</span>
                    </div>
                    <div className="text-xs text-gray-400">{formatDate(e.applicationDate)} {e.notes ? `· ${e.notes}` : ''}</div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button className="px-2 py-1 text-xs bg-gray-700 rounded" onClick={() => onEdit(e)}>Edit</button>
                    <button className="px-2 py-1 text-xs bg-red-600 rounded" onClick={() => onDelete(e.id)}>Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NutrientSchedule;
