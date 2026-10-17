import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
const lock=JSON.parse(readFileSync('package-lock.json','utf8'));
const rows=[];
for(const [name,pkg]of Object.entries(lock.packages)){if(!name||pkg.dev)continue;const file=path.join(name,'package.json');if(!existsSync(file))continue;const data=JSON.parse(readFileSync(file,'utf8'));rows.push({name:data.name,version:data.version,license:data.license||'REVIEW REQUIRED'});}
console.log(JSON.stringify(rows,null,2));
if(rows.some(r=>r.license==='REVIEW REQUIRED'))process.exitCode=1;
