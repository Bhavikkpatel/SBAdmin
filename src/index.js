import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// Import the provider
import { DataProvider } from './context/DataContext'; 

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // Remove StrictMode if it causes double-fetching issues in dev, 
  // but keeping it is generally better.
  <React.StrictMode>
    <DataProvider> {/* WRAP APP HERE */}
      <App />
    </DataProvider>
  </React.StrictMode>
);