// // src/context/AuthContext.jsx
// import React, { createContext, useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { notify } from '../ui/Notify.jsx';

// export const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//   const [accessTokenExpiry, setAccessTokenExpiry] = useState(null); // in seconds
//   const navigate = useNavigate();

//   // Silent refresh effect
//   useEffect(() => {
//     if (!accessTokenExpiry) return;

//     // 2 minutes before expiry
//     const refreshTime = (accessTokenExpiry - 120) * 1000;
//     const timer = setTimeout(async () => {
//       try {
//         const API_URL = import.meta.env.VITE_API_URL;
//         const res = await fetch(`${API_URL}/refresh`, {
//           method: 'POST',
//           credentials: 'include', // important for HttpOnly cookies
//         });

//         if (!res.ok) {
//           navigate('/login');
//           notify.error('Session expired. Please log in again.');
//           return;
//         }

//         const data = await res.json();
//         // Update expiry for next silent refresh
//         setAccessTokenExpiry(data.expiresIn);

//       } catch (err) {
//         console.error('Silent refresh failed:', err);
//         navigate('/login');
//         notify.error('Session expired. Please log in again.');
//       }
//     }, refreshTime);

//     return () => clearTimeout(timer); // clean up on unmount or expiry change
//   }, [accessTokenExpiry, navigate]);

//   return (
//     <AuthContext.Provider value={{ accessTokenExpiry, setAccessTokenExpiry }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

