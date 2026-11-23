import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { equipment as allEquipment, DEPARTMENTS } from '../data/equipment.js';
import EquipmentCard from '../components/EquipmentCard.jsx';
import EmptyState from '../components/EmptyState.jsx';

export default function FindEquipment() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [department, setDepartment] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);

  useEffect(() => {
    const q = searchParams.get('q') || '';
    setQuery(q);
  }, [searchParams]);

  const filtered = allEquipment.filter((item) => {
    const q = query.toLowerCase();
    const matchesQuery =
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.tags.some((t) => t.includes(q)) ||
      item.shortDescription.toLowerCase().includes(q) ||
      item.department.toLowerCase().includes(q) ||
      item.lab.toLowerCase().includes(q);

    const matchesDept = !department || item.department === department;
    const matchesAvail = !availableOnly || item.available > 0;

    return matchesQuery && matchesDept && matchesAvail;
  });

  function clearFilters() {
    setQuery('');
    setDepartment('');
    setAvailableOnly(false);
    setSearchParams({});
  }

  const hasFilters = query || department || availableOnly;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title">Find equipment</h1>
        <p className="text-sm text-slate-500 mt-1">
          {allEquipment.length} items across {DEPARTMENTS.length} departments
        </p>
      </div>

      {/* Search + Filters */}
      <div className="card p-4 space-y-3">
        {/* Search input */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            className="input-field pl-9"
            placeholder="Search by name, type, department…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              const p = {};
              if (e.target.value) p.q = e.target.value;
              setSearchParams(p);
            }}
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setSearchParams({}); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <SlidersHorizontal size={14} />
            <span className="font-medium">Filter by:</span>
          </div>

          <select
            className="input-field w-auto text-sm py-1.5"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          >
            <option value="">All departments</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              className="w-4 h-4 rounded accent-blue-600"
              checked={availableOnly}
              onChange={(e) => setAvailableOnly(e.target.checked)}
            />
            <span className="text-sm text-slate-600 font-medium">Available now</span>
          </label>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 ml-auto"
            >
              <X size={12} /> Clear all
            </button>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {filtered.length === 0
            ? 'No equipment found'
            : `Showing ${filtered.length} item${filtered.length !== 1 ? 's' : ''}`}
          {query && <span className="text-slate-700"> for "<strong>{query}</strong>"</span>}
        </p>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Nothing matched your search"
          description="Try different keywords, or clear the filters to see all equipment."
          action={
            <button onClick={clearFilters} className="btn-secondary">
              Clear filters
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((item) => (
            <EquipmentCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
