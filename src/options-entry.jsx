import React from 'react';
import ReactDOM from 'react-dom/client';
import Options from './pages/Options';
import { initializeTheme } from './utils/theme';
import './styles/index.css';

// Initialize theme BEFORE React renders
initializeTheme();

// Create React root and render
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <Options />
    </React.StrictMode>
);