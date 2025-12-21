import React, { useState } from "react";
import { Modal, Input, Button } from "@heroui/react";
import "./MessagesUI.css";

export default function NewMessageModal({ open, onClose }) {
  const [recipient, setRecipient] = useState("");
  const [msg, setMsg] = useState("");

  function handleSend() {
    // send logic here
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="modal"
      backdrop="blur"
      placement="center"
    >
      <Modal.Title className="modal-title">New Message</Modal.Title>
      <div className="modal-content">
        <Input
          label="Recipient"
          placeholder="Enter name, email, or group"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          fullWidth
          className="modal-input"
        />
        <Input
          label="Message"
          placeholder="Type your message..."
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          fullWidth
          className="modal-input"
        />
      </div>
      <div className="modal-actions">
        <Button
          color="success"
          onClick={handleSend}
          disabled={!recipient || !msg}
          className="send-btn"
        >
          Send
        </Button>
        <Button variant="light" color="default" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Modal>
  );
}
