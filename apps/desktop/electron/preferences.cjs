const ids = new Set(['neutral','atlas','nova','orbit','cyber','ghost']);
const ranges = { pitch:[-12,12], formant:[-6,6], robot:[0,1], gain:[0,2], intensity:[0,1], offset:[0,250] };
function validatePreferences(serialized) {
  if (typeof serialized !== 'string' || serialized.length > 16384) return null;
  try {
    const s=JSON.parse(serialized);
    if (!s || typeof s !== 'object' || Array.isArray(s)) return null;
    const allowed=new Set(['persona','autoVoice','pitch','formant','robot','gain','intensity','disclosure','gate','profile','debug','offset','custom']);
    if(Object.keys(s).some(k=>!allowed.has(k)) || !ids.has(s.persona))return null;
    for(const key of ['autoVoice','disclosure','gate','debug'])if(typeof s[key]!=='boolean')return null;
    for(const [key,[min,max]] of Object.entries(ranges))if(!Number.isFinite(s[key]) || s[key]<min || s[key]>max)return null;
    if(!['Performance','Balanced','Quality','Auto'].includes(s.profile))return null;
    if(!Array.isArray(s.custom)||s.custom.length>20)return null;
    for(const p of s.custom){
      if(!p||typeof p!=='object'||Object.keys(p).some(k=>!['name','persona','pitch','formant','robot'].includes(k)))return null;
      if(typeof p.name!=='string'||p.name.length>40||!ids.has(p.persona))return null;
      for(const key of ['pitch','formant','robot']){const [min,max]=ranges[key];if(!Number.isFinite(p[key])||p[key]<min||p[key]>max)return null;}
    }
    return JSON.stringify(s);
  } catch { return null; }
}
module.exports={validatePreferences};
