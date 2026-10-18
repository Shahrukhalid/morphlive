import { readdirSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
const excluded=new Set(['node_modules','.git','dist','release','.cache','wasm','artifacts','.venv','.runtime','__pycache__']);
const patterns=[[/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,'private key'],[/\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{30,})\b/,'access token'],[/\bAKIA[A-Z0-9]{16}\b/,'cloud access key'],[/\bsk-(?:proj-)?[a-zA-Z0-9_-]{32,}\b/,'API key'],[/\/(?:Users|home)\/[a-zA-Z][a-zA-Z0-9._-]*\//,'personal absolute path'],[/\b[A-Z0-9._%+-]+@(?!users\.noreply\.github\.com)[A-Z0-9.-]+\.(?:com|net|org|edu|pk)\b/i,'private email address']];
const findings=[];let files=0;
function scan(text,label){for(const [pattern,name]of patterns)if(pattern.test(text))findings.push(`${label}: ${name}`);}
function walk(dir){for(const entry of readdirSync(dir,{withFileTypes:true})){if(excluded.has(entry.name)||entry.name==='face_landmarker.task')continue;const file=path.join(dir,entry.name);if(entry.isSymbolicLink())continue;if(entry.isDirectory())walk(file);else{if(/\.(wav|mp4|mov|pem|key|onnx|task|pt|pth|safetensors)$/i.test(entry.name))findings.push(`${file}: private or model asset`);if(/\.(?:md|json|js|mjs|cjs|ts|tsx|py|yml|yaml|html|css|txt)$/.test(entry.name)||['LICENSE','.gitignore'].includes(entry.name)){scan(readFileSync(file,'utf8'),file);files++;}}}}
walk('.');
// Ignored runtime directories must never become publishable via a forced add.
try { for(const file of execFileSync('git',['ls-files','--cached'],{encoding:'utf8'}).trim().split('\n'))if(/^(?:\.runtime|\.venv)\//.test(file)||/\.(?:pth|pt|safetensors|pyc)$/i.test(file))findings.push(`${file}: runtime or model asset tracked in Git`); } catch {}
try { const commits=execFileSync('git',['rev-list','--all'],{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim().split('\n').filter(Boolean);for(const sha of commits){const content=execFileSync('git',['show','--format=fuller','--no-ext-diff',sha],{encoding:'utf8',maxBuffer:20_000_000});scan(content.replace(/GitHub <noreply@github\.com>/g,'GitHub <[service]>').replace(/Signed-off-by: dependabot\[bot\] <support@github\.com>/g,'[Dependabot service signature]'),`history ${sha.slice(0,8)}`);} } catch(e){if(!String(e).includes('rev-list'))throw e;}
if(findings.length){console.error(findings.join('\n'));process.exit(1);}console.log(`Privacy scan passed: ${files} source/document files plus available Git history. Manual review still required for context-dependent secrets.`);
