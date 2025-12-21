import { useState } from "react";
import { Table, Box, Badge, ActionIcon, Group, Text, Menu, Button } from "@mantine/core";
import {
  IconFile,
  IconFolder,
  IconRestore,
  IconTrash,
  IconDotsVertical,
  IconInfoCircle,
} from "@tabler/icons-react";
import "../DriveRoutes.css";

// Example trashed files data
const trashedFiles = [
  {
    id: 1,
    title: "Old Invoice.pdf",
    type: "pdf",
    deletedAt: "2025-09-23",
    size: "450 KB",
    originalLocation: "Home",
  },
  {
    id: 2,
    title: "Unused Designs",
    type: "folder",
    deletedAt: "2025-09-21",
    size: "--",
    originalLocation: "Designs",
  },
  {
    id: 3,
    title: "Draft.txt",
    type: "txt",
    deletedAt: "2025-09-15",
    size: "8 KB",
    originalLocation: "Documents",
  },
  // ...more trashed files
];

export default function DriveTrash() {
  const [selected, setSelected] = useState([]);

  return (
    <Box className="drive-main-panel">
      <Group mb="md" align="center">
        <IconTrash color="#ff7676" size={28} />
        <Text fw={700} fz={24} style={{ color: "#ff7676" }}>
          Trash
        </Text>
      </Group>
      <Table highlightOnHover verticalSpacing="sm" className="drive-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Original Location</th>
            <th>Deleted At</th>
            <th>Size</th>
            <th>Type</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {trashedFiles.map((f) => (
            <tr key={f.id}>
              <td>
                <Group spacing="xs">
                  {f.type === "folder" ? (
                    <IconFolder className="file-icon-folder" size={20} />
                  ) : (
                    <IconFile className="file-icon" size={20} />
                  )}
                  <Text>{f.title}</Text>
                </Group>
              </td>
              <td>
                <Badge color="gray" variant="light">
                  {f.originalLocation}
                </Badge>
              </td>
              <td>{f.deletedAt}</td>
              <td>{f.size}</td>
              <td>{f.type.toUpperCase()}</td>
              <td>
                {/* Context menu: Restore/Delete forever/Info */}
                <Menu shadow="md" width={170} position="bottom-end" withinPortal>
                  <Menu.Target>
                    <ActionIcon variant="light" color="red" className="dots-icon">
                      <IconDotsVertical size={18} />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown className="drive-context-menu">
                    <Menu.Item icon={<IconRestore size={16} color="#8ef58a" />}>
                      Restore
                    </Menu.Item>
                    <Menu.Item icon={<IconTrash size={16} color="#ff7676" />} color="red">
                      Delete Forever
                    </Menu.Item>
                    <Menu.Item icon={<IconInfoCircle size={16} />}>Info</Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      {/* Optional: Empty trash button */}
      <Box mt={24} style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button color="red" variant="outline" leftSection={<IconTrash size={16} />} radius="md">
          Empty Trash
        </Button>
      </Box>
    </Box>
  );
}