import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Text,
  Button,
  Group,
  Checkbox,
  Badge,
  ActionIcon,
  Menu,
} from "@mantine/core";
import {
  IconDotsVertical,
  IconFile,
  IconFolder,
  IconDownload,
  IconShare,
  IconInfoCircle,
  IconEdit,
  IconCopy,
  IconTrash,
  IconArrowsMove,
  IconLock,
} from "@tabler/icons-react";
import OTPModal from "../../OTPModal/OTPModal";
import "../DriveRoutes.css";

// Mock private files data
const privateFiles = [
  {
    id: 1,
    title: "Private Plan.pdf",
    type: "pdf",
    status: "Private",
    modified: "2025-10-01",
    size: "2.3 MB",
  },
  {
    id: 2,
    title: "Secret Photos",
    type: "folder",
    status: "Private",
    modified: "2025-09-28",
    size: "--",
  },
  {
    id: 3,
    title: "Resume.docx",
    type: "docx",
    status: "Private",
    modified: "2025-09-20",
    size: "153 KB",
  },
];

function typeIcon(type) {
  return type === "folder" ? (
    <IconFolder className="file-icon-folder" size={20} />
  ) : (
    <IconFile className="file-icon" size={20} />
  );
}

export default function DrivePrivate() {
  const [authenticated, setAuthenticated] = useState(false);
  const [selected, setSelected] = useState([]);
  const [files, setFiles] = useState(privateFiles);
  const [showOtp, setShowOtp] = useState(true);
  const [showAuthError, setShowAuthError] = useState(false);
  const navigate = useNavigate();

  // Selection logic
  const toggleSelect = (id) =>
    setSelected((sel) =>
      sel.includes(id) ? sel.filter((i) => i !== id) : [...sel, id]
    );
  const selectAll = () =>
    setSelected(selected.length === files.length ? [] : files.map((f) => f.id));
  const bulkDelete = () => {
    setFiles((fs) => fs.filter((f) => !selected.includes(f.id)));
    setSelected([]);
  };
  const onDelete = (id) => {
    setFiles((fs) => fs.filter((f) => f.id !== id));
    setSelected((sel) => sel.filter((sid) => sid !== id));
  };

  return (
    <Box className="drive-main-panel" style={{ position: "relative" }}>
      {/* OTP Modal overlay only inside this panel */}
      {!authenticated && showOtp && (
        <OTPModal
          message="Enter the 6-digit code from your authenticator app to unlock your private files. This code refreshes every 30 seconds."
          heading="Authenticate to access Private Files"
          onVerify={(code) => {
            if (code.length === 6) {
              setAuthenticated(true);
              setShowOtp(false);
              setShowAuthError(false);
            }
          }}
          onClose={() => {
            setShowOtp(false);
            setShowAuthError(true);
            setTimeout(() => {
              navigate("/drive/main"); // redirect after 1.5s (or change to any default)
            }, 1500);
          }}
        />
      )}

      {/* Auth error message (shows briefly before redirect) */}
      {showAuthError && (
        <Text color="red" mt="md" ta="center" fw={600} fz={18}>
          Private Files can't be opened due to authentication error.
        </Text>
      )}

      {/* Show table only if authenticated */}
      {authenticated && (
        <>
          {/* Top Bar */}
          <Group mb="sm" justify="apart">
            <Group>
              <Checkbox
                checked={selected.length === files.length && files.length > 0}
                indeterminate={selected.length > 0 && selected.length < files.length}
                onChange={selectAll}
              />
              <Text size="sm">{selected.length} selected</Text>
            </Group>
            <Group>
              <ActionIcon variant="light" color="teal" disabled={selected.length === 0}>
                <IconCopy />
              </ActionIcon>
              <ActionIcon variant="light" color="teal" disabled={selected.length === 0}>
                <IconArrowsMove />
              </ActionIcon>
              <ActionIcon
                variant="light"
                color="red"
                disabled={selected.length === 0}
                onClick={bulkDelete}
              >
                <IconTrash />
              </ActionIcon>
            </Group>
          </Group>

          {/* File Table */}
          <table className="drive-table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th></th>
                <th>Title</th>
                <th>Status</th>
                <th>Last Modified</th>
                <th>Size</th>
                <th>Type</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {files.map((f) => (
                <tr
                  key={f.id}
                  className={selected.includes(f.id) ? "selected-row" : ""}
                >
                  <td>
                    <Checkbox checked={selected.includes(f.id)} onChange={() => toggleSelect(f.id)} />
                  </td>
                  <td>
                    <Group spacing="xs">
                      {typeIcon(f.type)}
                      <Text>{f.title}</Text>
                    </Group>
                  </td>
                  <td>
                    <Badge color="gray" variant="light">{f.status}</Badge>
                  </td>
                  <td>{f.modified}</td>
                  <td>{f.size}</td>
                  <td>{f.type.toUpperCase()}</td>
                  <td>
                    <Menu shadow="md" width={180} position="bottom-end" withinPortal>
                      <Menu.Target>
                        <ActionIcon variant="transparent" className="dots-icon">
                          <IconDotsVertical />
                        </ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown className="drive-context-menu">
                        <Menu.Item icon={<IconEdit size={16} />}>Rename</Menu.Item>
                        <Menu.Item icon={<IconCopy size={16} />}>Copy</Menu.Item>
                        <Menu.Item icon={<IconArrowsMove size={16} />}>Move To</Menu.Item>
                        <Menu.Item icon={<IconDownload size={16} />}>Download</Menu.Item>
                        <Menu.Item icon={<IconShare size={16} />}>Share</Menu.Item>
                        <Menu.Item icon={<IconInfoCircle size={16} />}>Info</Menu.Item>
                        <Menu.Divider />
                        <Menu.Item
                          icon={<IconTrash size={16} />}
                          color="red"
                          onClick={() => onDelete(f.id)}
                        >
                          Delete
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </Box>
  );
}