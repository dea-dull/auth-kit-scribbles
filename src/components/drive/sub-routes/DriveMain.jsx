// import { useState } from "react";
// import { Table, Box, Badge, ActionIcon, Group, Checkbox, Tooltip, Text, Button, Menu } from "@mantine/core";
// import {
//   IconDotsVertical, IconFile, IconFolder, IconDownload, IconShare, IconInfoCircle,
//   IconEdit, IconCopy, IconTrash, IconArrowsMove,
// } from "@tabler/icons-react";
// import "../DriveRoutes.css";

// // Mock data
// const initialFiles = [
//   {
//     id: 1, title: "Project Plan.pdf", type: "pdf", status: "Private",
//     modified: "2025-10-01", size: "2.3 MB",
//   },
//   {
//     id: 2, title: "Photos", type: "folder", status: "Shared",
//     modified: "2025-09-28", size: "--",
//   },
//   {
//     id: 3, title: "Resume.docx", type: "docx", status: "Private",
//     modified: "2025-09-20", size: "153 KB",
//   },
//   {
//     id: 4, title: "Team Notes.txt", type: "txt", status: "Shared",
//     modified: "2025-09-18", size: "8 KB",
//   },
//   {
//     id: 5, title: "Archive.zip", type: "zip", status: "Private",
//     modified: "2025-09-12", size: "3.8 MB",
//   },
// ];

// const typeIcon = (type) =>
//   type === "folder" ? <IconFolder color="#8ef58a" size={18} /> : <IconFile size={18} />;

// export default function DriveMain() {
//   const [selected, setSelected] = useState([]);
//   const [files, setFiles] = useState(initialFiles);

//   const toggleSelect = (id) => {
//     setSelected((sel) =>
//       sel.includes(id) ? sel.filter((i) => i !== id) : [...sel, id]
//     );
//   };
//   const selectAll = () =>
//     setSelected(selected.length === files.length ? [] : files.map((f) => f.id));

//   // Bulk actions (implement as needed)
//   const bulkDelete = () => {
//     setFiles((fs) => fs.filter((f) => !selected.includes(f.id)));
//     setSelected([]);
//   };

//   // Single actions (implement as needed)
//   const onDelete = (id) => {
//     setFiles((fs) => fs.filter((f) => f.id !== id));
//     setSelected((sel) => sel.filter((sid) => sid !== id));
//   };

//   return (
//     <Box style={{
//       flex: 1,
//       background: "linear-gradient(90deg, #000 0%, #011 100%)",
//       color: "rgba(255,255,255,0.87)",
//       padding: 24,
//       display: "flex",
//       flexDirection: "column",
//       minHeight: "100vh",
//     }}>
//       {/* Top bar actions */}
//       <Group mb="sm" position="apart">
//         <Group>
//           <Checkbox
//             checked={selected.length === files.length && files.length > 0}
//             indeterminate={selected.length > 0 && selected.length < files.length}
//             onChange={selectAll}
//           />
//           <Text size="sm">{selected.length} selected</Text>
//         </Group>
//         <Group>
//           <Tooltip label="Copy">
//             <ActionIcon variant="light" color="teal" disabled={selected.length === 0}>
//               <IconCopy />
//             </ActionIcon>
//           </Tooltip>
//           <Tooltip label="Move">
//             <ActionIcon variant="light" color="teal" disabled={selected.length === 0}>
//               <IconArrowsMove />
//             </ActionIcon>
//           </Tooltip>
//           <Tooltip label="Delete">
//             <ActionIcon variant="light" color="red" disabled={selected.length === 0} onClick={bulkDelete}>
//               <IconTrash />
//             </ActionIcon>
//           </Tooltip>
//         </Group>
//       </Group>
//       {/* Table/Grid */}
//       <Table className="drive-table"highlightOnHover verticalSpacing="sm" striped >
//         <thead>
//           <tr>
//             <th></th>
//             <th>Title</th>
//             <th>Status</th>
//             <th>Last Modified</th>
//             <th>Size</th>
//             <th>Type</th>
//             <th></th>
//           </tr>
//         </thead>
//         <tbody>
//           {files.map((f) => (
//             <tr key={f.id} style={{ background: selected.includes(f.id) ? "rgba(142,245,138,0.08)" : "transparent" }}>
//               <td>
//                 <Checkbox checked={selected.includes(f.id)} onChange={() => toggleSelect(f.id)} />
//               </td>
//               <td>
//                 <Group spacing="xs">
//                   {typeIcon(f.type)}
//                   <Text>{f.title}</Text>
//                 </Group>
//               </td>
//               <td>
//                 <Badge color={f.status === "Private" ? "gray" : "teal"} variant="light">{f.status}</Badge>
//               </td>
//               <td>{f.modified}</td>
//               <td>{f.size}</td>
//               <td><Text>{f.type.toUpperCase()}</Text></td>
//               <td>
//                 <Menu shadow="md" width={180} position="bottom-end" withArrow>
//                   <Menu.Target>
//                     <ActionIcon variant="transparent" className="dots-icon">
//                       <IconDotsVertical />
//                     </ActionIcon>



