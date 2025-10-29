import React from 'react';
import ReactDOM from 'react-dom/client';
import Popup from './pages/Popup';
import { initializeTheme } from './utils/theme';
import './styles/index.css';

// Initialize theme BEFORE React renders
initializeTheme();

// Create React root and render
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <Popup />
    </React.StrictMode>
);