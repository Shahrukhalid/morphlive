/// <reference types="vite/client" />

interface Window { morphPreferences?: { load(): string; save(serialized: string): Promise<boolean> } }
