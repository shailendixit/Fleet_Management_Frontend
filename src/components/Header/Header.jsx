import React, { useState, useRef, useEffect } from "react";
import { motion } from 'framer-motion';
import { useToast } from '../UI/ToastProvider'
import LogoutBtn from "./LogoutBtn";
import { useSelector } from 'react-redux'
import CreateUserModal from '../Auth/CreateUserModal'
const NAV = [
  { id: "home", label: "Home Page" },
  { id: "completed", label: "Completed Tasks" },
  { id: "track", label: "Track Ongoing" },
  { id: "assign", label: "Assign tasks" },
];

export default function Header({ active = "home", onNav = () => {} }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { show: showToast } = useToast()
  const profileRef = useRef();
  const auth = useSelector((s) => s.auth);
  const isAdmin = !!(auth && (auth.user?.role === 'admin' || auth.user?.isAdmin));
  const [createOpen, setCreateOpen] = useState(false);

  // close profile menu when clicking outside
  useEffect(() => {
    function onDoc(e) {
      if (!profileRef.current) return;
      if (!profileRef.current.contains(e.target)) setProfileOpen(false);
    }
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  return (
    <header>
      <div
        className="panel fixed top-3 right-6 md:right-auto md:left-[calc(var(--sidebar-width)+2rem)] z-30 p-3
                   w-[calc(100%-2rem)] max-w-3xl md:w-[60%] rounded-2xl"
        role="banner"
      >
        {/* compact top row */}
        <div className="flex items-center justify-between mb-1">
          <div className="text-lg text-gray-800 font-medium">Welcome back</div>
<div>
           
        </div>
          <div className="flex items-center gap-2">
            {/* mobile menu button */}
            <motion.button whileHover={{ scale: 1.06, rotate: 2 }} className="md:hidden p-2 rounded-full hover:bg-white/60 focus:outline-none" aria-label="Open menu" onClick={() => setMobileNavOpen((s) => !s)}>
              <svg className="w-5 h-5 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path strokeLinecap="round" strokeLinejoin="round" d={mobileNavOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </motion.button>

            <motion.button whileHover={{ scale: 1.04 }} className="hidden sm:inline-flex p-2 rounded-full hover:bg-white/60 focus:outline-none" aria-label="Notifications">
              <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </motion.button>

            <div className="relative" ref={profileRef}>
              <motion.button onClick={() => setProfileOpen((s) => !s)} whileHover={{ scale: 1.03 }} className="flex items-center gap-2 p-1 rounded-full hover:bg-white/60 focus:outline-none" aria-haspopup="true" aria-expanded={profileOpen}>
                <span className="hidden sm:inline text-md text-gray-700">{auth?.user?.username || "Admin"}</span>
                  <div className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 bg-gray-300 text-gray-700 text-sm font-light">
    {(auth?.user?.username || "Admin").substring(0, 2).toUpperCase()}
  </div>

              </motion.button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50 overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50">
                    <div className="text-sm font-semibold text-gray-900">{auth?.user?.username || auth?.user?.name}</div>
                    <div className="text-xs text-gray-500">{auth?.user?.email}</div>
                  </div>
                  <div className="py-1">
                    {isAdmin && (
                      <button className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50" onClick={() => { setProfileOpen(false); setCreateOpen(true); }}>Create user</button>
                    )}
                    <div className="border-t" />
                    <button className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-gray-50" onClick={LogoutBtn}>Logout</button>
                  </div>
                </div>
              )}
              <CreateUserModal open={createOpen} onClose={() => setCreateOpen(false)} />
            </div>
          </div>
        </div>

        {/* compact search row */}
        

        {/* mobile nav panel: only shown on small screens; active comes from parent */}
        {mobileNavOpen && (
          <nav className="mt-3 md:hidden border-t border-gray-100 pt-3">
            <div className="flex flex-col gap-2">
              {NAV.map((n) => {
                const isActive = n.id === active;
                return (
                  <button
                    key={n.id}
                    onClick={() => {
                      onNav(n.id);
                      setMobileNavOpen(false);
                    }}
                    className={
                      "w-full text-left px-3 py-2 rounded-lg flex items-center gap-3 transition " +
                      (isActive ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100 border-l-4 border-indigo-300" : "text-gray-600 hover:bg-gray-50")
                    }
                    aria-current={isActive ? "page" : undefined}
                  >
                    <span className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">
                      {n.label.charAt(0)}
                    </span>
                    <span className="font-medium">{n.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-3 border-t pt-3">
              <LogoutBtn className="w-full flex items-center gap-3 px-3 py-3 rounded-lg bg-gray-800 text-white hover:bg-gray-700">Logout</LogoutBtn>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}