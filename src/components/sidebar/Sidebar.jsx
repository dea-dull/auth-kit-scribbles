import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Tooltip } from "@heroui/tooltip";
import { User, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";
import {
  FolderIcon,
  DocumentTextIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  ClockIcon,
  ArrowRightOnRectangleIcon,
  BellIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

import "./Sidebar.css";

const menuLinks = [
  { key: "notes", label: "Notes", icon: DocumentTextIcon, to: "/notes" },
  { key: "drive", label: "Drive", icon: FolderIcon, to: "/drive" },
  { key: "contacts", label: "Contacts", icon: UserIcon, to: "/contacts" },
  { key: "messages", label: "Messages", icon: ChatBubbleLeftRightIcon, to: "/messages" },
  { key: "logs", label: "Logs", icon: ClockIcon, to: "/logs" },
  { key: "time-bombs", label: "Time-bombs", icon: () => <i className="bi bi-hourglass-split" />, to: "/time-bombs" },
];

const MenuItem = ({ icon: Icon, text, isOpen, to }) => {
  return isOpen ? (
    <NavLink
      to={to}
        className={({ isActive }) => (isActive ? "active" : "menu-item")}

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

              ":hover": {
              background: isActive ? "rgba(142,245,138,0.2)" : "rgba(255,255,255,0.1)",
              color: isActive ? "#8ef58a" : "#ffffff",
              transform: "translateY(-1px)"
              }
              
            })}
 // Use NavLink's active class
    >
      <Icon className="icon" />
      {isOpen && <span>{text}</span>}
    </NavLink>
  ) : (
    <Tooltip content={text} className="icons-tooltip" placement="right">
      <NavLink
        to={to}
        className={({ isActive }) => (isActive ? "active" : "menu-item")}
      >
        <Icon className="icon" />
      </NavLink>
    </Tooltip>
  );
};

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  // Handle click for MenuItems
  const handleMenuItemClick = (to) => {
    if (!isOpen) {
      setIsOpen(true); // Expand the sidebar
      return; // Do not navigate yet, allow user to click again
    }
    navigate(to); // Now navigate after sidebar is open
  };

  // User profile click handler (collapsed): expand sidebar
  const handleUserProfileClick = () => {
    if (!isOpen) setIsOpen(true);
  };

  // Dropdown actions for user menu
  const handleUserAction = (actionKey) => {
    switch (actionKey) {
      case "notifications":
        navigate("/notifications");
        break;
      case "privacy":
        navigate("/privacy");
        break;
      case "logout":
        // Perform logout logic here
        break;
      default:
        break;
    }
  };

  return (
    <div className={`sidebar ${isOpen ? "open" : "closed"}`}>
      {/* Toggle Button */}
      <div className="toggle-container">
        <button className="toggle-btn" onClick={() => setIsOpen((prev) => !prev)}>
          <i className={`bi ${isOpen ? "bi-layout-sidebar-inset" : "bi-layout-sidebar-reverse"}`}></i>
        </button>
      </div>

      {/* App Logo */}
      <div className="sidebar-logo">
        <i className="bi bi-file-zip logo-icon"></i>
        {isOpen && <span className="logo-text">Storage</span>}
      </div>

      {/* Navigation */}
      <ul className="sidebar-items">
        {menuLinks.map(({ key, label, icon, to }) => (
          <li key={key}>
            <MenuItem
              icon={icon}
              text={label}
              isOpen={isOpen}
              to={to}
              onClick={() => handleMenuItemClick(to)} // Handle click here
            />
          </li>
        ))}
      </ul>

      {/* Settings */}
      <div className="sidebar-settings">
        <MenuItem
          icon={Cog6ToothIcon}
          text="Settings"
          isOpen={isOpen}
          to="/settings"
          onClick={() => handleMenuItemClick("/settings")}
        />
      </div>

      {/* User profile with dropdown */}
      <div className="sidebar-footer">
        {isOpen ? (
          <Dropdown placement="top-end" className="user-dropdown">
            <DropdownTrigger>
              <div className="sidebar-user-clickable">
                <User
                  description="israelai260@gmail.com"
                  avatarProps={{
                    src: "https://i.pravatar.cc/150?u=a04258114e29026702d",
                    size: "sm",
                    radius: "full",
                  }}
                  classNames={{
                    base: "sidebar-user-base",
                    wrapper: "sidebar-user-wrapper",
                    name: "sidebar-user-name",
                    description: "sidebar-user-description",
                  }}
                />
              </div>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="User menu"
              variant="shadow"
              className="user-dropdown-menu"
              onAction={handleUserAction}
            >
              <DropdownItem
                key="notifications"
                startContent={<BellIcon className="dropdown-icon" />}
                className="dropdown-item"
              >
                Notifications
              </DropdownItem>
              <DropdownItem
                key="privacy"
                startContent={<ShieldCheckIcon className="dropdown-icon" />}
                className="dropdown-item"
              >
                Privacy & Security
              </DropdownItem>
              <DropdownItem
                key="logout"
                startContent={<ArrowRightOnRectangleIcon className="dropdown-icon" />}
                className="dropdown-item text-danger"
                color="danger"
              >
                Logout
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        ) : (
          <Tooltip
            content={
              <div className="user-tooltip-content">
                <div>Profile</div>
              </div>
            }
            placement="right"
          >
            <div className="collapsed-user-container" onClick={handleUserProfileClick}>
              <img
                src="https://i.pravatar.cc/150?u=a04258114e29026702d"
                alt="User avatar"
                className="collapsed-avatar"
              />
            </div>
          </Tooltip>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
