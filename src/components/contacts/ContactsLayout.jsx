import React, { useState } from "react";
import { TextInput, ActionIcon, Menu } from "@mantine/core";
import { IconSearch, IconDotsVertical, IconTrash, IconEdit } from "@tabler/icons-react";
import ContactsList from "./ContactsList";
import "./ContactsUI.css";

export default function ContactsLayout() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="contacts-layout">
      {/* Topbar */}
      <header className="contacts-topbar">
        <h1 className="title">Contacts</h1>
        <div className="topbar-actions">
          <TextInput
            className="search-input"
            placeholder="Search contacts..."
            leftSection={<IconSearch size={16} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.currentTarget.value)}
          />
          {/* Profile dropdown example */}
          <Menu shadow="md" width={200}>
            <Menu.Target>
              <ActionIcon variant="subtle" className="custom-action-icon">
                <IconDotsVertical size={18} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item icon={<IconEdit size={16} />}>Edit Profile</Menu.Item>
              <Menu.Item icon={<IconTrash size={16} />} color="red">
                Delete Profile
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </div>
      </header>

      {/* Contact List */}
      <ContactsList searchTerm={searchTerm} />
    </div>
  );
}
