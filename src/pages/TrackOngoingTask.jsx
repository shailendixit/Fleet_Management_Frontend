import React, { useMemo, useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import { useDispatch, useSelector } from 'react-redux';
import { fetchOngoing, selectOngoing } from '../store/tasksSlice';
import tasksService from '../services/tasks.service';
import { useToast } from '../components/UI/ToastProvider';
import AnimatedContainer from '../components/UI/AnimatedContainer';
import LoadingOverlay from '../components/UI/LoadingOverlay';
const API_BASE = import.meta.env.VITE_BACKEND_API_URL;
const SAMPLE = [
  { id: "1", invoice: "1261756", order: "20116018", postcode: "2170", status: "In Progress", description: "Refrig", driver: "Adam", podUrl: "/pods/1261756.pdf" },
  { id: "2", invoice: "1261757", order: "20116020", postcode: "2167", status: "Complete", description: "AC", driver: "Mark", podUrl: "/pods/1261757.pdf" },
];

const customStyles = {
  header: { style: { padding: "0.75rem 1rem" } },
  headRow: { style: { backgroundColor: "transparent", borderBottomWidth: "0px" } },
  headCells: { style: { paddingLeft: "1rem", paddingRight: "1rem", fontSize: "0.9rem", color: "#475569" } },
  rows: { style: { minHeight: "56px" } },
  cells: { style: { paddingLeft: "1rem", paddingRight: "1rem" } },
};

export default function TrackOngoing() {
  const dispatch = useDispatch();
  const { items, loading, error } = useSelector(selectOngoing);
  const [filter, setFilter] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);
  const [vehiclesMap, setVehiclesMap] = useState({});
  const [lastNetstarRefresh, setLastNetstarRefresh] = useState(null); // ✅ Added

  const { show } = useToast();

  // ✅ Fetch Netstar Vehicles
  const fetchNetstarVehicles = async () => {
    try {
      const res = await tasksService.getNetstarVehicles();

      if (res && res.success && res.data?.Vehicles) {
        const map = Object.fromEntries(
          res.data.Vehicles.map(v => [Number(v.TrackerID), v])
        );
        setVehiclesMap(map);
        setLastNetstarRefresh(new Date()); // store local refresh timestamp
      } else {
        console.warn("Netstar fetch error", res?.error);
        setVehiclesMap({});
      }
    } catch (e) {
      console.warn("Netstar fetch failed", e);
      setVehiclesMap({});
    }
  };

  // ✅ Combined effect (fetch both APIs on mount)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await dispatch(fetchOngoing()).unwrap();
      } catch {
        show("error", "Failed to load ongoing tasks");
      }

      if (mounted) await fetchNetstarVehicles();
    })();
    return () => { mounted = false };
  }, [dispatch]);

  // ✅ Columns
  const columns = useMemo(
    () => [
      { name: "Invoice No.", selector: (row) => row.invoiceId ?? row.invoice, sortable: true },
      { name: "Order Number", selector: (row) => row.orderNumber ?? row.order, sortable: true },
      { name: "Zone", selector: (row) => row.zoneNo, sortable: true },
      { name: "State", selector: (row) => row.stateCode, sortable: true, cell: (r) => <span className="text-sm text-gray-600">{r.stateCode}</span> },
      { name: "Description", selector: (row) => row.description },
      { name: "Driver Name", selector: (row) => row.driverName ?? row.driverName, sortable: true },
      { name: "TruckNo", selector: (row) => row.truckNo ?? row.truckNo },
      { name: "Status", selector: (row) => row.status, sortable: true, cell: (r) => <span className="text-sm text-gray-600">{r.status}</span> },

      {
        name: (
          <div className="flex flex-col items-start">
            <span>Track Item</span>
            {lastNetstarRefresh && (
              <span className="text-xs text-gray-500">
                Last updated: {lastNetstarRefresh.toLocaleString('en-AU', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            )}
          </div>
        ),
        selector: (row) => row.TrackerID ?? row.trackerId,
        cell: (row) => {
          const trackerId = Number(row.TrackerID ?? row.trackerId ?? row.TrackID);
          const v = vehiclesMap[trackerId];

          if (!v) return <span className="text-sm text-gray-500">—</span>;

          const street = v.StreetOrLocation || '';
          const suburb = v.SuburbOrZone || '';
          const text = [street, suburb].filter(Boolean).join(' — ');

          return <span className="text-sm text-gray-700">{text || '—'}</span>;
        },
      },
    ],
    [vehiclesMap, lastNetstarRefresh]
  );

  const filtered = useMemo(() => {
    const q = (filter || "").trim().toLowerCase();
    if (!q) return items || [];
    const keys = ["invoiceId","invoice","orderNumber","order","zoneNo","postalCode","postcode","stateCode","status","description","driverName","driver"];
    return (items || []).filter((r) => {
      for (let k of keys) {
        const v = String(r[k] ?? "");
        if (v.toLowerCase().includes(q)) return true;
      }
      return false;
    });

  }, [filter, items]);

  // ✅ Function to download Excel from backend
  const handleDownloadExcel = async () => {
    try {
      const res = await fetch(`${API_BASE}/tasks/getTaskWithoutInvoice`, {
      method: "GET",
      });

      if (!res.ok) throw new Error("Failed to download file");

      // Convert response to Blob (binary file)
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      // Create a temporary link and trigger download
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "tasks_without_invoice.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();

      show("success", "Excel file downloaded successfully");
    } catch (err) {
      console.error(err);
      show("error", "Failed to download Excel file");
    }
  };

  return (
    <div>
      <AnimatedContainer className="mb-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Ongoing Assignments</h1>
            <div className="text-sm text-gray-600 mt-1">Total Assignments <span className="ml-2 px-2 py-0.5 bg-sky-50 text-sky-700 rounded">{filtered.length}</span></div>
          </div>

          <div className="flex items-center gap-3">
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search..."
              className="pl-3 pr-3 py-2 rounded-full border border-indigo-300 bg-white text-sm font-semibold placeholder-gray-500 shadow-sm"
            />
          </div>
        </div>
      </AnimatedContainer>

      <AnimatedContainer>
        <div className="panel p-3 rounded-2xl border border-indigo-100 relative">
          <LoadingOverlay loading={loading} text="Loading ongoing assignments..." fullScreen={loading} />
          {error && <div className="text-red-600 p-3">Error loading tasks...</div>}
          <div className="mb-3 flex justify-end gap-2">
<button
  onClick={async () => {
    try {
      await dispatch(fetchOngoing()).unwrap();
      await fetchNetstarVehicles(); // ✅ Also refresh locations
      show("success", "All data refreshed successfully");
    } catch (err) {
      show("error", "Failed to refresh data");
      console.error(err);
    }
  }}
  className="px-3 py-1 my-0.5 rounded bg-indigo-600 text-white text-sm hover:bg-indigo-700"
>
  Refresh All
</button>


  <button
    onClick={fetchNetstarVehicles}
    className="px-3 py-1 my-0.5 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
  >
    Refresh Locations
  </button>

  <button
    onClick={handleDownloadExcel}
    className="px-3 py-1 rounded bg-green-600 text-white text-sm hover:bg-green-700"
  >
    Download Excel
  </button>
</div>

          <DataTable
            columns={columns}
            data={filtered}
            // progressPending removed to avoid DataTable's internal spinner
            pagination
            selectableRows
            onSelectedRowsChange={(s) => setSelectedRows(s.selectedRows)}
            selectableRowsHighlight
            highlightOnHover
            customStyles={customStyles}
            responsive
          />
          {/* location displayed inline in Track Item column */}
        </div>
      </AnimatedContainer>
    </div>
  );
}