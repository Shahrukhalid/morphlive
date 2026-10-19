import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('desktop renderer sandbox and isolation remain enabled',()=>{const s=read('apps/desktop/electron/main.cjs');assert.match(s,/sandbox: true/);assert.match(s,/contextIsolation: true/);assert.match(s,/nodeIntegration: false/);assert.match(s,/setPermissionRequestHandler/);assert.match(s,/onBeforeRequest/);});
test('media pipeline has no upload or recording primitive',()=>{for(const p of ['apps/desktop/src/App.tsx','apps/desktop/src/audio/engine.ts'])assert.doesNotMatch(read(p),/MediaRecorder|XMLHttpRequest|WebSocket|sendBeacon|fetch\(/);});
test('neural tracking loss keeps the output black',()=>{assert.match(read('native/morphlive_engine/faceswap.py'),/return np.zeros_like\(rgb\)/);assert.match(read('apps/desktop/src/App.tsx'),/No face · output blanked/);});
