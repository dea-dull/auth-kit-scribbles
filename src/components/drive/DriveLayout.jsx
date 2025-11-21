import { Outlet, Navigate, useLocation } from "react-router-dom";
import DriveSidebar from "./DriveSidebar";
import "./drive.css";

export default function DriveLayout() {
  // If at /drive, redirect to /drive/main
  const location = useLocation();
  if (location.pathname === "/drive" || location.pathname === "/drive/") {
    return <Navigate to="/drive/main" replace />;
  }

  return (
    <div className="layout">
      <DriveSidebar />
      <div className="content content-expanded" style={{ background: "none" }}>
        <Outlet />
      </div>
    </div>
  );
}