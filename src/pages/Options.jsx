import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun, Monitor } from 'lucide-react';
import { usePreferences } from '../hooks/useChromeStorage';
import PersonaSelector from '../components/PersonaSelector';

// Apply theme to document
function applyTheme(theme) {
    const root = document.documentElement;

    if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        root.classList.toggle('dark', systemTheme === 'dark');
    } else {
        root.classList.toggle('dark', theme === 'dark');
    }
}

export default function Options() {
    const { preferences, setPreferences, loading } = usePreferences();
    const [saved, setSaved] = useState(false);

    // Apply theme whenever preferences change
    useEffect(() => {
        if (preferences?.theme) {
            applyTheme(preferences.theme);
        }
    }, [preferences?.theme]);

    // Listen for system theme changes
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
            if (preferences?.theme === 'system') {
                applyTheme('system');
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [preferences?.theme]);

    const handleThemeChange = (theme) => {
        const newPreferences = { ...preferences, theme };
        setPreferences(newPreferences);
        applyTheme(theme);
    };

    const handleSave = async () => {
        await setPreferences(preferences);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    if (loading) {
        return <div className="p-8">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
            <div className="container max-w-4xl mx-auto px-6 py-12">
                <h1 className="text-3xl font-bold mb-8 text-neutral-900 dark:text-neutral-100">
                    Settings
                </h1>

                <div className="space-y-8">
                    {/* Persona Selection */}
                    <section className="card">
                        <h2 className="text-xl font-semibold mb-4 text-neutral-900 dark:text-neutral-100">
                            AI Persona
                        </h2>
                        <PersonaSelector
                            selectedPersona={preferences?.persona || 'strategist'}
                            onSelect={(persona) => setPreferences({ ...preferences, persona })}
                        />
                    </section>

                    {/* Theme Selection */}
                    <section className="card">
                        <h2 className="text-xl font-semibold mb-4 text-neutral-900 dark:text-neutral-100">
                            Appearance
                        </h2>
                        <div className="flex gap-4">
                            <ThemeOption
                                icon={<Sun className="w-5 h-5" />}
                                label="Light"
                                active={preferences?.theme === 'light'}
                                onClick={() => handleThemeChange('light')}
                            />
                            <ThemeOption
                                icon={<Moon className="w-5 h-5" />}
                                label="Dark"
                                active={preferences?.theme === 'dark'}
                                onClick={() => handleThemeChange('dark')}
                            />
                            <ThemeOption
                                icon={<Monitor className="w-5 h-5" />}
                                label="System"
                                active={preferences?.theme === 'system'}
                                onClick={() => handleThemeChange('system')}
                            />
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

function ThemeOption({ icon, label, active, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                active
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'
            }`}
        >
            {icon}
            <span className="font-medium">{label}</span>
        </button>
    );
}