//                   </Menu.Target>
//                   <Menu.Dropdown>
//                     <Menu.Item icon={<IconEdit size={16} />}>Rename</Menu.Item>
//                     <Menu.Item icon={<IconCopy size={16} />}>Copy</Menu.Item>
//                     <Menu.Item icon={<IconArrowsMove size={16} />}>Move To</Menu.Item>
//                     <Menu.Item icon={<IconDownload size={16} />}>Download</Menu.Item>
//                     <Menu.Item icon={<IconShare size={16} />}>Share</Menu.Item>
//                     <Menu.Item icon={<IconInfoCircle size={16} />}>Info</Menu.Item>
//                     <Menu.Divider />
//                     <Menu.Item icon={<IconTrash size={16} />} color="red" onClick={() => onDelete(f.id)}>Delete</Menu.Item>
//                   </Menu.Dropdown>
//                 </Menu>
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </Table>
//       {/* Storage info at the bottom */}
//       <Box mt="auto" style={{
//         borderTop: "1px solid #222",
//         paddingTop: 12,
//         color: "rgba(255,255,255,0.7)",
//         display: "flex",
//         justifyContent: "space-between",
//         alignItems: "center",
//       }}>
//         <span className="storage-span">Storage: 2.1 GB used of 15 GB</span>
//               <Button
//         size="xs"
//         variant="subtle"
//         color="teal"
//         styles={{
//           root: {
//             backgroundColor: 'transparent',
//             '&:hover': { backgroundColor: 'rgba(0, 150, 136, 0.1)' }, // soft hover tint
//           },
//         }}
//       >
//         Manage Storage
//       </Button>

//       </Box>
//     </Box>
//   );
// }





import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Table,
  Box,
  Badge,
  ActionIcon,
  Group,
  Checkbox,
  Tooltip,
  Text,
  Button,
  Menu,
  TextInput,
  Select,
  Pagination,
  Modal,
  Loader,
  Stack,
  Breadcrumbs,
  Anchor,
  Notification,
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
  IconSearch,
  IconPlus,
  IconUpload,
  IconChevronRight,
  IconX,
} from "@tabler/icons-react";
import "../DriveRoutes.css";
import SingleInputModal from "../../ui/SingleInputModal.jsx";

// NOTE: Replace stubs (fetchFilesStub, noop) with your real hooks/services:
// import { useFileOperations } from '../../hooks/useFileOperations';
// import { useFileUpload } from '../../hooks/useFileUpload';
// import { fileService } from '../../services/FileServices';

const noop = () => Promise.resolve();

const fetchFilesStub = async ({ page, limit, q, folderId }) => {
  await new Promise((r) => setTimeout(r, 300));
  return {
    items: [
      { id: 2, title: "Photos", type: "folder", status: "Shared", modifiedAt: "2025-09-28T08:30:00Z", size: 0 },
      { id: 1, title: "Project Plan.pdf", type: "pdf", status: "Private", modifiedAt: "2025-10-01T12:00:00Z", size: 2.3 * 1024 * 1024 },
      { id: 3, title: "Resume.docx", type: "docx", status: "Private", modifiedAt: "2025-09-20T16:00:00Z", size: 153 * 1024 },
    ],
    total: 3,
    page,
    limit,
  };
};

const typeIcon = (type) =>
  type === "folder" ? <IconFolder color="#8ef58a" size={18} /> : <IconFile size={18} />;

