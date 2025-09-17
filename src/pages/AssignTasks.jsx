import React, { useEffect, useMemo, useState } from 'react';
import tasksService from '../services/tasks.service';
import { useToast } from '../components/UI/ToastProvider';
import AnimatedContainer from '../components/UI/AnimatedContainer';
import Loading from '../components/UI/Loading';

function ZoneCard({ name, count, onOpen }) {
  return (
    <div className="p-4 rounded-lg border cursor-pointer hover:shadow hover:border-indigo-300 bg-white" onClick={() => onOpen(name)}>
      <div className="text-lg font-semibold">{name}</div>
      <div className="text-sm text-gray-600">{count} unassigned</div>
    </div>
  )
}

function AssignModal({ zone, tasks, drivers, onClose, onAssign }) {
  const [assignMap, setAssignMap] = useState({});
  const [selected, setSelected] = useState(new Set());
  const [bulkDriver, setBulkDriver] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // reset modal state when zone changes
  useEffect(() => { setAssignMap({}); setSelected(new Set()); setBulkDriver(''); }, [zone]);

  // taskId is used as the stable key (tasks from API use taskId)
  const handleChange = (taskId, driverId) => setAssignMap((s) => ({ ...s, [taskId]: driverId }));
  const toggleSelect = (taskId) => setSelected((s) => { const n = new Set(s); if (n.has(taskId)) n.delete(taskId); else n.add(taskId); return n });

  const applyBulk = () => {
    if (!bulkDriver) return;
    const entries = {};
    selected.forEach(tid => { entries[tid] = bulkDriver });
    setAssignMap((s) => ({ ...s, ...entries }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-lg p-6 w-[900px] max-w-full shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Assign tasks — {zone && zone.toString().toLowerCase().includes('zone') ? zone : `${zone} Zone`}</h3>
          <div className="flex items-center gap-3">
            <select value={bulkDriver} onChange={(e) => setBulkDriver(e.target.value)} className="px-2 py-1 border rounded">
              <option value="">Assign selected to...</option>
              {drivers.map(d => <option key={d.driverId} value={d.driverId}>{d.driverName}{d.truckNo ? ` — ${d.truckNo}` : ''}</option>)}
            </select>
            <button onClick={applyBulk} className="px-3 py-1 rounded bg-indigo-100 text-indigo-700">Apply to selected</button>
            <button className="px-3 py-1 rounded bg-gray-200" onClick={onClose}>Close</button>
            <button className="px-3 py-1 rounded bg-indigo-600 text-white flex items-center gap-2" onClick={async () => {
              try {
                setSubmitting(true);
                await onAssign(assignMap);
              } finally {
                setSubmitting(false);
              }
            }}>
              {submitting ? (
                <svg className="w-4 h-4 animate-spin text-white" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" fill="none" />
                </svg>
              ) : null}
              <span>Assign Selected</span>
            </button>
          </div>
        </div>

            <div className="space-y-3 max-h-[60vh] overflow-auto">
          {tasks.length === 0 && <div className="p-4 text-center text-gray-600">No tasks in this zone</div>}
          {tasks.map(t => {
        const id = t.taskId ?? t.id; // support both shapes
        return (
        <div key={id} className="flex items-center justify-between p-3 border rounded">
              <div className="flex items-start gap-3">
                <label className="mt-1">
          <input type="checkbox" checked={selected.has(id)} onChange={() => toggleSelect(id)} />
                </label>
                <div>
                  <div className="font-medium">{t.orderNumber} — {t.description}</div>
                 <div className="text-sm text-gray-500 flex space-x-4">
                    <span>• Postcode: {t.postalCode}</span>
                    <span>• StateCode: {t.stateCode}</span>
                    <span>• RouteCode: {t.routeCode}</span>
                    <span>• StopCode: {t.stopCode}</span>
                    <span>• ShipTo: {t.shipTo}</span>
                  </div>
                 <div className="text-sm text-gray-500 flex space-x-3">
                    <span>• Quantity: {t.quantityOrdered}</span>
                    <span>• Name: {t.name}</span>
                    <span>• ItemNumber: {t.itemNumber}</span>
                  </div>
                  {t.podUrl && <div className="text-sm mt-1"><a href={t.podUrl} target="_blank" rel="noreferrer" className="text-indigo-600">View POD</a></div>}
                </div>
              </div>
                <div className="flex items-center gap-3">
                <select value={assignMap[id] || ''} onChange={(e) => handleChange(id, e.target.value)} className="px-2 py-1 border rounded bg-white">
                  <option value="">Select driver</option>
                  {drivers.map(d => <option key={d.driverId} value={d.driverId}>{d.driverName}{d.truckNo ? ` — ${d.truckNo}` : ''}</option>)}
                </select>
              </div>
            </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function AssignTasks() {
  const [unassigned, setUnassigned] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [zoneOpen, setZoneOpen] = useState(null);
  const { show } = useToast();

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const u = await tasksService.getUnassigned();
        const d = await tasksService.getDrivers();
        if (u && u.success) setUnassigned(u.data || []);
        if (d && d.success) setDrivers(d.data || []);
        setLoading(false);
      } catch (e) {
        setLoading(false);
        try { show('error', 'Failed to load unassigned tasks or drivers') } catch (err) {}
      }
    })();
  }, []);

  const zones = useMemo(() => {
    const map = {};
    const MISSING = 'Zone not mentioned';
    unassigned.forEach(t => {
      const key = (t.zoneNo === null || t.zoneNo === undefined || String(t.zoneNo).trim() === '') ? MISSING : t.zoneNo;
      map[key] = (map[key] || []).concat(t);
    });
    return map;
  }, [unassigned]);

  const handleAssign = async (assignMap) => {
    // build payload with driver details looked up from drivers list
    const driverById = Object.fromEntries(drivers.map(d => [String(d.driverId), d]));
    const tasks = Object.entries(assignMap).filter(([, driver]) => driver).map(([taskId, driverId]) => {
      const drv = driverById[String(driverId)];
      return {
        taskId: Number(taskId),
        truckNo: drv ? drv.truckNo ?? drv.truckNo : undefined,
        cubic: drv ? drv.cubic : undefined,
        driverName: drv ? drv.driverName : undefined,
        truckType: drv ? drv.truckType : undefined,
      }
    }).filter(t => t.driverName);

    if (tasks.length === 0) { show('error', 'No assignments selected'); return }
    // return promise so caller (modal) can await for local spinner
    return (async () => {
      try {
        const res = await tasksService.assignTasks(tasks);
        if (res && res.success) {
          show('success', 'Assignments saved');
          // remove assigned tasks locally
          const assignedIds = tasks.map(p => p.taskId);
          setUnassigned((s) => s.filter(t => !assignedIds.includes(t.taskId ?? t.id)));
          setZoneOpen(null);
          return res;
        } else {
          show('error', 'Assign API failed');
          throw new Error('Assign API failed');
        }
      } catch (e) {
        show('error', 'Assign failed');
        throw e;
      }
    })();
  }

  return (
    <div>
      <AnimatedContainer className="mb-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Assign Tasks</h1>
            <div className="text-sm text-gray-600 mt-1">Unassigned tasks: <span className="ml-2 inline-block px-3 py-0.5 bg-amber-100 text-amber-800 rounded-full font-medium">{unassigned.length}</span></div>
          </div>
        </div>
      </AnimatedContainer>

      <AnimatedContainer>
        <div className="max-h-[60vh] overflow-auto p-2">
            <div className="relative">
                {loading ? (
                  <div className="w-full h-40 flex items-center justify-center">
                    <Loading size={36} className="text-gray-700" color="#374151" />
                  </div>
                ) : (
                  unassigned.length === 0 ? (
                    <div className="w-full h-40 flex items-center justify-center text-gray-600">No unassigned tasks available</div>
                  ) : (
                    <div className="grid grid-cols-3 gap-4">
                      {Object.entries(zones).map(([z, tasks]) => (
                        <ZoneCard key={z} name={z} count={tasks.length} onOpen={(name) => setZoneOpen(name)} />
                      ))}
                    </div>
                  )
                )}
              </div>
        </div>
      </AnimatedContainer>

      {zoneOpen && (
        <AssignModal zone={zoneOpen} tasks={(zones[zoneOpen] || [])} drivers={drivers} onClose={() => setZoneOpen(null)} onAssign={(map) => {
          // build payload similar to handleAssign: include driver details
          const driverById = Object.fromEntries(drivers.map(d => [String(d.driverId), d]));
          const tasksPayload = Object.entries(map).filter(([, driver]) => driver).map(([taskId, driverId]) => {
            const drv = driverById[String(driverId)];
            return {
              taskId: Number(taskId),
              truckNo: drv ? drv.truckNo ?? drv.truckNo : undefined,
              cubic: drv ? drv.cubic : undefined,
              driverName: drv ? drv.driverName : undefined,
              truckType: drv ? drv.truckType : undefined,
            }
          }).filter(t => t.driverName);
          if (tasksPayload.length === 0) { show('error', 'No assignments selected'); return }
          (async () => {
            try {
              const res = await tasksService.assignTasks(tasksPayload);
              if (res && res.success) {
                show('success', 'Assignments saved');
                const assignedIds = tasksPayload.map(p => p.taskId);
                setUnassigned((s) => s.filter(t => !assignedIds.includes(t.taskId ?? t.id)));
                setZoneOpen(null);
              } else {
                show('error', (res && (res.error || JSON.stringify(res.data))) || 'Assign API failed');
              }
            } catch (e) {
              show('error', 'Assign failed');
            }
          })();
        }} />
      )}
    </div>
  )
}
