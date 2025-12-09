import React from 'react';
import './App.css';
import { Amplify } from 'aws-amplify';
import { MantineProvider } from '@mantine/core';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/login/Login.jsx';
import ResetPasswordPage from './components/login/ResetPassword.jsx';
import SignUp from './components/signUp/SignUp.jsx';
import VerificationResult from './components/verify/Verify.jsx';
import Dashboard from './components/dashboard/Dashboard.jsx';
import { Toaster } from "sonner";
import "bootstrap-icons/font/bootstrap-icons.css";
import amplifyOutputs from './puts.json';
import Layout from './components/layout/Layout.jsx';
import '@mantine/core/styles.css';
// Must come after core styles:
import '@mantine/tiptap/styles.css';
// ✅ FIXED: Use the correct Amplify v6 configuration structure
try {
  Amplify.configure(amplifyOutputs)
} catch (error) {
  console.error('Amplify configuration error:', error);
}

function App() {

      console.log('App component rendering'); // Add this


  return (
    <MantineProvider>
      <Toaster richColors position="top-right" />
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/verify" element={<VerificationResult />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Protected routes that require Sidebar */}
          <Route path="/*" element={<Layout />} /> 
      </Routes>
      </Router>
    </MantineProvider>
  );
}

export default App;
