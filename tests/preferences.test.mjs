import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const {validatePreferences}=createRequire(import.meta.url)('../apps/desktop/electron/preferences.cjs');
const valid={persona:'nova',autoVoice:true,pitch:3,formant:2,robot:0,gain:1,intensity:.65,disclosure:true,gate:false,profile:'Balanced',debug:false,offset:0,custom:[]};
test('native preference schema preserves valid settings',()=>assert.deepEqual(JSON.parse(validatePreferences(JSON.stringify(valid))),valid));
test('preference boundary rejects oversized, unknown, and malformed payloads',()=>{for(const data of ['x'.repeat(20000),'null','[]','not json',JSON.stringify({...valid,path:'unexpected'}),JSON.stringify({...valid,pitch:100}),JSON.stringify({...valid,custom:[{name:'x',persona:'unknown'}]})])assert.equal(validatePreferences(data),null);});
test('native preferences accept bounded custom pairings',()=>{const saved={...valid,custom:[{name:'Studio pair',persona:'atlas',pitch:-3,formant:-2,robot:0}]};assert.deepEqual(JSON.parse(validatePreferences(JSON.stringify(saved))),saved);});
