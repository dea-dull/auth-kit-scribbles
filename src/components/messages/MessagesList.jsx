import React from "react";
import "./MessagesUI.css";

const MOCK_CHATS = [
  {
    id: 1,
    name: "John Doe",
    lastMsg: "Hey, how are you doing?",
    time: "10:30 AM",
    unread: true,
    fav: false,
    group: false,
    avatar: null,
    tab: "all",
  },
  {
    id: 2,
    name: "Sarah Smith",
    lastMsg: "Let's meet tomorrow",
    time: "09:15 AM",
    unread: false,
    fav: true,
    group: false,
    avatar: null,
    tab: "all",
  },
  {
    id: 3,
    name: "Design Team",
    lastMsg: "New project kickoff",
    time: "Yesterday",
    unread: true,
    fav: false,
    group: true,
    avatar: null,
    tab: "groups",
  },
  {
    id: 4,
    name: "Mike Johnson",
    lastMsg: "Thanks for your help!",
    time: "Yesterday",
    unread: false,
    fav: true,
    group: false,
    avatar: null,
    tab: "all",
  },
  {
    id: 5,
    name: "Development Team",
    lastMsg: "Sprint planning meeting",
    time: "Oct 12",
    unread: false,
    fav: false,
    group: true,
    avatar: null,
    tab: "groups",
  },
];

function filterChats(tab, searchTerm) {
  if (!Array.isArray(MOCK_CHATS) || MOCK_CHATS.length === 0) return [];

  let filtered = [];

  switch (tab) {
    case "all":
      filtered = MOCK_CHATS;
      break;
    case "unread":
      filtered = MOCK_CHATS.filter((chat) => chat.unread);
      break;
    case "fav":
      filtered = MOCK_CHATS.filter((chat) => chat.fav);
      break;
    case "groups":
      filtered = MOCK_CHATS.filter((chat) => chat.group);
      break;
    default:
      filtered = MOCK_CHATS;
  }

  if (searchTerm?.trim()) {
    filtered = filtered.filter((chat) =>
      chat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  return filtered;
}

export default function MessagesList({ tab = "all", searchTerm = "", onSelectChat }) {
  const chats = filterChats(tab, searchTerm);

  if (!Array.isArray(chats) || chats.length === 0) {
    return <div className="empty-state">No conversations to show.</div>;
  }

  return (
    <div className="chat-list">
      {chats.map((chat) => (
        <div
          key={chat.id}
          className={`chat-item ${chat.unread ? "unread" : ""}`}
          onClick={() => onSelectChat?.(chat)}
        >
          <div className="avatar">
            {chat.avatar ? (
              <img src={chat.avatar} alt={chat.name} />
            ) : (
              <div className={`avatar-fallback ${chat.group ? "group" : ""}`}>
                {chat.group ? "👥" : chat.name.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          <div className="chat-info">
            <div className="chat-header">
              <span className="chat-name">{chat.name}</span>
              <span className="chat-time">{chat.time}</span>
            </div>
            <div className="chat-msg">New message</div>
          </div>

          {chat.unread && <span className="unread-dot" />}
          {chat.fav && <span className="fav-star">★</span>}
        </div>
      ))}
    </div>
  );
}
