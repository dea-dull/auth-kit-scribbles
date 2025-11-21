// // src/routes/DriveHome.jsx
// import { useState } from "react";
// import {
//   Box,
//   Group,
//   Text,
//   Card,
//   SimpleGrid,
//   Progress,
//   Table,
//   ActionIcon,
//   Menu,
//   TextInput,
//   Button,
// } from "@mantine/core";
// import {
//   IconFile,
//   IconFolder,
//   IconShare,
//   IconDotsVertical,
//   IconDownload,
//   IconTrash,
//   IconEdit,
//   IconFolder as IconFolderSmall,
// } from "@tabler/icons-react";
// import "../DriveRoutes.css";

// // Your components (paths assumed based on your examples)
// // adjust import paths if yours are located elsewhere
// import { default as CardModal } from "../../ui/Card.jsx";
// import SingleInputModal from "../../ui/SingleInputModal.jsx";
// import { default as GlassButton} from "../../ui/Button.jsx";
// import WhiteButton from "../../ui/WhiteButton.jsx";

// const stats = [
//   { label: "Total Files", value: 42, icon: IconFile },
//   { label: "Folders", value: 7, icon: IconFolder },
//   { label: "Shared Files", value: 19, icon: IconShare },
// ];

// const initialFiles = [
//   { id: 1, name: "Resume.docx", type: "docx", modified: "2025-10-05" },
//   { id: 2, name: "Project Plan.pdf", type: "pdf", modified: "2025-10-04" },
//   { id: 3, name: "Team Notes.txt", type: "txt", modified: "2025-10-03" },
//   { id: 4, name: "Photos", type: "folder", modified: "2025-10-02" },
// ];

// export default function DriveHome() {
//   const [recentFiles, setRecentFiles] = useState(initialFiles);

//   // selection/modals
//   const [selectedFile, setSelectedFile] = useState(null);
//   const [deleteOpen, setDeleteOpen] = useState(false);
//   const [renameOpen, setRenameOpen] = useState(false);

//   // open delete confirmation
//   const handleDeleteClick = (file) => {
//     setSelectedFile(file);
//     setDeleteOpen(true);
//   };

//   // confirm delete action
//   const confirmDelete = () => {
//     if (!selectedFile) return;
//     setRecentFiles((prev) => prev.filter((f) => f.id !== selectedFile.id));
//     setSelectedFile(null);
//     setDeleteOpen(false);
//   };

//   // open rename modal
//   const handleRenameClick = (file) => {
//     setSelectedFile(file);
//     setRenameOpen(true);
//   };

//   // confirm rename from SingleInputModal, value comes from modal
//   const confirmRename = (value) => {
//     if (!selectedFile) return;
//     const newName = value?.trim();
//     if (!newName) {
//       // keep original if empty — you can change this behaviour if you want
//       setRenameOpen(false);
//       setSelectedFile(null);
//       return;
//     }
//     setRecentFiles((prev) =>
//       prev.map((f) => (f.id === selectedFile.id ? { ...f, name: newName } : f))
//     );
//     setSelectedFile(null);
//     setRenameOpen(false);
//   };

//   return (
//     <Box className="drive-home-container">
//       <Card shadow="md" p="lg" radius="md" className="drive-home-banner">
//         <Text size="xl" fw={700} mb={6} className="drive-home-heading">
//           Welcome to your Drive
//         </Text>
//         <Text size="sm" color="dimmed">
//           Securely store, organize, and share your files. Use the sidebar to
//           browse your Drive.
//         </Text>
//       </Card>

//       <SimpleGrid
//         cols={{ base: 1, sm: 3 }}
//         spacing="md"
//         mt="xl"
//         className="drive-home-stats"
//       >
//         {stats.map(({ label, value, icon: Icon }) => (
//           <Card key={label} p="md" radius="md" className="drive-home-stat-card">
//             <Group align="center" gap="md">
//               <Icon size={34} className="drive-home-stat-icon" />
//               <Box>
//                 <Text size="xl" fw={600}>
//                   {value}
//                 </Text>
//                 <Text size="sm" color="dimmed">
//                   {label}
//                 </Text>
//               </Box>
//             </Group>
//           </Card>
//         ))}
//       </SimpleGrid>

