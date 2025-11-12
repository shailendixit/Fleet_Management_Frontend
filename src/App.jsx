import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence, motion } from 'framer-motion';
import "./App.css";
import Sidebar from "./components/Sidebar/Sidebar";
import Header from "./components/Header/Header";
import AnimatedContainer from './components/UI/AnimatedContainer';
import CompletedTasks from "./pages/CompletedTasks";
import TrackOngoing from "./pages/TrackOngoingTask";
import AssignTasks from "./pages/AssignTasks";
import AllVehiclesMap from "./pages/AllVechileLocation";
import Home from "./pages/Home";
import Login from "./pages/Login";
import MaintainDriver from "./pages/Maintainence";
import { useSelector } from 'react-redux';
import useInitAuth from './hooks/useInitAuth';
import RequireAuth from './components/Auth/RequireAuth';
import RedirectIfAuth from './components/Auth/RedirectIfAuth';
import Loading from './components/UI/Loading'
import { main } from "framer-motion/client";

// Home moved to src/pages/Home.jsx
// AssignTasks component is implemented in src/pages/AssignTasks.jsx

// map nav id <-> path
const idToPath = {
  home: "/",
  completed: "/completed",
  track: "/track",
  assign: "/assign",
  maintain: "/maintain",
  location: "/location",
};
const pathToId = (path) => {
  if (path === "/") return "home";
  if (path.startsWith("/completed")) return "completed";
  if (path.startsWith("/track")) return "track";
  if (path.startsWith("/assign")) return "assign";
  if (path.startsWith("/maintain")) return "maintain";
  if(path.startsWith("/location")) return "location";
  return "home";
};

function AppRouter() {
  // Hooks must be called unconditionally and in the same order on every render.
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useSelector((s) => s.auth);
  const [active, setActive] = useState(pathToId(location.pathname));

  // keep active in sync with URL ( browser nav / direct links)
  useEffect(() => {
    setActive(pathToId(location.pathname));
  }, [location.pathname]);

  // navigation helper used by Sidebar & Header
  const handleNav = (id) => {
    const p = idToPath[id] ?? "/";
    setActive(id);
    // avoid redundant push
    if (location.pathname !== p) navigate(p);
  };

  if (auth.loading) return <Loading size={64} color="#4F46E5" overlay={true} />;

  return (
    <div className="min-h-screen">
      {/* show sidebar/header only on non-auth pages */}
  {!(location.pathname === '/login') && (
        <>
          <AnimatedContainer>
            <Sidebar active={active} onNav={handleNav} />
          </AnimatedContainer>
          <AnimatedContainer>
            <Header active={active} onNav={handleNav} />
          </AnimatedContainer>
        </>
      )}

      {/* main content — header is fixed, so add top padding; sidebar occupies left space on md+ */}
      <main className={!(location.pathname === '/login' || location.pathname === '/signup') ? "md:ml-[18rem] p-6 pt-28" : "p-0"}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            {/* Protected routes */}
            <Route element={<RequireAuth/>}>
              <Route path="/" element={<Home />} />
              <Route path="/completed" element={<CompletedTasks />} />
              <Route path="/track" element={<TrackOngoing />} />
              <Route path="/assign" element={<AssignTasks />} />
              <Route path="/maintain" element={<MaintainDriver />} />
              <Route path="/location" element={<AllVehiclesMap />} />
            </Route>

            {/* Public routes that should redirect if already authenticated */}
            <Route element={<RedirectIfAuth/>}>
              <Route path="/login" element={<Login />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function App() {
  // initialize auth on app start (hook updates redux auth slice)
  useInitAuth();

  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  );
}