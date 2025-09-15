import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import tasksService from '../services/tasks.service';
import { useNavigate } from 'react-router-dom';
import Loading from '../components/UI/Loading';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ unassigned: 0, ongoing: 0, completed: 0, drivers: 0 });
  const [fromCache, setFromCache] = useState(false);
  const navigate = useNavigate();

  const CACHE_KEY = 'homeCounts_v1';

  const fetchCounts = async (force = false) => {
    try {
      if (!force) {
        const raw = sessionStorage.getItem(CACHE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            setCounts(parsed);
            setFromCache(true);
            setLoading(false);
            return parsed;
          }
        }
      }

      setLoading(true);
      setFromCache(false);
      const [u, o, c, d] = await Promise.allSettled([
        tasksService.getUnassigned(),
        tasksService.getOngoing(),
        tasksService.getCompleted(),
        tasksService.getDrivers(),
      ]);

      const unassigned = u.status === 'fulfilled' && u.value && u.value.success ? (u.value.data || []).length : 0;
      const ongoing = o.status === 'fulfilled' && o.value && o.value.success ? (o.value.data || []).length : 0;
      const completed = c.status === 'fulfilled' && c.value && c.value.success ? (c.value.data || []).length : 0;
      const drivers = d.status === 'fulfilled' && d.value && d.value.success ? (d.value.data || []).length : 0;
      const payload = { unassigned, ongoing, completed, drivers };
      setCounts(payload);
      try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(payload)); } catch (e) { /* ignore */ }
      return payload;
    } catch (e) {
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      await fetchCounts(false);
    })();
    return () => { mounted = false };
  }, []);

  const cardVars = { hidden: { opacity: 0, y: 8 }, enter: { opacity: 1, y: 0 } };

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-6">
        <div className="panel p-6 rounded-2xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Delivery Dashboard</h1>
              <p className="text-sm text-gray-600 mt-2">Quick overview — assign drivers, track ongoing deliveries and monitor completed jobs.</p>
            </div>

            <div className="flex items-center gap-3">
              <motion.button whileHover={{ scale: 1.03 }} onClick={() => navigate('/assign')} className="px-4 py-2 rounded bg-indigo-600 text-white shadow">Assign Tasks</motion.button>
              <motion.button whileHover={{ scale: 1.03 }} onClick={() => navigate('/track')} className="px-4 py-2 rounded bg-white border">Track Ongoing</motion.button>
              <motion.button whileHover={{ scale: 1.03 }} onClick={() => fetchCounts(true)} className="px-3 py-2 rounded bg-white border text-sm">Refresh</motion.button>
              {fromCache && <div className="text-xs text-gray-500 ml-2">(cached)</div>}
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div initial="hidden" animate="enter" className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[{
          key: 'unassigned', label: 'Unassigned', value: counts.unassigned, color: 'bg-amber-100 text-amber-800'
        }, {
          key: 'ongoing', label: 'Ongoing', value: counts.ongoing, color: 'bg-indigo-50 text-indigo-700'
        }, {
          key: 'completed', label: 'Completed', value: counts.completed, color: 'bg-green-50 text-green-700'
        }, {
          key: 'drivers', label: 'Drivers', value: counts.drivers, color: 'bg-slate-50 text-slate-700'
        }].map((c, i) => (
          <motion.div key={c.key} variants={cardVars} transition={{ delay: 0.06 * i }} className={`panel p-4 rounded-2xl`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-500">{c.label}</div>
                <div className={`text-2xl font-bold mt-2 ${c.color.split(' ')[1]}`}>{loading ? <Loading size={20} className="inline-block" color="#374151" /> : c.value}</div>
                <div className="text-xs text-gray-400 mt-1">{c.key === 'unassigned' ? 'Tasks waiting assignment' : c.key === 'ongoing' ? 'Current deliveries' : c.key === 'completed' ? 'Finished deliveries' : 'Active drivers'}</div>
              </div>
              <div>
                <svg className="w-10 h-10 text-indigo-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="9" />
                </svg>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mt-6 panel p-6 rounded-2xl">
        <h3 className="text-lg font-semibold">Recent Activity</h3>
        <p className="text-sm text-gray-500 mt-2">Showing recent assignment and delivery activity. (This demo lists summaries — use the Assign and Track pages for details.)</p>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 bg-white rounded-lg border">No recent activity — start by assigning tasks.</div>
          <div className="p-3 bg-white rounded-lg border">Tip: Click "Assign Tasks" to open the assign modal and choose drivers.</div>
        </div>
      </motion.div>
    </div>
  )
}
