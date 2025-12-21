import { useState } from "react";
import { Table, Box, Badge, ActionIcon, Group, Checkbox, Tooltip, Text, Button, Menu } from "@mantine/core";
import {
  IconDotsVertical, IconFile, IconFolder, IconDownload, IconShare, IconInfoCircle,
  IconEdit, IconCopy, IconTrash, IconArrowsMove,
} from "@tabler/icons-react";
import "../DriveRoutes.css";

// Mock data: only shared files/folders
const sharedFiles = [
  {
    id: 11, title: "Sprint Reports.pdf", type: "pdf", status: "Shared",
    modified: "2025-09-29", size: "1.3 MB",
  },
  {
    id: 12, title: "Marketing", type: "folder", status: "Shared",
    modified: "2025-09-28", size: "--",
  },
  {
    id: 13, title: "Design Assets.zip", type: "zip", status: "Shared",
    modified: "2025-09-22", size: "4.0 MB",
  },
];

const typeIcon = (type) =>
  type === "folder" ? <IconFolder className="file-icon-folder" size={18} /> : <IconFile className="file-icon" size={18} />;

export default function DriveShared() {
  const [selected, setSelected] = useState([]);
  const [files, setFiles] = useState(sharedFiles);

  const toggleSelect = (id) => {
    setSelected((sel) =>
      sel.includes(id) ? sel.filter((i) => i !== id) : [...sel, id]
    );
  };
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
    <Box className="drive-main-panel">
      <Group mb="sm" position="apart" className="drive-main-topbar">
        <Group>
          <Checkbox
            checked={selected.length === files.length && files.length > 0}
            indeterminate={selected.length > 0 && selected.length < files.length}
            onChange={selectAll}
          />
          <Text size="sm">{selected.length} selected</Text>
        </Group>
        <Group>
          <Tooltip label="Copy">
            <ActionIcon variant="light" color="teal" disabled={selected.length === 0}>
              <IconCopy />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Move">
            <ActionIcon variant="light" color="teal" disabled={selected.length === 0}>
              <IconArrowsMove />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Delete">
            <ActionIcon variant="light" color="red" disabled={selected.length === 0} onClick={bulkDelete}>
              <IconTrash />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>
      <Table highlightOnHover verticalSpacing="sm" striped className="drive-table">
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
            <tr key={f.id} className={selected.includes(f.id) ? "selected-row" : ""}>
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
                <Badge color="teal" variant="light">{f.status}</Badge>
              </td>
              <td>{f.modified}</td>
              <td>{f.size}</td>
              <td><Text>{f.type.toUpperCase()}</Text></td>
              <td>
                <Menu shadow="md" width={180} position="bottom-end" withArrow>
                  <Menu.Target>
                    <ActionIcon variant="transparent" className="context-menu-icon">
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
                    <Menu.Item icon={<IconTrash size={16} />} color="red" onClick={() => onDelete(f.id)}>Delete</Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Box>
  );
}