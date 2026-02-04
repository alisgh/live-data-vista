import React from 'react';
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import Watering2 from './components/Watering2';

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
    <Watering2 />
  </React.StrictMode>
);