// Custom hook for debounced search
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default function DriveMain() {
  // data + selection
  const [files, setFiles] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [operationLoading, setOperationLoading] = useState(false);

  // pagination/search/sort
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [sort, setSort] = useState("modified_desc");

  // Debounced search
  const debouncedQuery = useDebounce(searchTerm, 300);

  // folder navigation / breadcrumbs
  const [currentFolder, setCurrentFolder] = useState({ id: "root", name: "My Drive", path: [] });

  // modals
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);

  // for rename/create
  const [activeFile, setActiveFile] = useState(null);

  // file input (upload)
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
        e.preventDefault();
        setSelected(files.map((f) => f.id));
      }
      if (e.key === "Escape") {
        setSelected([]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [files]);

  // Fetch files (wire to your service/hook)
  const fetchFiles = useCallback(async ({ page = 1, limit = 25, q = "", folderId = currentFolder.id } = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFilesStub({ page, limit, q, folderId });
      setFiles(res.items || []);
      setTotal(res.total ?? (res.items ? res.items.length : 0));
    } catch (err) {
      setError(err?.message || "Failed to load files");
    } finally {
      setLoading(false);
    }
  }, [currentFolder.id]);

  useEffect(() => {
    fetchFiles({ page, limit, q: debouncedQuery, folderId: currentFolder.id });
  }, [page, limit, debouncedQuery, sort, currentFolder.id, fetchFiles]);

  // selection handlers
  const toggleSelect = (id) => setSelected((sel) => (sel.includes(id) ? sel.filter((i) => i !== id) : [...sel, id]));
  const selectAll = () => setSelected((sel) => (selected.length === files.length && files.length > 0 ? [] : files.map((f) => f.id)));

  // single & bulk actions - wire to your services/hooks
  const onDelete = async (id) => {
    setOperationLoading(true);
    const before = files;
    setFiles((fs) => fs.filter((f) => f.id !== id));
    setSelected((sel) => sel.filter((sid) => sid !== id));
    try {
      await noop();
      setTotal((t) => Math.max(0, t - 1));
    } catch (err) {
      setFiles(before);
      setError(err?.message || "Delete failed");
    } finally {
      setOperationLoading(false);
    }
  };

  const bulkDelete = async () => {
    setConfirmOpen(false);
    if (!selected.length) return;
    
    setOperationLoading(true);
    const before = files;
    setFiles((fs) => fs.filter((f) => !selected.includes(f.id)));
    const toDelete = selected.slice();
    setSelected([]);
    
    try {
      await noop();
      setTotal((t) => Math.max(0, t - toDelete.length));
    } catch (err) {
      setFiles(before);
      setError(err?.message || "Bulk delete failed");
    } finally {
      setOperationLoading(false);
    }
  };

  const handleDownload = async (file) => {
    setOperationLoading(true);
    try {
      await noop();
    } catch (err) {
      setError(err?.message || "Download failed");
    } finally {
      setOperationLoading(false);
    }
  };

  // folder navigation with error handling
  const openFolder = (folder) => {
    if (!folder || !folder.id) {
      setError("Invalid folder");
      return;
    }
    setCurrentFolder((cur) => ({
      id: folder.id,
      name: folder.title || folder.name,
      path: [...(cur.path || []), { id: cur.id, name: cur.name }],
    }));
    setPage(1);
    setSelected([]);
  };

  const breadcrumbItems = [
    { id: "root", name: "My Drive" },
    ...currentFolder.path,
    { id: currentFolder.id, name: currentFolder.name },
  ];

  const navigateToBreadcrumb = (item, index) => {
    const newPath = breadcrumbItems.slice(0, index);
    setCurrentFolder({ 
      id: item.id, 
      name: item.name, 
      path: newPath.slice(0, -1) // Remove the current folder from path
    });
    setPage(1);
    setSelected([]);
  };

  // create folder
  const confirmCreateFolder = async (name) => {
    setOperationLoading(true);
    try {
      await noop();
      setCreateFolderOpen(false);
      fetchFiles({ page: 1, limit, q: debouncedQuery, folderId: currentFolder.id });
    } catch (err) {
      setError(err?.message || "Create folder failed");
    } finally {
      setOperationLoading(false);
    }
  };

  const confirmRename = async (newName) => {
    if (!activeFile) return;
    setOperationLoading(true);
    try {
      await noop();
      setRenameOpen(false);
      setActiveFile(null);
      fetchFiles({ page, limit, q: debouncedQuery, folderId: currentFolder.id });
    } catch (err) {
      setError(err?.message || "Rename failed");
    } finally {
      setOperationLoading(false);
    }
  };

  // upload with cancellation support
  const onChooseFiles = () => fileInputRef.current?.click();

  const onFilesSelected = async (e) => {
    const filesSelected = Array.from(e.target.files || []);
    if (!filesSelected.length) return;

    let cancelled = false;
    setIsUploading(true);

    try {
      for (let i = 0; i < filesSelected.length; i++) {
        if (cancelled) break;
        
        const f = filesSelected[i];
        setUploadProgress(Math.round(((i + 1) / filesSelected.length) * 100));
        await new Promise((r) => setTimeout(r, 220));
      }
      
      if (!cancelled) {
        await fetchFiles({ page: 1, limit, q: debouncedQuery, folderId: currentFolder.id });
      }
    } catch (err) {
      if (!cancelled) {
        setError(err?.message || "Upload failed");
      }
    } finally {
      if (!cancelled) {
        setIsUploading(false);
        setUploadProgress(0);
      }
      e.target.value = "";
    }

    return () => { cancelled = true; };
  };

  // Clear error notification
  const clearError = () => setError(null);

  // memoized rows
  const fmtSize = (bytes) => {
    if (!bytes) return "--";
    const kb = 1024;
    if (bytes < kb) return `${bytes} B`;
    if (bytes < kb * kb) return `${(bytes / kb).toFixed(1)} KB`;
    if (bytes < kb * kb * kb) return `${(bytes / (kb * kb)).toFixed(1)} MB`;
    return `${(bytes / (kb * kb * kb)).toFixed(1)} GB`;
  };
  
  const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString() : "--");

  const rows = useMemo(() => {
    if (loading) return null;
    return files.map((f) => (
      <tr key={f.id} style={{ background: selected.includes(f.id) ? "rgba(142,245,138,0.08)" : "transparent" }}>
        <td>
          <Checkbox 
            checked={selected.includes(f.id)} 
            onChange={() => toggleSelect(f.id)}
            aria-label={`Select ${f.title}`}
          />
        </td>
        <td>
          <Group spacing="xs">
            <span 
              onDoubleClick={() => f.type === "folder" && openFolder(f)} 
              style={{ cursor: f.type === "folder" ? "pointer" : "default" }}
              role="button"
              tabIndex={0}
              aria-label={f.type === "folder" ? `Open folder ${f.title}` : `File ${f.title}`}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && f.type === "folder") {
                  openFolder(f);
                }
              }}
            >
              {typeIcon(f.type)}
            </span>
            <Text 
              style={{ cursor: f.type === "folder" ? "pointer" : "default" }} 
              onClick={() => f.type === "folder" && openFolder(f)}
              role={f.type === "folder" ? "button" : "text"}
              tabIndex={f.type === "folder" ? 0 : -1}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && f.type === "folder") {
                  openFolder(f);
                }
              }}
            >
              {f.title}
            </Text>
          </Group>
        </td>
        <td>
          <Badge color={f.status === "Private" ? "gray" : "teal"} variant="light">
            {f.status}
          </Badge>
        </td>
        <td>{fmtDate(f.modifiedAt)}</td>
        <td>{fmtSize(f.size)}</td>
        <td>
          <Text>{(f.type || "").toUpperCase()}</Text>
        </td>
        <td>
          <Menu
            shadow="md"
            width={220}
            position="bottom-end"
            withArrow
            styles={{
              dropdown: { backgroundColor: "#fff", color: "#000" },
              item: { color: "#000" },
            }}
          >
            <Menu.Target>
              <ActionIcon 
                variant="transparent" 
                className="dots-icon" 
                aria-label={`Actions for ${f.title}`}
                disabled={operationLoading}
              >
                <IconDotsVertical />
              </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Item 
                icon={<IconEdit size={16} />} 
                onClick={() => { setActiveFile(f); setRenameOpen(true); }}
                disabled={operationLoading}
              >
                Rename
              </Menu.Item>
              <Menu.Item icon={<IconCopy size={16} />} disabled={operationLoading}>Copy</Menu.Item>
              <Menu.Item icon={<IconArrowsMove size={16} />} disabled={operationLoading}>Move To</Menu.Item>
              <Menu.Item 
                icon={<IconDownload size={16} />} 
                onClick={() => handleDownload(f)}
                disabled={operationLoading}
              >
                Download
              </Menu.Item>
              <Menu.Item icon={<IconShare size={16} />} disabled={operationLoading}>Share</Menu.Item>
              <Menu.Item icon={<IconInfoCircle size={16} />} disabled={operationLoading}>Info</Menu.Item>
              <Menu.Divider />
              <Menu.Item 
                icon={<IconTrash size={16} />} 
                color="red" 
                onClick={() => onDelete(f.id)}
                disabled={operationLoading}
              >
                Delete
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </td>
      </tr>
    ));
  }, [files, selected, loading, operationLoading]);

  const allSelected = files.length > 0 && selected.length === files.length;
  const anySelected = selected.length > 0;

  return (
    <Box
      style={{
        flex: 1,
        background: "linear-gradient(90deg, #000 0%, #011 100%)",
        color: "rgba(255,255,255,0.87)",
        padding: 24,
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
      }}
    >
      {/* Error Notification */}
      {error && (
        <Notification
          icon={<IconX size={18} />}
          color="red"
          title="Error"
          onClose={clearError}
          mb="md"
        >
          {error}
        </Notification>
      )}

      {/* Top bar: breadcrumbs + actions */}
      <Group mb="sm" position="apart" align="center">
        <Group spacing="sm">
          <Breadcrumbs separator={<IconChevronRight size={14} color="rgba(255,255,255,0.5)" />}>
            {breadcrumbItems.map((b, i) => (
              <Anchor
                key={b.id}
                component="button"
                onClick={() => navigateToBreadcrumb(b, i)}
                style={{ color: "rgba(255,255,255,0.87)", background: "transparent", border: "none", padding: 0, cursor: "pointer" }}
                aria-label={`Navigate to ${b.name}`}
              >
                {b.name}
              </Anchor>
            ))}
          </Breadcrumbs>
        </Group>

        <Group>
          <input 
            ref={fileInputRef} 
            type="file" 
            style={{ display: "none" }} 
            onChange={onFilesSelected} 
            multiple 
            aria-label="File upload"
          />
          <Tooltip label="Upload files">
            <ActionIcon 
              color="teal" 
              variant="filled" 
              onClick={onChooseFiles} 
              aria-label="Upload files"
              disabled={isUploading || operationLoading}
            >
              <IconUpload />
            </ActionIcon>
          </Tooltip>

          <Tooltip label="Create folder">
            <ActionIcon 
              color="teal" 
              variant="filled" 
              onClick={() => setCreateFolderOpen(true)} 
              aria-label="Create folder"
              disabled={operationLoading}
            >
              <IconPlus />
            </ActionIcon>
          </Tooltip>

          <Group spacing="sm" sx={{ alignItems: "center" }}>
            <Text size="sm" color="dimmed">{selected.length} selected</Text>
            <Checkbox
              checked={allSelected}
              indeterminate={selected.length > 0 && selected.length < files.length}
              onChange={selectAll}
              aria-label="Select all files"
              disabled={loading || files.length === 0}
            />
          </Group>
        </Group>
      </Group>

      {/* Top action row: search / sort / bulk controls */}
      <Group mb="md" position="apart">
        <Group>
          <Button 
            size="xs" 
            variant="subtle" 
            color="teal" 
            disabled={!anySelected || operationLoading} 
            onClick={() => setConfirmOpen(true)}
            loading={operationLoading}
          >
            Delete Selected
          </Button>
          <Button 
            size="xs" 
            variant="subtle" 
            color="teal" 
            disabled={!anySelected || operationLoading}
          >
            Move
          </Button>
          <Button 
            size="xs" 
            variant="subtle" 
            color="teal" 
            disabled={!anySelected || operationLoading}
          >
            Copy
          </Button>
        </Group>

        <Group>
          <TextInput
            size="sm"
            icon={<IconSearch size={14} />}
            placeholder="Search files"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setSearchTerm("")}
            style={{ minWidth: 260 }}
            disabled={loading}
            aria-label="Search files"
          />

          <Select
            size="sm"
            value={sort}
            onChange={(v) => setSort(v)}
            data={[
              { value: "modified_desc", label: "Modified (newest)" },
              { value: "modified_asc", label: "Modified (oldest)" },
              { value: "name_asc", label: "Name (A–Z)" },
              { value: "name_desc", label: "Name (Z–A)" },
              { value: "size_desc", label: "Size (largest)" },
            ]}
            styles={{ root: { minWidth: 200 } }}
            disabled={loading}
            aria-label="Sort files by"
          />
        </Group>
      </Group>

      {/* Operation loading overlay */}
      {operationLoading && (
        <Box style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}>
          <Stack align="center">
            <Loader size="lg" />
            <Text color="white">Processing...</Text>
          </Stack>
        </Box>
      )}

      {/* Table / loading / empty */}
      <Box style={{ flex: "1 1 auto", overflow: "auto", position: "relative" }}>
        {loading ? (
          <Stack spacing="xs">
            <Group><Loader size="sm" /> <Text>Loading files…</Text></Group>
          </Stack>
        ) : error ? (
          <Box>
            <Text color="red">{error}</Text>
            <Button size="xs" onClick={() => fetchFiles({ page, limit, q: debouncedQuery, folderId: currentFolder.id })}>Retry</Button>
          </Box>
        ) : files.length === 0 ? (
          <Box style={{ padding: 24 }}>
            <Text size="lg" weight={700}>No files here</Text>
            <Text color="dimmed" mt="xs">Upload files or create a folder to get started. You can drag & drop files into this area.</Text>
            <Group mt="md">
              <Button 
                onClick={onChooseFiles} 
                leftIcon={<IconUpload />}
                disabled={isUploading || operationLoading}
              >
                Upload
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setCreateFolderOpen(true)} 
                leftIcon={<IconPlus />}
                disabled={operationLoading}
              >
                Create Folder
              </Button>
            </Group>
          </Box>
        ) : (
          <Table className="drive-table" highlightOnHover verticalSpacing="sm" striped>
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
            <tbody>{rows}</tbody>
          </Table>
        )}
      </Box>

      {/* Upload progress */}
      {isUploading && (
        <Box mt="sm" p="md" style={{ backgroundColor: "rgba(0,0,0,0.3)", borderRadius: 4 }}>
          <Group position="apart">
            <Text size="sm">Uploading files...</Text>
            <Text size="sm">{uploadProgress}%</Text>
          </Group>
          <Box 
            style={{ 
              height: 4, 
              backgroundColor: "rgba(255,255,255,0.2)", 
              borderRadius: 2, 
              marginTop: 8,
              overflow: "hidden"
            }}
          >
            <Box 
              style={{ 
                height: "100%", 
                backgroundColor: "#8ef58a",
                width: `${uploadProgress}%`,
                transition: "width 0.3s ease"
              }}
            />
          </Box>
        </Box>
      )}

      {/* Bottom: pagination & storage */}
      <Box mt="auto" style={{ borderTop: "1px solid #222", paddingTop: 12, color: "rgba(255,255,255,0.7)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Group spacing="xs">
          <Text size="sm">Storage: 2.1 GB used of 15 GB</Text>
        </Group>

        <Group>
          <Pagination 
            total={Math.max(1, Math.ceil(total / limit))} 
            page={page} 
            onChange={(p) => setPage(p)} 
            siblings={1} 
            boundaries={1} 
            size="sm" 
            disabled={loading}
          />
          <Select 
            size="xs" 
            value={String(limit)} 
            onChange={(v) => { setLimit(Number(v)); setPage(1); }} 
            data={[
              { value: "10", label: "10" }, 
              { value: "25", label: "25" }, 
              { value: "50", label: "50" }
            ]} 
            disabled={loading}
            aria-label="Items per page"
          />
          <Button size="xs" variant="subtle" color="teal">Manage Storage</Button>
        </Group>
      </Box>

      {/* Confirm delete modal */}
      <Modal opened={confirmOpen} onClose={() => setConfirmOpen(false)} title="Confirm delete">
        <Text>Are you sure you want to move {selected.length} selected file(s) to Trash? They will be kept for 7 days.</Text>
        <Group position="right" mt="md">
          <Button variant="default" onClick={() => setConfirmOpen(false)} disabled={operationLoading}>
            Cancel
          </Button>
          <Button 
            color="red" 
            onClick={bulkDelete}
            loading={operationLoading}
          >
            Delete
          </Button>
        </Group>
      </Modal>

      {/* Rename modal */}
      <SingleInputModal 
        opened={renameOpen} 
        initialValue={activeFile?.title} 
        title={`Rename ${activeFile?.title ?? ""}`} 
        onClose={() => { setRenameOpen(false); setActiveFile(null); }} 
        onConfirm={(value) => confirmRename(value)}
        loading={operationLoading}
      />

      {/* Create folder modal */}
      <SingleInputModal 
        opened={createFolderOpen} 
        initialValue={""} 
        title="Create Folder" 
        onClose={() => setCreateFolderOpen(false)} 
        onConfirm={(value) => confirmCreateFolder(value)}
        loading={operationLoading}
      />
    </Box>
  );
}