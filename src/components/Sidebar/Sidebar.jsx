import React from "react";
import { motion } from 'framer-motion';
import Logo from "../../assets/Company-Logo.png"; // adjust extension if needed
import LogoutBtn from '../Header/LogoutBtn';

const navItems = [
  { id: "home", label: "Home Page", icon: HomeIcon },
  { id: "completed", label: "Completed Tasks", icon: CheckIcon },
  { id: "track", label: "Track Ongoing", icon: TrackIcon },
  { id: "assign", label: "Assign tasks", icon: AssignIcon },
  { id: "maintain", label: "Maintain Drivers", icon: MaintainenceIcon },
];

export default function Sidebar({ active = "assign", onNav = () => {} }) {
  return (
  <aside className="hidden md:flex fixed inset-y-5 left-6 w-50 panel flex-col justify-between p-6 z-40 shadow">
      <div>
        <div className="flex justify-center mb-6">
          <div className="w-40 h-20 rounded-lg bg-white/75 p-2 flex items-center justify-center border border-indigo-100 backdrop-blur-sm">
            <img src={Logo} alt="Company Logo" className="object-contain max-w-full max-h-full mix-blend-multiply filter brightness-95" />
          </div>
        </div>

        <nav className="flex flex-col gap-2">
          {navItems.map((n) => {
            const isActive = n.id === active;
            return (
              <motion.button
                key={n.id}
                onClick={() => onNav(n.id)}
                  className={
                    "w-full text-left px-3 py-3 rounded-lg flex items-center gap-3 transition " +
                    (isActive
                      ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100 border-l-4 border-indigo-300 shadow-sm"
                      : "text-gray-600")
                  }
                  whileHover={isActive ? { scale: 1.02 } : { scale: 1.03, rotate: 0.5 }}
                  whileTap={{ scale: 0.98 }}
                aria-current={isActive ? "page" : undefined}
                >
                  <span className="flex-none">{React.createElement(n.icon, { className: isActive ? "text-indigo-600" : "text-gray-400" })}</span>
                <span className="font-medium">{n.label}</span>
                </motion.button>
            );
          })}
        </nav>
      </div>

      <div>
        <LogoutBtn className="w-full flex items-center gap-3 px-3 py-3 rounded-lg bg-gray-800 text-white hover:bg-gray-700">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1" />
          </svg>
          <span className="font-medium">Logout</span>
        </LogoutBtn>
      </div>
    </aside>
  );
}




/* --------- small inline SVG icon components --------- */
function HomeIcon({ className = "text-gray-400" }) {
  return (
    <svg className={`h-5 w-5 ${className}`} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 11.5L12 4l9 7.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1v-8.5z" />
    </svg>
  );
}
function CheckIcon({ className = "text-gray-400" }) {
  return (
    <svg className={`h-5 w-5 ${className}`} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
function TrackIcon({ className = "text-gray-400" }) {
  return (
    <svg className={`h-5 w-5 ${className}`} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h3l3 8 4-16 3 8h4" />
    </svg>
  );
}
function AssignIcon({ className = "text-gray-400" }) {
  return (
    <svg className={`h-5 w-5 ${className}`} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3M7 21h10a2 2 0 002-2V7a2 2 0 00-2-2h-3.5L12 3 8.5 5H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}
function MaintainenceIcon({ className = "text-gray-400" }) {
  return (
    <svg
      className={`h-5 w-5 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.325 4.317a1 1 0 011.35-.936l1.618.54a1 1 0 00.949-.154l1.272-.955a1 1 0 011.387.316l1.066 1.647a1 1 0 00.916.44l1.733-.138a1 1 0 011.037.937l.135 1.733a1 1 0 00.44.916l1.647 1.066a1 1 0 01.316 1.387l-.955 1.272a1 1 0 00-.154.949l.54 1.618a1 1 0 01-.936 1.35l-1.733.135a1 1 0 00-.916.44l-1.066 1.647a1 1 0 01-1.387.316l-1.272-.955a1 1 0 00-.949-.154l-1.618.54a1 1 0 01-1.35-.936l-.135-1.733a1 1 0 00-.44-.916l-1.647-1.066a1 1 0 01-.316-1.387l.955-1.272a1 1 0 00.154-.949l-.54-1.618a1 1 0 01.936-1.35l1.733-.135a1 1 0 00.916-.44l1.066-1.647a1 1 0 011.387-.316l1.272.955a1 1 0 00.949.154l1.618-.54z"
      />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function LogoutIcon({ className = "text-white" }) {
  return (
    <svg className={`h-5 w-5 ${className}`} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1" />
    </svg>
  );
}