//       <Box mt="xl" className="drive-home-storage-progress">
//         <Text size="sm" mb={4}>
//           Storage Usage
//         </Text>
//         <Progress value={14} color="teal" size="lg" radius="xl" />
//         <Text size="xs" mt={2} color="dimmed">
//           2.1 GB used of 15 GB ({((2.1 / 15) * 100).toFixed(1)}%)
//         </Text>
//       </Box>

//       {/* Recent Files Section */}
//       {/* NOTE: modal overlays are rendered inside this Box so they cover only this section */}
//       <Box
//         mt="xl"
//         className="drive-home-recent-section"
//         style={{ position: "relative" }} // ensures Card overlay positions relative to this box
//       >
//         <Text fw={600} size="lg" mb={10} className="drive-recent-heading">
//           Recent Files
//         </Text>

//         <Table highlightOnHover className="drive-home-recent-table">
//           <thead>
//             <tr>
//               <th>Name</th>
//               <th>Last Modified</th>
//               <th></th>
//             </tr>
//           </thead>
//           <tbody>
//             {recentFiles.map((file) => (
//               <tr key={file.id}>
//                 <td>
//                   <Group>
//                     {file.type === "folder" ? (
//                       <IconFolderSmall size={17} color="#8ef58a" />
//                     ) : (
//                       <IconFile size={17} />
//                     )}
//                     <Text>{file.name}</Text>
//                   </Group>
//                 </td>
//                 <td>{file.modified}</td>
//                 <td>
//                   <Menu withArrow shadow="md">
//                     <Menu.Target>
//                       <ActionIcon variant="subtle" className="custom-action-icon">
//                         <IconDotsVertical size={18} />
//                       </ActionIcon>
//                     </Menu.Target>

//                     <Menu.Dropdown>
//                       <Menu.Item icon={<IconDownload size={16} />}>
//                         Download
//                       </Menu.Item>

//                       <Menu.Item
//                         icon={<IconEdit size={16} />}
//                         onClick={() => handleRenameClick(file)}
//                       >
//                         Rename
//                       </Menu.Item>

//                       <Menu.Item
//                         icon={<IconTrash size={16} />}
//                         color="red"
//                         onClick={() => handleDeleteClick(file)}
//                       >
//                         Delete
//                       </Menu.Item>
//                     </Menu.Dropdown>
//                   </Menu>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </Table>

//         {/* ---------- Delete Logic  ---------- */}
       
//         {/* ---------- Rename Logic ---------- */}
       
//       </Box>
//     </Box>
//   );
// }



































import { useEffect, useState } from "react";
import {
  Box,
  Group,
  Text,
  Card,
  SimpleGrid,
  Progress,
  Table,
  ActionIcon,
  Menu,
  Button,
  Modal,
} from "@mantine/core";
import {
  IconFile,
  IconFolder,
  IconShare,
  IconDotsVertical,
  IconDownload,
  IconTrash,
  IconEdit,
  IconFolder as IconFolderSmall,
} from "@tabler/icons-react";
import "../DriveRoutes.css";

import { useFileOperations } from "../hooks/useFileOperations";
import { useStorage } from "../hooks/useStorage";
import { useFileUpload } from "../hooks/useFileUpload";

import SingleInputModal from "../../ui/SingleInputModal.jsx";

/**
 * DriveHome (simplified)
 *
 * Purpose: show file stats and storage usage, list up to 4 recent files,
 * allow download (open in new tab), rename, and soft-delete (with confirmations).
 *
 * Notes:
 * - recentFilesState.data is expected to be an array of file metadata items.
 * - downloadFile(fileId) may return a presigned URL (string) or a Blob. We handle both.
 * - After rename/delete we refresh the recent files list.
 */

