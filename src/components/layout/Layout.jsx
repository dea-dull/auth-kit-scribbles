import React, { useState } from 'react';
import Sidebar from '../sidebar/Sidebar';
import { Routes, Route } from 'react-router-dom';
import Dashboard from '../dashboard/Dashboard'; 
import Logs from '../logs/Logs';
import Drive from '../drive/Drive';
import ContactsLayout from '../contacts/ContactsLayout';
import MessagesLayout from "../messages/MessagesLayout";

import Settings from '../settings/Settings';
import Notes from '../notes/Notes';

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="layout" style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className={`content ${isSidebarOpen ? 'content-expanded' : 'content-collapsed'}`} style={{ flex: 1, transition: 'margin 0.2s' }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/drive/*" element={<Drive />} />
          <Route path="/contacts" element={<ContactsLayout />} />
          <Route path="/messages" element={<MessagesLayout />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/notes" element={<Notes />} />
        </Routes>
      </div>
    </div>
  );
};

export default Layout;


