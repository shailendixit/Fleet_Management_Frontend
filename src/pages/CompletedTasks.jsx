import React, { useEffect, useMemo, useState } from "react";
import DataTable from "react-data-table-component";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import LoadingOverlay from '../components/UI/LoadingOverlay';
import { fetchCompleted, selectCompleted } from '../store/tasksSlice';
import { useToast } from '../components/UI/ToastProvider';
import AnimatedContainer from '../components/UI/AnimatedContainer';

const customStyles = {
  header: { style: { padding: "0.75rem 1rem" } },
  headRow: { style: { backgroundColor: "transparent", borderBottomWidth: "0px" } },
  headCells: { style: { paddingLeft: "1rem", paddingRight: "1rem", fontSize: "0.9rem", color: "#475569" } },
  rows: { style: { minHeight: "56px" } },
  cells: { style: { paddingLeft: "1rem", paddingRight: "1rem" } },
};

export default function CompletedTasks() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items, loading, error } = useSelector(selectCompleted);
  const [filter, setFilter] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);

  const { show } = useToast()
  useEffect(() => {
    dispatch(fetchCompleted()).unwrap().catch((err) => {
      // show friendly toast and keep inline error banner as fallback
      try { show('error', String('Failed to load completed tasks')) } catch (e) {}
    });
  }, [dispatch]);

  const columns = useMemo(
    () => [
      {
        name: "Invoice No.",
        selector: (row) => row.invoiceId,
        sortable: true,
        cell: (row) => row.invoiceId,
        grow: 0.5,
      },
      { name: "Order Number", selector: (row) => row.orderNumber, sortable: true, grow: 0.5 },

      {
        name: "Customer Name",
        selector: (row) => row.name,
        sortable: true,
        grow: 0.8,
        cell: (row) => (
          // truncate visually but show full name on hover via native title tooltip
          <span title={row.name} className="truncate max-w-[200px] block">
            {row.name}
          </span>
        ),
      },

      { name: "Completed On", selector: (row) => row.completedAt, sortable: true, grow: 0.5, cell: (r) => <span className="text-sm text-gray-600">{r.completedAt.split("T")[0]}</span> },
      { name: "Description", selector: (row) => row.description, grow: 0.7 },
      { name: "Driver Name", selector: (row) => row.driverName, grow: 0.5 },
      {
        name: "Proof of Delivery",
        selector: (row) => row.POD,
        sortable: false,
        // align right via cell renderer wrapper
        cell: (row) => (
          <div className="text-right">
            <a
              href={row.POD}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-block p-2 rounded-md hover:bg-gray-50"
            >
              <svg className="w-5 h-5 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0l-4-4m4 4l4-4M21 21H3" />
              </svg>
            </a>
          </div>
        ),
        grow: 0.3,
      },
    ],
    [navigate]
  );

  const filtered = useMemo(() => {
    const q = (filter || "").trim().toLowerCase();
    if (!q) return items || [];
    const keys = [
      "invoiceId","invoice","orderNumber","order","zoneNo","postalCode","postcode",
      "stateCode","status","description","driverName","driver","name" // <-- added "name" for customer name search
    ];
    return (items || []).filter((r) => {
      for (let k of keys) {
        const v = String(r[k] ?? "");
        if (v.toLowerCase().includes(q)) return true;
      }
      return false;
    });
  }, [filter, items]);

  return (
    <AnimatedContainer>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Completed Assignments</h1>
          <div className="text-sm text-gray-600 mt-1">Total Assignments <span className="ml-2 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded">{filtered.length}</span></div>
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

      <div className="panel p-3 rounded-2xl border border-indigo-100 relative">
        <LoadingOverlay loading={loading} text="Loading completed tasks..." fullScreen={loading} />
        {error && <div className="text-red-600 p-3">Error loading tasks...</div>}
        <div className="mb-3 flex justify-end">
          <button onClick={() => dispatch(fetchCompleted())} className="px-3 py-1 rounded bg-indigo-600 text-white text-sm hover:bg-indigo-700">Refresh</button>
        </div>
        <DataTable
          columns={columns}
          data={filtered}
          // progressPending removed to avoid DataTable internal spinner
          pagination
          selectableRows
          onSelectedRowsChange={(s) => setSelectedRows(s.selectedRows)}
          selectableRowsHighlight
          highlightOnHover
          customStyles={customStyles}
          defaultSortFieldId={1}
          responsive
        />
      </div>
    </AnimatedContainer>
  );
}
