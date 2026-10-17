export type Mode = 'original' | 'studio' | 'mask' | 'avatar' | 'privacy';
export type Persona = { id: string; name: string; tag: string; color: string; mode: Mode; pitch: number; formant: number; robot: number; glyph: string; description: string };
export const personas: Persona[] = [
  { id: 'neutral', name: 'Neutral Studio', tag: 'STUDIO', color: '#b4a5ff', mode: 'studio', pitch: 0, formant: 0, robot: 0, glyph: '◉', description: 'Clean color, natural voice' },
  { id: 'atlas', name: 'Atlas', tag: 'MASCULINE CHARACTER', color: '#7da6ff', mode: 'mask', pitch: -3, formant: -2, robot: 0, glyph: '⬡', description: 'Sapphire visor · warm resonance' },
  { id: 'nova', name: 'Nova', tag: 'FEMININE CHARACTER', color: '#f29cc5', mode: 'mask', pitch: 3, formant: 2, robot: 0, glyph: '✧', description: 'Rose mask · bright resonance' },
  { id: 'orbit', name: 'Orbit', tag: 'CARTOON', color: '#f3c574', mode: 'avatar', pitch: 5, formant: 2, robot: 0, glyph: '◎', description: 'Expressive original character' },
  { id: 'cyber', name: 'Cyber', tag: 'ROBOT', color: '#7ee8cf', mode: 'mask', pitch: -2, formant: -1, robot: .8, glyph: '▣', description: 'Reactive visor · ring modulation' },
  { id: 'ghost', name: 'Ghost', tag: 'PRIVACY', color: '#c1c6d5', mode: 'privacy', pitch: -4, formant: -2, robot: .15, glyph: '◌', description: 'Full-frame anonymous avatar' },
];
export const voices = [
  { id: 'natural', name: 'Natural', pitch: 0, formant: 0, robot: 0 },
  { id: 'warm', name: 'Warm / deep', pitch: -3, formant: -2, robot: 0 },
  { id: 'bright', name: 'Bright / airy', pitch: 3, formant: 2, robot: 0 },
  { id: 'cartoon', name: 'Cartoon', pitch: 5, formant: 2, robot: 0 },
  { id: 'robot', name: 'Robot', pitch: -2, formant: -1, robot: .8 },
];
export type Settings = { persona: string; autoVoice: boolean; pitch: number; formant: number; robot: number; gain: number; intensity: number; disclosure: boolean; gate: boolean; profile: string; debug: boolean; offset: number; custom: { name: string; persona: string; pitch: number; formant: number; robot: number }[] };
export const defaults: Settings = { persona: 'neutral', autoVoice: true, pitch: 0, formant: 0, robot: 0, gain: 1, intensity: .65, disclosure: true, gate: false, profile: 'Balanced', debug: false, offset: 0, custom: [] };
export function loadSettings(): Settings {
  try {
    const saved = JSON.parse(window.morphPreferences?.load() || localStorage.getItem('morphlive.settings.v1') || '{}');
    const value = { ...defaults };
    for (const key of ['autoVoice','disclosure','gate','debug'] as const) if (typeof saved[key] === 'boolean') value[key] = saved[key];
    for (const [key, min, max] of [['pitch',-12,12],['formant',-6,6],['robot',0,1],['gain',0,2],['intensity',0,1],['offset',0,250]] as const) if (Number.isFinite(saved[key])) value[key] = Math.min(max, Math.max(min, saved[key]));
    if (personas.some(p => p.id === saved.persona)) value.persona = saved.persona;
    if (['Performance','Balanced','Quality','Auto'].includes(saved.profile)) value.profile = saved.profile;
    if (Array.isArray(saved.custom)) value.custom = saved.custom.slice(0,20).filter((p: Settings['custom'][number]) => typeof p.name === 'string' && p.name.length <= 40 && personas.some(a => a.id === p.persona) && Number.isFinite(p.pitch) && Math.abs(p.pitch) <= 12 && Number.isFinite(p.formant) && Math.abs(p.formant) <= 6 && Number.isFinite(p.robot) && p.robot >= 0 && p.robot <= 1);
    return value;
  } catch { return { ...defaults }; }
}
