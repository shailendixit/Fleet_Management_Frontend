import React, { useEffect, useMemo, useState } from 'react';
import AnimatedContainer from '../components/UI/AnimatedContainer';
import Loading from '../components/UI/Loading';
import { useToast } from '../components/UI/ToastProvider';

const API_BASE = import.meta.env.VITE_BACKEND_API_URL || '';
const VALID_STATUSES = ['available', 'unavailable', 'maintenance'];

/* ----------------- UI primitives ----------------- */
function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm opacity-100 transition-opacity"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-slate-200 animate-[scaleIn_.15s_ease-out]">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 transition"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <div className="p-4">{children}</div>
          {footer && <div className="p-4 border-t bg-slate-50 rounded-b-2xl">{footer}</div>}
        </div>
      </div>
      <style>{`
        @keyframes scaleIn {
          0% { transform: scale(.96); opacity: 0 }
          100% { transform: scale(1); opacity: 1 }
        }
      `}</style>
    </div>
  );
}

function ConfirmDialog({ open, title="Are you sure?", message, confirmText="Confirm", cancelText="Cancel", onConfirm, onCancel, busy }) {
  return (
    <Modal open={open} onClose={onCancel} title={title}
      footer={
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-3 py-2 rounded-lg bg-white border hover:bg-slate-100"> {cancelText} </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className={`px-3 py-2 rounded-lg text-white ${busy ? 'bg-slate-400' : 'bg-red-600 hover:bg-red-700'}`}
          >
            {busy ? 'Working...' : confirmText}
          </button>
        </div>
      }>
      <p className="text-slate-600">{message}</p>
    </Modal>
  );
}

function EditableCell({ value, onChange, type = 'text', className = '', placeholder }) {
  const inputType = type === 'number' ? 'number' : type;
  return (
    <input
      className={`w-full px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all ${className}`}
      value={value ?? ''}
      onChange={(e) => {
        const v = e.target.value;
        if (type === 'number') {
          onChange(v === '' ? '' : Number(v));
        } else {
          onChange(v);
        }
      }}
      type={inputType}
      placeholder={placeholder}
    />
  );
}