export default function DriveHome() {
  const {
    recentFilesState,
    fetchRecentFiles,
    deleteFile,
    renameFile,
    downloadFile,
  } = useFileOperations();

  const { stats, fetchStorageStats, loading: statsLoading } = useStorage();
  const { isUploading, uploadFile } = useFileUpload();

  const [selectedFile, setSelectedFile] = useState(null);
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        await Promise.all([fetchRecentFiles(), fetchStorageStats()]);
      } catch (err) {
        setErrorMessage(err?.message || "Failed to load drive data");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Download behavior: open presigned URL in new tab, or open Blob in new tab if returned.
  const handleDownload = async (file) => {
    try {
      const result = await downloadFile(file.id);

      // If backend returned a URL
      if (typeof result === "string" && result.startsWith("http")) {
        window.open(result, "_blank", "noopener,noreferrer");
        return;
      }

      // If backend returned a Blob (or httpClient returned a blob)
      if (result instanceof Blob) {
        const url = window.URL.createObjectURL(result);
        window.open(url, "_blank", "noopener,noreferrer");
        // revoke after some time
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
        return;
      }

      // Some services trigger the download client-side already; nothing to do.
      // Fallback: show a friendly message
      setErrorMessage("Unable to open file in new tab. The download was handled differently by the service.");
    } catch (err) {
      console.error("Download error", err);
      setErrorMessage(err?.message || "Download failed");
    }
  };

  const handleDeleteClick = (file) => {
    setSelectedFile(file);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedFile) return;
    try {
      const ok = await deleteFile(selectedFile.id);
      if (!ok) throw new Error("Delete failed");
      await fetchRecentFiles();
    } catch (err) {
      console.error("Delete error", err);
      setErrorMessage(err?.message || "Delete failed");
    } finally {
      setSelectedFile(null);
      setDeleteOpen(false);
    }
  };

  const handleRenameClick = (file) => {
    setSelectedFile(file);
    setRenameOpen(true);
  };

  const confirmRename = async (newName) => {
    if (!selectedFile) return;
    const trimmed = newName?.trim();
    if (!trimmed) {
      setRenameOpen(false);
      setSelectedFile(null);
      return;
    }
    try {
      const ok = await renameFile(selectedFile.id, trimmed);
      if (!ok) throw new Error("Rename failed");
      await fetchRecentFiles();
    } catch (err) {
      console.error("Rename error", err);
      setErrorMessage(err?.message || "Rename failed");
    } finally {
      setRenameOpen(false);
      setSelectedFile(null);
    }
  };

  // Limit recent files to 4
  const recentFiles = (recentFilesState.data || []).slice(0, 4);

  // Loading / error states
  if (recentFilesState.loading) {
    return (
      <Box className="drive-home-container">
        <Text>Loading recent files…</Text>
      </Box>
    );
  }

  if (errorMessage) {
    return (
      <Box className="drive-home-container">
        <Card withBorder shadow="sm" p="md" mb="md">
          <Text color="red">{errorMessage}</Text>
          <Group position="right" mt="sm">
            <Button
              size="xs"
              onClick={() => {
                setErrorMessage(null);
                fetchRecentFiles();
              }}
            >
              Retry
            </Button>
          </Group>
        </Card>
      </Box>
    );
  }

  return (
    <Box className="drive-home-container">
      <Card shadow="md" p="lg" radius="md" className="drive-home-banner">
        <Text size="xl" fw={700} mb={6} className="drive-home-heading">
          Welcome to your Drive
        </Text>
        <Text size="sm" color="dimmed">
          View your file stats and recent activity below.
        </Text>
      </Card>

      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" mt="xl" className="drive-home-stats">
        <Card key="total-files" p="md" radius="md" className="drive-home-stat-card">
          <Group align="center" gap="md">
            <IconFile size={34} className="drive-home-stat-icon" />
            <Box>
              <Text size="xl" fw={600}>
                {stats?.totalFiles ?? "—"}
              </Text>
              <Text size="sm" color="dimmed">
                Total Files
              </Text>
            </Box>
          </Group>
        </Card>

        <Card key="folders" p="md" radius="md" className="drive-home-stat-card">
          <Group align="center" gap="md">
            <IconFolder size={34} className="drive-home-stat-icon" />
            <Box>
              <Text size="xl" fw={600}>
                {stats?.folders ?? "—"}
              </Text>
              <Text size="sm" color="dimmed">
                Folders
              </Text>
            </Box>
          </Group>
        </Card>

        <Card key="shared" p="md" radius="md" className="drive-home-stat-card">
          <Group align="center" gap="md">
            <IconShare size={34} className="drive-home-stat-icon" />
            <Box>
              <Text size="xl" fw={600}>
                {stats?.sharedFiles ?? "—"}
              </Text>
              <Text size="sm" color="dimmed">
                Shared Files
              </Text>
            </Box>
          </Group>
        </Card>
      </SimpleGrid>

      <Box mt="xl" className="drive-home-storage-progress">
        <Text size="sm" mb={4}>
          Storage Usage
        </Text>
        <Progress
          value={Math.round((stats?.usedGb / (stats?.totalGb || 1)) * 100) || 0}
          color="teal"
          size="lg"
          radius="xl"
        />
        <Text size="xs" mt={2} color="dimmed">
          {stats ? `${stats.usedGb} GB used of ${stats.totalGb} GB (${((stats.usedGb / stats.totalGb) * 100).toFixed(1)}%)` : "—"}
        </Text>
      </Box>

      <Box mt="xl" className="drive-home-recent-section" style={{ position: "relative" }}>
        <Group position="apart" mb="sm">
          <Text fw={600} size="lg" className="drive-recent-heading">
            Recent Files
          </Text>
          <Button onClick={() => uploadFile()} loading={isUploading}>
            Upload
          </Button>
        </Group>

        <Table highlightOnHover className="drive-home-recent-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Last Modified</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {recentFiles.length === 0 && (
              <tr>
                <td colSpan={3}>
                  <Text color="dimmed">No recent files</Text>
                </td>
              </tr>
            )}

            {recentFiles.map((file) => (
              <tr key={file.id}>
                <td>
                  <Group>
                    {file.type === "folder" ? (
                      <IconFolderSmall size={17} color="#8ef58a" />
                    ) : (
                      <IconFile size={17} />
                    )}
                    <Text>{file.name}</Text>
                  </Group>
                </td>

                <td>{file.modifiedAt ? new Date(file.modifiedAt).toLocaleString() : file.modified ?? "—"}</td>

                <td>
                  <Menu withArrow shadow="md">
                    <Menu.Target>
                      <ActionIcon variant="subtle" className="custom-action-icon">
                        <IconDotsVertical size={18} />
                      </ActionIcon>
                    </Menu.Target>

                    <Menu.Dropdown>
                      <Menu.Item icon={<IconDownload size={16} />} onClick={() => handleDownload(file)}>
                        Download (open)
                      </Menu.Item>

                      <Menu.Item icon={<IconEdit size={16} />} onClick={() => handleRenameClick(file)}>
                        Rename
                      </Menu.Item>

                      <Menu.Item icon={<IconTrash size={16} />} color="red" onClick={() => handleDeleteClick(file)}>
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

      {/* Rename modal */}
      <SingleInputModal
        opened={renameOpen}
        initialValue={selectedFile?.name}
        title={`Rename ${selectedFile?.name ?? ""}`}
        onClose={() => {
          setRenameOpen(false);
          setSelectedFile(null);
        }}
        onConfirm={(value) => confirmRename(value)}
      />

      {/* Delete confirmation */}
      <Modal opened={deleteOpen} onClose={() => setDeleteOpen(false)} title={`Delete ${selectedFile?.name ?? ""}`}>
        <Text>Are you sure you want to move this file to Trash? It will be kept for 7 days.</Text>
        <Group position="right" mt="md">
          <Button variant="default" onClick={() => setDeleteOpen(false)}>
            Cancel
          </Button>
          <Button color="red" onClick={confirmDelete}>
            Delete
          </Button>
        </Group>
      </Modal>
    </Box>
  );
}