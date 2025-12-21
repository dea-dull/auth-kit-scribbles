import { useState } from "react";
import { Table, Box, Badge, ActionIcon, Group, Text, Menu } from "@mantine/core";
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
  IconTag,
} from "@tabler/icons-react";
import "../DriveRoutes.css";

// Example tagged files data
const taggedFiles = [
  {
    id: 1,
    title: "Project Plan.pdf",
    type: "pdf",
    status: "Private",
    modified: "2025-10-01",
    size: "2.3 MB",
    tags: ["work", "important"],
  },
  {
    id: 2,
    title: "Designs",
    type: "folder",
    status: "Shared",
    modified: "2025-09-29",
    size: "--",
    tags: ["design", "ui"],
  },
  {
    id: 3,
    title: "Resume.docx",
    type: "docx",
    status: "Private",
    modified: "2025-09-15",
    size: "123 KB",
    tags: ["personal", "cv"],
  },
  // ...more tagged files
];

export default function DriveTagged() {
  // Optionally support row selection for bulk actions
  const [selected, setSelected] = useState([]);

  return (
    <Box className="drive-main-panel">
      <Group mb="md" align="center">
        <IconTag color="#8ef58a" size={28} />
        <Text fw={700} fz={24} style={{ color: "#8ef58a" }}>
          Tagged Files
        </Text>
      </Group>
      <Table highlightOnHover verticalSpacing="sm" className="drive-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Status</th>
            <th>Tags</th>
            <th>Last Modified</th>
            <th>Size</th>
            <th>Type</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {taggedFiles.map((f) => (
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
                <Badge color={f.status === "Private" ? "gray" : "teal"}>{f.status}</Badge>
              </td>
              <td>
                {f.tags.map((tag) => (
                  <Badge key={tag} color="teal" variant="light" mr={4}>
                    #{tag}
                  </Badge>
                ))}
              </td>
              <td>{f.modified}</td>
              <td>{f.size}</td>
              <td>{f.type.toUpperCase()}</td>
              <td>
                <Menu shadow="md" width={180} position="bottom-end" withinPortal>
                  <Menu.Target>
                    <ActionIcon variant="light" color="teal" className="dots-icon">
                      <IconDotsVertical size={18} />
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
                    <Menu.Item icon={<IconTrash size={16} />} color="red">
                      Delete
                    </Menu.Item>
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