/* ----------------- Main Screen ----------------- */
export default function Maintainence() {
  const { show } = useToast();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [edits, setEdits] = useState({});
  const [query, setQuery] = useState('');

  // Add modal state
  const [addOpen, setAddOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newDriver, setNewDriver] = useState({
    driverName: '',
    truckNo: '',
    cubic: '',
    truckType: '',
    status: 'available',
    username: '',
    password: '',
    TrackerID: '',
  });
  const [addErrors, setAddErrors] = useState({}); // field -> message

  // Delete dialog state
  const [delOpen, setDelOpen] = useState(false);
  const [delBusy, setDelBusy] = useState(false);
  const [delTarget, setDelTarget] = useState(null); // driver object

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/maintenance/drivers`);
      const data = await res.json();
      const list = Array.isArray(data?.drivers) ? data.drivers : Array.isArray(data) ? data : [];
      setDrivers(list);
      setEdits({});
    } catch (e) {
      console.error(e);
      show('error', 'Failed to load drivers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleEdit = (driverId, field, value) => {
    setEdits((s) => ({ ...s, [driverId]: { ...s[driverId], [field]: value } }));
  };

  const modifiedRows = useMemo(
    () => Object.keys(edits).map((id) => ({ driverId: Number(id), ...edits[id] })),
    [edits]
  );

  const handleSaveAll = async () => {
    if (modifiedRows.length === 0) {
      show('info', 'No changes to save');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/maintenance/drivers/batch-update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: modifiedRows }),
      });
      const data = await res.json();
      if (data?.message?.toLowerCase().includes('success')) {
        show('success', 'Drivers updated successfully');
        await fetchDrivers();
      } else {
        show('error', data?.error || data?.message || 'Failed to update drivers');
      }
    } catch (e) {
      console.error(e);
      show('error', 'Failed to update drivers');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => setEdits({});

  /* ----------------- Add Driver (Modal) ----------------- */

  // Validation based on schema (types + enum). All fields optional by schema; we validate types and ranges.
  const validateNewDriver = (values) => {
    const errs = {};
    const numOrEmpty = (v) => v === '' || v === null || v === undefined || !Number.isNaN(Number(v));

    if (values.status && !VALID_STATUSES.includes(values.status)) {
      errs.status = `Status must be one of: ${VALID_STATUSES.join(', ')}`;
    }
    if (!numOrEmpty(values.truckNo)) {
      errs.truckNo = 'Truck No must be an integer';
    } else if (values.truckNo !== '' && !Number.isInteger(Number(values.truckNo))) {
      errs.truckNo = 'Truck No must be an integer';
    }

    if (!numOrEmpty(values.cubic)) {
      errs.cubic = 'Cubic must be a number';
    }

    if (!numOrEmpty(values.TrackerID)) {
      errs.TrackerID = 'TrackerID must be an integer';
    } else if (values.TrackerID !== '' && !Number.isInteger(Number(values.TrackerID))) {
      errs.TrackerID = 'TrackerID must be an integer';
    }

    // Optional text fields: trim but allow empty/null per schema
    const trimIfString = (v) => (typeof v === 'string' ? v.trim() : v);
    ['driverName', 'truckType', 'username', 'password'].forEach((f) => {
      if (values[f] !== '' && values[f] !== null && values[f] !== undefined) {
        const t = trimIfString(values[f]);
        if (typeof t !== 'string') errs[f] = `${f} must be a string`;
      }
    });

    return errs;
  };

  const handleAddDriver = async () => {
    const errs = validateNewDriver(newDriver);
    setAddErrors(errs);
    if (Object.keys(errs).length) {
      show('error', 'Please fix validation errors');
      return;
    }

    try {
      setAdding(true);
      const body = {
        driverName: newDriver.driverName?.trim() || null,
        truckNo: newDriver.truckNo === '' ? null : Number(newDriver.truckNo),
        cubic: newDriver.cubic === '' ? null : Number(newDriver.cubic),
        truckType: newDriver.truckType?.trim() || null,
        status: newDriver.status || 'available',
        username: newDriver.username?.trim() || null,
        password: newDriver.password?.trim() || null, // backend should hash if provided
        TrackerID: newDriver.TrackerID === '' ? null : Number(newDriver.TrackerID),
      };

      const res = await fetch(`${API_BASE}/maintenance/drivers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data?.message?.toLowerCase().includes('created')) {
        show('success', 'Driver added successfully');
        setAddOpen(false);
        setNewDriver({
          driverName: '',
          truckNo: '',
          cubic: '',
          truckType: '',
          status: 'available',
          username: '',
          password: '',
          TrackerID: '',
        });
        await fetchDrivers();
      } else {
        // Show specific field error if backend returns unique constraint meta
        if (data?.field) {
          setAddErrors((e) => ({ ...e, [data.field]: 'Already in use' }));
        }
        show('error', data?.error || data?.message || 'Failed to add driver');
      }
    } catch (e) {
      console.error(e);
      show('error', 'Failed to add driver');
    } finally {
      setAdding(false);
    }
  };

  /* ----------------- Delete Driver (Dialog) ----------------- */
  const requestDelete = (driver) => {
    setDelTarget(driver);
    setDelOpen(true);
  };

  const confirmDelete = async () => {
    if (!delTarget) return;
    try {
      setDelBusy(true);
      const res = await fetch(`${API_BASE}/maintenance/drivers/${delTarget.driverId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data?.message?.toLowerCase().includes('deleted')) {
        show('success', 'Driver deleted');
        setDrivers((prev) => prev.filter((d) => d.driverId !== delTarget.driverId));
        setDelOpen(false);
        setDelTarget(null);
      } else {
        show('error', data?.error || 'Failed to delete driver');
      }
    } catch (e) {
      console.error(e);
      show('error', 'Failed to delete driver');
    } finally {
      setDelBusy(false);
    }
  };

  /* ----------------- Derived ----------------- */
  const filtered = drivers.filter((d) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      (`${d.driverName ?? ''} ${d.truckNo ?? ''} ${d.username ?? ''}`).toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-2 sm:p-4">
      <AnimatedContainer className="mb-4">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-indigo-700">Driver Maintenance</h1>
            <p className="text-sm text-gray-600">Add, edit, and delete driver records</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, truck no, username"
              className="px-3 py-2 rounded-full border border-indigo-300 bg-white text-sm placeholder-gray-500 shadow-sm focus:ring-2 focus:ring-indigo-400 outline-none"
            />
            <button onClick={() => setAddOpen(true)} className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm">
              + Add Driver
            </button>
            <button onClick={handleReset} className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition text-sm">
              Reset Changes
            </button>
            <button
              disabled={saving || Object.keys(edits).length === 0}
              onClick={handleSaveAll}
              className={`px-3 py-2 rounded-lg text-sm transition ${
                saving || Object.keys(edits).length === 0
                  ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {saving ? 'Saving...' : 'Save All'}
            </button>
          </div>
        </div>
      </AnimatedContainer>

      {/* Table */}
      <AnimatedContainer>
        <div className="panel p-3 rounded-2xl border border-indigo-100 bg-white shadow-sm">
          {loading ? (
            <div className="w-full h-40 flex items-center justify-center">
              <Loading size={36} className="text-gray-700" color="#374151" />
            </div>
          ) : (
            <div className="overflow-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead>
                  <tr className="bg-indigo-50">
                    {['Driver','Truck No','Cubic','Truck Type','Status','Username','TrackerID','Password (set new)','Action'].map((h) => (
                      <th key={h} className="px-4 py-2 text-left font-semibold text-indigo-700">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filtered.map((d, idx) => {
                    const id = d.driverId;
                    const rowEdits = edits[id] || {};
                    const rowClass = idx % 2 === 0 ? 'bg-white' : 'bg-slate-50';
                    return (
                      <tr key={id} className={`${rowClass} hover:bg-indigo-50`}>
                        <td className="px-4 py-2 w-56">
                          <EditableCell value={rowEdits.driverName ?? d.driverName} onChange={(v) => handleEdit(id, 'driverName', v)} />
                        </td>
                        <td className="px-4 py-2 w-28">
                          <EditableCell type="number" value={rowEdits.truckNo ?? d.truckNo} onChange={(v) => handleEdit(id, 'truckNo', v)} />
                        </td>
                        <td className="px-4 py-2 w-28">
                          <EditableCell type="number" value={rowEdits.cubic ?? d.cubic} onChange={(v) => handleEdit(id, 'cubic', v)} />
                        </td>
                        <td className="px-4 py-2 w-40">
                          <EditableCell value={rowEdits.truckType ?? d.truckType} onChange={(v) => handleEdit(id, 'truckType', v)} />
                        </td>
                        <td className="px-4 py-2 w-40">
                          <select
                            className="w-full px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400"
                            value={rowEdits.status ?? d.status ?? 'available'}
                            onChange={(e) => handleEdit(id, 'status', e.target.value)}
                          >
                            {VALID_STATUSES.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-2 w-48">
                          <EditableCell value={rowEdits.username ?? d.username} onChange={(v) => handleEdit(id, 'username', v)} />
                        </td>
                        <td className="px-4 py-2 w-32">
                          <EditableCell type="number" value={rowEdits.TrackerID ?? d.TrackerID} onChange={(v) => handleEdit(id, 'TrackerID', v)} />
                        </td>
                        <td className="px-4 py-2 w-56">
                          {/* Write-only: let admin set a new one; do not preload */}
                          <EditableCell
                            type="password"
                            value={rowEdits.password ?? ''}
                            onChange={(v) => handleEdit(id, 'password', v)}
                            placeholder="Set new password"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <button
                            onClick={() => requestDelete(d)}
                            className="px-3 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded-md font-medium transition"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="p-4 text-center text-gray-500">No drivers found.</div>
              )}
            </div>
          )}
        </div>
      </AnimatedContainer>

      {/* Add Driver Modal */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add New Driver"
        footer={
          <div className="flex justify-between items-center w-full">
            <div className="text-xs text-slate-500">
              * Username must be unique.
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setAddOpen(false)}
                className="px-3 py-2 rounded-lg bg-white border hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleAddDriver}
                disabled={adding}
                className={`px-3 py-2 rounded-lg text-white ${adding ? 'bg-slate-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}
              >
                {adding ? 'Adding...' : 'Add Driver'}
              </button>
            </div>
          </div>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* driverName */}
          <div>
            <label className="block text-sm font-medium text-slate-700">Driver Name</label>
            <input
              className={`mt-1 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none ${addErrors.driverName ? 'border-red-400' : 'border-slate-300'}`}
              placeholder="e.g., John Doe"
              value={newDriver.driverName}
              onChange={(e) => setNewDriver((p) => ({ ...p, driverName: e.target.value }))}
            />
            {addErrors.driverName && <p className="mt-1 text-xs text-red-600">{addErrors.driverName}</p>}
          </div>

          {/* truckNo */}
          <div>
            <label className="block text-sm font-medium text-slate-700">Truck No (Int)</label>
            <input
              type="number"
              className={`mt-1 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none ${addErrors.truckNo ? 'border-red-400' : 'border-slate-300'}`}
              placeholder="e.g., 123"
              value={newDriver.truckNo}
              onChange={(e) => setNewDriver((p) => ({ ...p, truckNo: e.target.value }))}
            />
            {addErrors.truckNo && <p className="mt-1 text-xs text-red-600">{addErrors.truckNo}</p>}
          </div>

          {/* cubic */}
          <div>
            <label className="block text-sm font-medium text-slate-700">Cubic (Float)</label>
            <input
              type="number"
              step="any"
              className={`mt-1 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none ${addErrors.cubic ? 'border-red-400' : 'border-slate-300'}`}
              placeholder="e.g., 12.5"
              value={newDriver.cubic}
              onChange={(e) => setNewDriver((p) => ({ ...p, cubic: e.target.value }))}
            />
            {addErrors.cubic && <p className="mt-1 text-xs text-red-600">{addErrors.cubic}</p>}
          </div>

          {/* truckType */}
          <div>
            <label className="block text-sm font-medium text-slate-700">Truck Type</label>
            <input
              className={`mt-1 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none ${addErrors.truckType ? 'border-red-400' : 'border-slate-300'}`}
              placeholder="e.g., Tipper"
              value={newDriver.truckType}
              onChange={(e) => setNewDriver((p) => ({ ...p, truckType: e.target.value }))}
            />
            {addErrors.truckType && <p className="mt-1 text-xs text-red-600">{addErrors.truckType}</p>}
          </div>

          {/* status */}
          <div>
            <label className="block text-sm font-medium text-slate-700">Status</label>
            <select
              className={`mt-1 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none ${addErrors.status ? 'border-red-400' : 'border-slate-300'}`}
              value={newDriver.status}
              onChange={(e) => setNewDriver((p) => ({ ...p, status: e.target.value }))}
            >
              {VALID_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {addErrors.status && <p className="mt-1 text-xs text-red-600">{addErrors.status}</p>}
          </div>

          {/* username */}
          <div>
            <label className="block text-sm font-medium text-slate-700">Username (unique)</label>
            <input
              className={`mt-1 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none ${addErrors.username ? 'border-red-400' : 'border-slate-300'}`}
              placeholder="e.g., johndoe"
              value={newDriver.username}
              onChange={(e) => setNewDriver((p) => ({ ...p, username: e.target.value }))}
            />
            {addErrors.username && <p className="mt-1 text-xs text-red-600">{addErrors.username}</p>}
          </div>

          {/* password */}
          <div>
            <label className="block text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              className={`mt-1 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none ${addErrors.password ? 'border-red-400' : 'border-slate-300'}`}
              placeholder="Set initial password"
              value={newDriver.password}
              onChange={(e) => setNewDriver((p) => ({ ...p, password: e.target.value }))}
            />
            {addErrors.password && <p className="mt-1 text-xs text-red-600">{addErrors.password}</p>}
          </div>

          {/* TrackerID */}
          <div>
            <label className="block text-sm font-medium text-slate-700">TrackerID (unique)</label>
            <input
              type="number"
              className={`mt-1 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none ${addErrors.TrackerID ? 'border-red-400' : 'border-slate-300'}`}
              placeholder="e.g., 9001"
              value={newDriver.TrackerID}
              onChange={(e) => setNewDriver((p) => ({ ...p, TrackerID: e.target.value }))}
            />
            {addErrors.TrackerID && <p className="mt-1 text-xs text-red-600">{addErrors.TrackerID}</p>}
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={delOpen}
        onCancel={() => setDelOpen(false)}
        onConfirm={confirmDelete}
        busy={delBusy}
        title="Delete driver?"
        message={
          delTarget
            ? `This will permanently remove ${delTarget.driverName ?? 'this driver'} (ID ${delTarget.driverId}).`
            : 'This will permanently remove the selected driver.'
        }
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
}
