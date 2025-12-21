import React, { useState } from "react";
import { Tabs, Tab } from "@heroui/react";
import { TextInput, Group } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import { PlusIcon } from "@heroicons/react/24/outline";
import MessagesList from "./MessagesList";
import ChatView from "./ChatView";
import NewMessageModal from "./NewMessageModal";
import GlassButton from "../ui/Button";
import "./MessagesUI.css";
import {
  EnvelopeIcon,
  EnvelopeOpenIcon,
  StarIcon,
  UserGroupIcon,
  ArchiveBoxIcon,
} from "@heroicons/react/24/outline";

export default function MessagesLayout() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedChat, setSelectedChat] = useState(null);
  const [showNewChat, setShowNewChat] = useState(false);

  const tabs = [
    { key: "all", label: "All" },
    { key: "unread", label: "Unread" },
    { key: "fav", label: "Fav" },
    { key: "groups", label: "Groups" },
    { key: "archived", label: "Archived" },
  ];

  return (
    <div className="messages-layout">
      <header className="topbar">
        <h1 className="title">Messages</h1>
        <Group className="filter-group">
          <TextInput
            className="search-input"
            placeholder="Search..."
            leftSection={<IconSearch size={16} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.currentTarget.value)}
          />
        </Group>
      </header>

      <div className="messages-content">
        {/* Left side: List */}
        <div className="chat-list-pane">
            <Tabs
                selectedKey={activeTab}
                onSelectionChange={setActiveTab}
                variant="underlined"
                color="success"
                size="lg"
                radius="full"
                className="icon-tabs"
                >
                <Tab key="all" title={<EnvelopeIcon width={22} height={22} />} />
                <Tab key="unread" title={<EnvelopeOpenIcon width={22} height={22} />} />
                <Tab key="fav" title={<StarIcon width={22} height={22} />} />
                <Tab key="groups" title={<UserGroupIcon width={22} height={22} />} />
                <Tab key="archived" title={<ArchiveBoxIcon width={22} height={22} />} />
            </Tabs>

          <MessagesList
            tab={activeTab}
            searchTerm={searchTerm}
            onSelectChat={setSelectedChat}
          />
        </div>

        {/* Right side: Chat view */}
        <div className="chat-view-pane">
          {selectedChat ? (
            <ChatView chat={selectedChat} onBack={() => setSelectedChat(null)} />
          ) : (
            <div className="chat-placeholder">
              <p>Select a conversation to start chatting 💬</p>
            </div>
          )}
        </div>
      </div>

      <div className="fab">
        <GlassButton className="fab-btn" onClick={() => setShowNewChat(true)}>
          <PlusIcon width={28} height={28} />
        </GlassButton>
      </div>

      {showNewChat && (
        <NewMessageModal
          open={showNewChat}
          onClose={() => setShowNewChat(false)}
          onCreate={(chat) => setSelectedChat(chat)}
        />
      )}
    </div>
  );
}
