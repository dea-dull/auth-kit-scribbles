import { useState, useRef, useEffect } from "react";
import {
  Box, Group, Text, TextInput, ScrollArea, Button, ActionIcon, Tooltip, Flex, Menu, Badge, rem, Loader,
} from "@mantine/core";
import { RichTextEditor, Link } from "@mantine/tiptap";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import Superscript from "@tiptap/extension-superscript";
import Subscript from "@tiptap/extension-subscript";
import { debounce } from "lodash";
import {
  IconPlus, IconSearch, IconPinned, IconPinnedFilled, IconStar, IconStarFilled,
  IconDotsVertical, IconCheck, IconTrash, IconTag, IconEdit, IconLoader2, IconCloud, IconCloudUpload, IconCloudCheck,
} from "@tabler/icons-react";
import SingleInputModal from "../../components/ui/SingleInputModal.jsx";
import "./Notes.css";
import { localNotesAPI } from "./db.js";
import { notesAPI } from "../api/notes.js"; // ← Import the API service
import { v4 as uuidv4 } from 'uuid';

function randomString(len = 6) {
  return Math.random().toString(36).substring(2, 2 + len);
}

const nowDate = () => new Date().toISOString().split("T")[0];

export default function NotesApp() {
  // --- State ---
  const [notes, setNotes] = useState([]);
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle');
  const [online, setOnline] = useState(navigator.onLine);

  // --- Editor ---
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: false }),
      Link,
      Superscript,
      Subscript,
      Highlight,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: "",
    editorProps: {
      attributes: {
        placeholder: "Input notes here",
        style: "flex: 1; overflow-y: auto;",
      },
    },
  });

  // --- Online/Offline Detection ---
  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      setSyncStatus('online');
      syncUnsyncedNotes();
    };
    
    const handleOffline = () => {
      setOnline(false);
      setSyncStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // --- Load notes from local DB on mount ---
  useEffect(() => {
    loadNotesFromLocal();
    loadNotesFromAWS(); // ← NEW: Also load from AWS on startup
  }, []);

  const loadNotesFromLocal = async () => {
    try {
      const localNotes = await localNotesAPI.getAllNotes();
      setNotes(localNotes);
      
      if (localNotes.length > 0 && !activeNoteId) {
        setActiveNoteId(localNotes[0].id);
      }
    } catch (error) {
      console.error('Failed to load notes from local DB:', error);
    }
  };

  // ← NEW: Load notes from AWS and merge with local
  const loadNotesFromAWS = async () => {
    if (!online) return;
    
    try {
      const cloudNotes = await notesAPI.getNotes(); // ← Using API service!
      
      // Merge cloud notes with local notes
      const localNotes = await localNotesAPI.getAllNotes();
      const mergedNotes = [...localNotes];
      
      cloudNotes.forEach(cloudNote => {
        const existingIndex = mergedNotes.findIndex(n => n.id === cloudNote.noteId);
        if (existingIndex >= 0) {
          // Cloud version is newer? Use cloud
          if (new Date(cloudNote.updatedAt) > new Date(mergedNotes[existingIndex].updatedAt)) {
            mergedNotes[existingIndex] = { 
              ...cloudNote, 
              id: cloudNote.noteId, 
              synced: true 
            };
          }
        } else {
          // New note from cloud
          mergedNotes.push({ 
            ...cloudNote, 
            id: cloudNote.noteId, 
            synced: true 
          });
        }
      });
      
      // Save merged notes locally
      for (const note of mergedNotes) {
        await localNotesAPI.saveNote(note);
      }
      
      setNotes(mergedNotes);
    } catch (error) {
      console.error('Failed to load notes from AWS:', error);
    }
  };

  // --- Sync to AWS (UPDATED) ---
  const syncNoteToAWS = async (note) => {
    if (!online) {
      console.log('Offline - note saved locally only');
      return;
    }

    try {
      setSyncStatus('syncing');
      await notesAPI.syncNote(note); // ← Using API service!
      await localNotesAPI.markAsSynced(note.id);
      setSyncStatus('online');
    } catch (error) {
      console.error('Failed to sync note to AWS:', error);
      setSyncStatus('online');
    }
  };

  // --- Sync all unsynced notes ---
  const syncUnsyncedNotes = async () => {
    if (!online) return;
    
    try {
      setSyncStatus('syncing');
      const unsyncedNotes = await localNotesAPI.getUnsyncedNotes();
      
      for (const note of unsyncedNotes) {
        await syncNoteToAWS(note);
      }
      
      setSyncStatus('online');
    } catch (error) {
      console.error('Failed to sync unsynced notes:', error);
      setSyncStatus('online');
    }
  };

  // --- Autosave Logic (Local + Cloud) ---
  useEffect(() => {
    if (!editor) return;
    if (!activeNoteId) return;
    
    const handleUpdate = async () => {
      setSaving(true);
      const html = editor.getHTML();
      
      const currentNote = notes.find(n => n.id === activeNoteId);
      if (!currentNote) return;
      
      const updatedNote = {
        ...currentNote,
        content: html,
        updatedAt: new Date().toISOString(),
      };
      
      await localNotesAPI.saveNote(updatedNote);
      setNotes(prev => prev.map(note =>
        note.id === activeNoteId ? updatedNote : note
      ));
      
      await syncNoteToAWS(updatedNote);
      
      setSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 1200);
    };
    
    const debouncedUpdate = debounce(handleUpdate, 600);
    editor.on('update', debouncedUpdate);

    return () => {
      editor.off('update', debouncedUpdate);
      debouncedUpdate.cancel();
    };
  }, [editor, notes, activeNoteId, online]);

  // --- Load selected note into editor ---
  useEffect(() => {
    if (!editor) return;
    const selected = notes.find(n => n.id === activeNoteId);
    if (selected) {
      editor.commands.setContent(selected.content || "");
    }
  }, [activeNoteId, editor, notes]);

  // --- Actions ---
  const createNewNote = async () => {
    const title = `${nowDate()}_${randomString(8)}`;
    const id = `note_${uuidv4()}`;
    const newNote = {
      id,
      title,
      content: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pinned: false,
      favorite: false,
      tags: [],
      synced: false
    };
    
    await localNotesAPI.saveNote(newNote);
    setNotes(prev => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
    
    if (editor) editor.commands.setContent("");
    await syncNoteToAWS(newNote);
  };

  const openNote = (note) => {
    setActiveNoteId(note.id);
  };

  // --- Menu Dropdown Actions ---
  const handleMenuAction = async (action) => {
    if (!activeNoteId) return;
    
    if (action === "rename") setShowRenameModal(true);
    if (action === "delete") await handleDeleteNote();
    if (action === "pin") await updateNoteProperty('pinned', !activeNote.pinned);
    if (action === "addTag") setShowTagModal(true);
  };

  const updateNoteProperty = async (property, value) => {
    const updatedNote = {
      ...activeNote,
      [property]: value,
      updatedAt: new Date().toISOString()
    };
    
    await localNotesAPI.saveNote(updatedNote);
    setNotes(prev => prev.map(n =>
      n.id === activeNoteId ? updatedNote : n
    ));
    
    await syncNoteToAWS(updatedNote);
  };

  const handleRename = async (value) => {
    await updateNoteProperty('title', value);
    setShowRenameModal(false);
  };
  
  const handleAddTag = async (value) => {
    if (!value) return;
    
    const newTags = activeNote.tags.includes(value) 
      ? activeNote.tags 
      : [...activeNote.tags, value];
    
    await updateNoteProperty('tags', newTags);
    setShowTagModal(false);
  };

  // ← UPDATED: Now syncs deletion to AWS
  const handleDeleteNote = async () => {
    await localNotesAPI.deleteNote(activeNoteId);
    setNotes(prev => prev.filter(n => n.id !== activeNoteId));
    
    // Also delete from AWS if online
    if (online) {
      try {
        await notesAPI.deleteNote(activeNoteId); // ← Using API service!
      } catch (error) {
        console.error('Failed to delete note from AWS:', error);
      }
    }
    
    setActiveNoteId(null);
  };

  const handleRemoveTag = async (tag) => {
    const newTags = activeNote.tags.filter(t => t !== tag);
    await updateNoteProperty('tags', newTags);
  };
   
  // --- Filtering (Sidebar) ---
  const filteredNotes = notes
    .filter(note => note.title.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => (b.pinned - a.pinned) ||  (new Date(b.updatedAt) - new Date(a.updatedAt)));

  const activeNote = notes.find(n => n.id === activeNoteId);

  const getSyncIcon = () => {
    switch (syncStatus) {
      case 'syncing':
        return <IconLoader2 size={16} className="rotating" />;
      case 'online':
        return <IconCloudCheck size={16} color="#8ef58a" />;
      case 'offline':
        return <IconCloud size={16} color="#ff6b6b" />;
      default:
        return <IconCloud size={16} />;
    }
  };

  return (
    <Flex className="notes-app">
      {/* Sidebar */}
      <Box className="notes-sidebar">
        <Group position="apart" mb="xs">
          <Text size="lg" fw={700}>Notes</Text>
          <Tooltip label={online ? "Online" : "Offline"}>
            {getSyncIcon()}
          </Tooltip>
        </Group> 

        <TextInput
          className="search-input"
          placeholder="Search..."
          leftSection={<IconSearch size={16} />}
          value={searchTerm}
          onChange={e => setSearchTerm(e.currentTarget.value)}
        />
        
        <ScrollArea className="scroll-area">
          {filteredNotes.map(note => (
            <Box
              key={note.id}
              className={`note-item ${note.id === activeNoteId ? "active" : ""}`}
              onClick={() => openNote(note)}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {note.pinned ? <IconPinnedFilled size={16} color="#e09f3e" /> : <IconPinned size={16} opacity={0.4} />}
          
              {!note.synced && <IconCloudUpload size={14} color="#ffa502" />}

              <Text size="sm" truncate="end" style={{ flex: 1 }}>{note.title}</Text>
              {note.tags && note.tags.length > 0 &&
                note.tags.slice(0, 2).map(tag =>
                  <Badge key={tag} size="xs" color="indigo" style={{ marginLeft: 2 }}>{tag}</Badge>
                )
              }
            </Box>
          ))}
        </ScrollArea>

        <Button
          className="new-note-button"
          leftSection={<IconPlus size={16} />}
          variant="gradient"
          gradient={{ from: "indigo", to: "cyan" }}
          onClick={createNewNote}
        >
          New Note
        </Button>
      </Box>

      {/* Main Editor */}
      <Box className="editor-container">
        {activeNote ? (
          <>
            <Group className="editor-header" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Text
                fw={600}
                size="lg"
                style={{ cursor: "pointer" }}
                onClick={() => setShowRenameModal(true)}
                title="Click to rename"
              >
                {activeNote.title}
              </Text>
              <Box style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* Tags */}
                {activeNote.tags && activeNote.tags.map(tag =>
                  <Badge
                    key={tag}
                    size="sm"
                    color="indigo"
                    style={{ marginRight: 4, cursor: "pointer" }}
                    onClick={() => handleRemoveTag(tag)}
                    title="Remove tag"
                  >
                    {tag}
                  </Badge>
                )}
                
                {/* Sync Status */}
                {/* <Tooltip label={online ? "Online" : "Offline"}>
                  {getSyncIcon()}
                </Tooltip> */}
                
                {/* Saving Status */}
                {saving ? (
                  <Loader size="xs" color="indigo" />
                ) : saveSuccess ? (
                  <IconCheck size={18} color="green" />
                ) : null}

                {/* Dropdown Menu */}
                <Menu shadow="md" width={180} position="bottom-end" withArrow>
                  <Menu.Target>
                    <ActionIcon variant="light">
                      <IconDotsVertical size={20} />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item 
                      leftSection={<IconEdit size={16} />} 
                      onClick={() => handleMenuAction("rename")}
                    >
                      Rename
                    </Menu.Item>
                    <Menu.Item
                      leftSection={activeNote.pinned ? <IconPinnedFilled size={16} /> : <IconPinned size={16} />}
                      onClick={() => handleMenuAction("pin")}
                    >
                      {activeNote.pinned ? "Unpin" : "Pin"}
                    </Menu.Item>
    
                    <Menu.Item
                      leftSection={<IconTag size={16} />}
                      onClick={() => handleMenuAction("addTag")}
                    >
                      Add tag
                    </Menu.Item>
                    <Menu.Divider />
                    <Menu.Item
                      color="red"
                      leftSection={<IconTrash size={16} />}
                      onClick={() => handleMenuAction("delete")}
                    >
                      Delete
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </Box>
            </Group>

            <RichTextEditor 
              editor={editor} 
              classNames={{
                root: 'rich-text-editor',
                toolbar: 'rich-text-editor-toolbar',
                content: 'rich-text-editor-content'
              }} 
              style={{ flex: 1 }}
            >
              <RichTextEditor.Toolbar className="rich-text-editor-toolbar" sticky>
                <RichTextEditor.ControlsGroup>
                  <RichTextEditor.Bold />
                  <RichTextEditor.Italic />
                  <RichTextEditor.Underline />
                  <RichTextEditor.Strikethrough />
                  <RichTextEditor.ClearFormatting />
                  <RichTextEditor.Highlight />
                  <RichTextEditor.Code />
                </RichTextEditor.ControlsGroup>
                <RichTextEditor.ControlsGroup>
                  <RichTextEditor.H1 />
                  <RichTextEditor.H2 />
                  <RichTextEditor.H3 />
                  <RichTextEditor.H4 />
                </RichTextEditor.ControlsGroup>
                <RichTextEditor.ControlsGroup>
                  <RichTextEditor.Blockquote />
                  <RichTextEditor.Hr />
                  <RichTextEditor.BulletList />
                  <RichTextEditor.OrderedList />
                  <RichTextEditor.Subscript />
                  <RichTextEditor.Superscript />
                </RichTextEditor.ControlsGroup>
                <RichTextEditor.ControlsGroup>
                  <RichTextEditor.Link />
                  <RichTextEditor.Unlink />
                </RichTextEditor.ControlsGroup>
                <RichTextEditor.ControlsGroup>
                  <RichTextEditor.AlignLeft />
                  <RichTextEditor.AlignCenter />
                  <RichTextEditor.AlignJustify />
                  <RichTextEditor.AlignRight />
                </RichTextEditor.ControlsGroup>
                <RichTextEditor.ControlsGroup>
                  <RichTextEditor.Undo />
                  <RichTextEditor.Redo />
                </RichTextEditor.ControlsGroup>
              </RichTextEditor.Toolbar>
              <RichTextEditor.Content style={{ flex: 1, overflowY: "auto" }} />
            </RichTextEditor>
          </>
        ) : (
          <Flex className="empty-state" style={{ height: "100%", alignItems: "center", justifyContent: "center" }}>
            <Text className="empty-state-text">Select or create a note to begin</Text>
          </Flex>
        )}
      </Box>

      {/* Modals */}
      {showRenameModal && (
        <SingleInputModal
          title="Rename Note"
          description="Enter a new name for your note"
          inputLabel="Note Title"
          inputPlaceholder={activeNote?.title}
          buttonLabel="Rename"
          onSubmit={handleRename}
          onClose={() => setShowRenameModal(false)}
        />
      )}
      {showTagModal && (
        <SingleInputModal
          title="Add Tag"
          description="Enter a tag for this note"
          inputLabel="Tag"
          inputPlaceholder="tag"
          buttonLabel="Add"
          onSubmit={handleAddTag}
          onClose={() => setShowTagModal(false)}
        />
      )}
    </Flex>
  );
}