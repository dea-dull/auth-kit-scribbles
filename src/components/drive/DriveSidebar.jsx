import {
  IconHome, IconClock, IconLock, IconUsers, IconTag, IconTrash, IconSettings,
} from "@tabler/icons-react";
import { NavLink } from "react-router-dom";
import { Box, Stack } from "@mantine/core";
import "./drive.css";

const driveNav = [
  { label: "Home", icon: IconHome, to: "/drive/home" },
  { label: "Main Cloud", icon: IconClock, to: "/drive/main" },
  { label: "Private Cloud", icon: IconLock, to: "/drive/private" },
  { label: "Shared", icon: IconUsers, to: "/drive/shared" },
  { label: "Tagged", icon: IconTag, to: "/drive/tagged" },
  { label: "Trash", icon: IconTrash, to: "/drive/trash" },
];

export default function DriveSidebar() {
  return (
    <Box
      className="drive-sidebar"
      style={{
        background: "linear-gradient(90deg, #000000 0%, #001100 100%)",
        color: "rgba(255,255,255,0.87)",
        minWidth: 180,
        padding: 14,
        height: "100vh",
      }}
    >
      <Stack gap="md">
        {driveNav.map(({ label, icon: Icon, to }) => (
          <NavLink
            key={label}
            to={to}
            className="drive-nav-link"
            style={({ isActive }) => ({
              display: "flex",
              alignItems: "center",
              gap: 10,
              color: isActive ? "#8ef58a" : "rgba(255,255,255,0.87)",
              fontWeight: isActive ? 700 : 500,
              textDecoration: "none",
              fontSize: 16,
              borderRadius: 6,
              background: isActive ? "rgba(142,245,138,0.13)" : "none",
              padding: "7px 12px",
              transition: "background 0.2s",
            })}
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </Stack>
    </Box>
  );
}