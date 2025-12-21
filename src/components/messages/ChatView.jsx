import React, { useState } from "react";
import { TextInput, Button } from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import "./MessagesUI.css";

export default function ChatView({ chat, onBack }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { from: "them", text: "Hey there 👋" },
    { from: "you", text: "Hey! How’s it going?" },
  ]);

  function handleSend() {
    if (!input.trim()) return;
    setMessages([...messages, { from: "you", text: input }]);
    setInput("");
  }

  return (
    <div className="chat-view">
      <header className="chat-view-header">
        <Button
          variant="subtle"
          onClick={onBack}
          leftSection={<IconArrowLeft size={18} />}
          className="back-btn"
        >
          Back
        </Button>
        <h2>{chat.name}</h2>
      </header>

      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`chat-bubble ${msg.from === "you" ? "sent" : "received"}`}
          >
            {msg.text}
          </div>
        ))}
      </div>

      <div className="chat-input">
        <TextInput
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.currentTarget.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <Button color="success" onClick={handleSend}>
          Send
        </Button>
      </div>
    </div>
  );
}
