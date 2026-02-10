// AllVehiclesMap.jsx
import React, { useEffect, useRef, useState, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import tasksService from "../services/tasks.service";
import { useToast } from "../components/UI/ToastProvider";

/**
 * LocationIcon - the small inline SVG component you gave (converted to React component)
 */
export function LocationIcon({ className = "text-gray-400" }) {
  return (
    <svg className={`h-5 w-5 ${className}`} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3M7 21h10a2 2 0 002-2V7a2 2 0 00-2-2h-3.5L12 3 8.5 5H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

/**
 * Utility: create an SVG marker as a data URL.
 * Produces a neat pin with a small badge text (e.g., type/reg).
 */
function makeMarkerSvg({ color = "#0b74de", label = "", rotation = 0, size = 48 }) {
  const r = encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 48 48'>
      <defs>
        <filter id='s' x='-50%' y='-50%' width='200%' height='200%'>
          <feDropShadow dx='0' dy='1' stdDeviation='2' flood-color='#000' flood-opacity='0.25'/>
        </filter>
      </defs>
      <g transform='translate(0 0)' style='filter:url(#s);'>
        <path d='M24 4c-5.523 0-10 4.477-10 10 0 7.5 10 22 10 22s10-14.5 10-22c0-5.523-4.477-10-10-10z' fill='${color}'/>
        <circle cx='24' cy='16' r='6.5' fill='white'/>
        <g transform='translate(17 12)' fill='${color}'>
          <rect x='0' y='2' width='10' height='6' rx='1'/>
        </g>
        ${label ? `<text x='24' y='28' font-size='8' text-anchor='middle' fill='white' font-family='Arial' font-weight='700'>${label}</text>` : ''}
      </g>
    </svg>`
  );
  // Wrap in a rotating div when used as an icon (we will set rotation via L.divIcon wrapper)
  return `data:image/svg+xml;utf8,${r}`;
}

/**
 * AllVehiclesMap component
 * - Manual refresh only
 * - Preserves viewport on refresh
 * - Explicit Fit Bounds action
 */
export default function AllVehiclesMap() {
  const mapNodeRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({}); // TrackerID -> Marker
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [initialLoaded, setInitialLoaded] = useState(false);
  const { show } = useToast();

  // load vehicles using your service - manual only
  const loadVehicles = async (preserveView = true) => {
    setLoading(true);
    setError(null);
    // capture current view so we can restore after updating markers
    const preserve = preserveView && mapRef.current;
    const currentCenter = preserve ? mapRef.current.getCenter() : null;
    const currentZoom = preserve ? mapRef.current.getZoom() : null;

    try {
      const res = await tasksService.getNetstarVehicles();
      if (res && res.success && res.data?.Vehicles) {
        const items = res.data.Vehicles.map(v => ({
          ...v,
          TrackerID: Number(v.TrackerID),
          Latitude: Number(v.Latitude),
          Longitude: Number(v.Longitude)
        }));
        setVehicles(items);
      } else if (res && res.Vehicles) {
        const items = res.Vehicles.map(v => ({
          ...v,
          TrackerID: Number(v.TrackerID),
          Latitude: Number(v.Latitude),
          Longitude: Number(v.Longitude)
        }));
        setVehicles(items);
      } else {
        throw new Error("Invalid response from NETSTAR");
      }
      setInitialLoaded(true);
    } catch (e) {
      console.error("Failed to load vehicles", e);
      setError(String(e?.message || e));
      show?.("error", "Failed to load vehicle locations");
    } finally {
      setLoading(false);
      // restore previous view if we preserved it
      if (preserve && currentCenter && isFinite(currentCenter.lat) && isFinite(currentZoom)) {
        mapRef.current.setView(currentCenter, currentZoom);
      }
    }
  };

  // init map
  useEffect(() => {
    if (!mapNodeRef.current) return;
    mapRef.current = L.map(mapNodeRef.current, { zoomControl: true, attributionControl: true });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors"
    }).addTo(mapRef.current);

    // initial center (your depot coordinates)
    mapRef.current.setView([-33.7154, 150.7722], 14);

    return () => {
      if (mapRef.current) mapRef.current.remove();
      mapRef.current = null;
    };
  }, []);

  // initial load (manual-only thereafter)
  useEffect(() => {
    loadVehicles(false); // load once on mount; do NOT try to preserve view (map just initialized)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // update markers whenever vehicles changes (do not alter map view)
  useEffect(() => {
    if (!mapRef.current) return;

    const existingIds = new Set(Object.keys(markersRef.current).map(k => Number(k)));
    const incomingIds = new Set(vehicles.map(v => Number(v.TrackerID)));

    // remove markers that disappeared
    for (let id of existingIds) {
      if (!incomingIds.has(id)) {
        const m = markersRef.current[id];
        if (m) {
          m.remove();
          delete markersRef.current[id];
        }
      }
    }

    // add/update markers
    vehicles.forEach(v => {
      if (!isFinite(v.Latitude) || !isFinite(v.Longitude)) return;
      const latlng = [v.Latitude, v.Longitude];
      const id = Number(v.TrackerID);

      // nice popup content
      const popupHtml = `
        <div style="min-width:220px; font-family: Inter, Arial, sans-serif; color: #0f172a;">
          <div style="font-weight:700; margin-bottom:6px;">${escapeHtml(v.VehicleName || v.Rego || v.VehicleUniqueCode || "Vehicle")}</div>
          <div style="font-size:13px; color:#374151;">
            ${v.SuburbOrZone ? `<div>${escapeHtml(v.SuburbOrZone)}</div>` : ""}
            <div style="margin-top:6px;"><b>Rego:</b> ${escapeHtml(v.Rego || "-")} &nbsp; <b>Speed:</b> ${escapeHtml(v.Speed ?? 0)} km/h</div>
            <div style="margin-top:4px; font-size:12px; color:#6b7280;"><b>Time:</b> ${v.Time ? new Date(v.Time).toLocaleString() : "-"}</div>
          </div>
        </div>
      `;

      // determine badge label: prefer Rego short, else type
      const badge = (v.Rego || v.VehicleType || "").toString().slice(0, 3).toUpperCase();

      // create or update icon (we use rotate transform on the wrapper DIV to honor direction)
      const svgUrl = makeMarkerSvg({ color: v.GpsLocked ? "#0b74de" : "#94a3b8", label: badge, size: 48 });
      const iconHtml = `<div style="transform: rotate(${Number(v.Direction || 0)}deg)">${'<img src="' + svgUrl + '" style="display:block;width:48px;height:48px"/>'}</div>`;
      const icon = L.divIcon({ html: iconHtml, className: "", iconSize: [48, 48], iconAnchor: [24, 48] });

      if (markersRef.current[id]) {
        // update position and icon + popup content
        markersRef.current[id].setLatLng(latlng);
        markersRef.current[id].setIcon(icon);
        markersRef.current[id].getPopup()?.setContent(popupHtml);
      } else {
        const marker = L.marker(latlng, { icon }).addTo(mapRef.current);
        marker.bindPopup(popupHtml);
        markersRef.current[id] = marker;
      }
    });

    // do NOT fit bounds automatically after refresh. user must click Fit Bounds.
    // If this is the first time after mount and markers exist, fit bounds so user sees vehicles initially.
    if (!initialLoaded && Object.values(markersRef.current).length) {
      const group = L.featureGroup(Object.values(markersRef.current));
      try {
        mapRef.current.fitBounds(group.getBounds().pad(0.12));
      } catch (e) {}
      setInitialLoaded(true);
    }

  }, [vehicles, initialLoaded]);

  // helper to safely open popup and center
  const centerOnVehicle = (v) => {
    if (!mapRef.current || !v) return;
    const lat = Number(v.Latitude);
    const lon = Number(v.Longitude);
    if (!isFinite(lat) || !isFinite(lon)) return;
    mapRef.current.setView([lat, lon], Math.max(mapRef.current.getZoom(), 15), { animate: true });
    const m = markersRef.current[v.TrackerID];
    if (m) {
      // open popup after a tiny delay to ensure marker is in DOM
      setTimeout(() => m.openPopup(), 150);
    }
  };

  // filtered list
  const filtered = useMemo(() => {
    const q = (query || "").trim().toLowerCase();
    if (!q) return vehicles;
    return vehicles.filter(v => {
      const fields = [v.VehicleName, v.Rego, v.SuburbOrZone, v.GroupName, v.VehicleType,v.TrackerID];
      return fields.some(f => (f || "").toString().toLowerCase().includes(q));
    });
  }, [vehicles, query]);

  // Fit to all markers (explicit)
  const fitAll = () => {
    const markers = Object.values(markersRef.current);
    if (!markers.length) return;
    const group = L.featureGroup(markers);
    mapRef.current.fitBounds(group.getBounds().pad(0.12));
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-4 p-4">
      <div className="w-80 bg-white rounded-2xl shadow p-3 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Vehicles</h3>
          <div className="flex gap-2">
            <button
              onClick={() => loadVehicles(true)}
              className="px-3 py-1 rounded bg-indigo-600 text-white text-sm hover:bg-indigo-700"
            >
              Refresh
            </button>
            <button
              onClick={() => fitAll()}
              className="px-3 py-1 rounded bg-slate-50 text-slate-800 text-sm hover:bg-slate-100"
            >
              Fit Bounds
            </button>
          </div>
        </div>

        <div className="mb-3">
          <div className="relative">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, rego, suburb..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
            />
            <div className="absolute right-3 top-2.5">
              <LocationIcon className="text-slate-400" />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {loading && <div className="text-sm text-gray-500">Loading vehicles...</div>}
          {error && <div className="text-sm text-red-600">{error}</div>}
          {!loading && !vehicles.length && <div className="text-sm text-gray-500">No vehicles found</div>}

          <ul className="space-y-2 mt-1">
            {filtered.map(v => (
              <li key={v.TrackerID} className="p-2 rounded-lg hover:bg-slate-50 cursor-pointer flex gap-2" onClick={() => centerOnVehicle(v)}>
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-md bg-sky-50 flex items-center justify-center text-sky-700 font-bold text-sm">
                    {(v.VehicleType || '').slice(0,2).toUpperCase()}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-slate-800">{v.VehicleName || v.Rego || 'Vehicle'}</div>
                  <div className="text-xs text-slate-500">{v.SuburbOrZone || '-'}</div>
                  <div className="text-xs text-slate-400 mt-1">
                    <span className="mr-2"><b>TrackerId:</b> {v.TrackerID || '-'}</span>
                    <span className="mr-2"><b>Speed:</b> {v.Speed ?? 0} km/h</span>
                  </div>
                </div>
                <div className="text-xs text-slate-400">{v.Time ? new Date(v.Time).toLocaleString() : ''}</div>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-3 text-xs text-slate-500">
          Showing <strong>{filtered.length}</strong> of <strong>{vehicles.length}</strong> vehicles.
        </div>
      </div>

      <div className="flex-1 rounded-2xl overflow-hidden relative shadow">
        <div ref={mapNodeRef} style={{ height: "100%", width: "100%" }} />
        <div className="absolute right-4 top-4 flex flex-col gap-2">
          <button
            onClick={() => {
              if (mapRef.current) mapRef.current.setView([-33.7154, 150.7722], 14);
            }}
            className="px-3 py-2 rounded bg-white shadow text-sm"
            title="Center default area"
          >
            Center
          </button>
          <button
            onClick={() => {
              // small visual pulse on markers (demo)
              Object.values(markersRef.current).forEach(marker => {
                const el = marker.getElement();
                if (!el) return;
                el.style.transition = "transform 0.28s ease";
                el.style.transform = "scale(1.08)";
                setTimeout(() => (el.style.transform = "scale(1)"), 280);
              });
            }}
            className="px-3 py-2 rounded bg-white shadow text-sm"
            title="Pulse markers"
          >
            Pulse
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Helpers ---------- */
function escapeHtml(s = "") {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
