import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, rename, rm } from 'node:fs/promises';
const url='https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
const expected='64184e229b263107bc2b804c6625db1341ff2bb731874b0bcc2fe6544e0bc9ff';
const target=new URL('../apps/desktop/public/models/face_landmarker.task',import.meta.url);
const hash=data=>createHash('sha256').update(data).digest('hex');
try { if(hash(await readFile(target))===expected){console.log('Verified local face model already installed.');process.exit(0);} } catch {}
console.log('User-requested download: official Google MediaPipe Face Landmarker, float16 v1. No camera or microphone data is sent.');
const response=await fetch(url,{signal:AbortSignal.timeout(90000),redirect:'error'});
if(!response.ok)throw new Error(`Model download failed: HTTP ${response.status}`);
const data=Buffer.from(await response.arrayBuffer());
if(data.length>10_000_000||hash(data)!==expected)throw new Error('Model checksum mismatch. Refusing installation.');
await mkdir(new URL('../apps/desktop/public/models/',import.meta.url),{recursive:true});
const temporary=new URL(target.href+'.tmp');
try { await writeFile(temporary,data,{mode:0o600});await rename(temporary,target); } finally { await rm(temporary,{force:true}); }
console.log('Installed and SHA-256 verified. Run npm run build before launching desktop.');
