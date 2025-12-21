import React from "react";
import { ActionIcon, Menu } from "@mantine/core";
import { IconDotsVertical, IconMessage, IconTrash, IconUserPlus } from "@tabler/icons-react";

const MOCK_CONTACTS = [
  { id: 1, name: "Jane Doe", email: "jane@example.com", avatar: null, online: true },
  { id: 2, name: "John Smith", email: "john@example.com", avatar: null, online: false },
  { id: 3, name: "Design Team", email: "design@example.com", avatar: null, online: true },
];

export default function ContactsList({ searchTerm = "" }) {
  const filteredContacts = MOCK_CONTACTS.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (filteredContacts.length === 0) {
    return <div className="empty-state">No contacts found.</div>;
  }

  return (
    <div className="contacts-list">
      {filteredContacts.map((contact) => (
        <div key={contact.id} className="contact-item">
          <div className="avatar">
            {contact.avatar ? (
              <img src={contact.avatar} alt={contact.name} />
            ) : (
              <div className="avatar-fallback">{contact.name.slice(0, 2).toUpperCase()}</div>
            )}
          </div>
          <div className="contact-info">
            <span className="contact-name">{contact.name}</span>
            <span className={`status ${contact.online ? "online" : "offline"}`}>
              {contact.online ? "Online" : "Offline"}
            </span>
          </div>
          <Menu shadow="md" width={200}>
            <Menu.Target>
              <ActionIcon variant="subtle" className="custom-action-icon">
                <IconDotsVertical size={18} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item icon={<IconMessage size={16} />}>Message</Menu.Item>
              <Menu.Item icon={<IconUserPlus size={16} />}>Add to Favorites</Menu.Item>
              <Menu.Item icon={<IconTrash size={16} />} color="red">
                Delete
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </div>
      ))}
    </div>
  );
}
