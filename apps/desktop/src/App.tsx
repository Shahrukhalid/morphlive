import { useEffect, useRef, useState } from 'react';
import { Activity, AudioLines, Camera, Check, ChevronRight, CircleHelp, Cpu, Download, Headphones, Layers, LockKeyhole, Mic, MicOff, MonitorUp, Play, Power, Radio, RefreshCw, Settings2, ShieldCheck, SlidersHorizontal, Sparkles, Square, Video, Waves, X } from 'lucide-react';
import { defaults, loadSettings, personas, voices, type Settings } from './presets';
import { AudioEngine } from './audio/engine';
import { renderEffect, type Point } from './video/effects';

type Device = { deviceId: string; label: string; kind: MediaDeviceKind };
type Metrics = { fps: number; process: number; dropped: number; tracking: number; audio: number; level: number };
const initialMetrics: Metrics = { fps: 0, process: 0, dropped: 0, tracking: 0, audio: 0, level: 0 };
const message = (e: unknown) => e instanceof Error ? e.message : 'An unexpected device error occurred.';
export function App() {
  const [settings, setSettings] = useState(loadSettings);
  const [tab, setTab] = useState('Studio');
  const [devices, setDevices] = useState<Device[]>([]);
  const [camera, setCamera] = useState(''); const [microphone, setMicrophone] = useState(''); const [sink, setSink] = useState('');
  const [cameraOn, setCameraOn] = useState(false); const [audioOn, setAudioOn] = useState(false);
  const [cameraBusy, setCameraBusy] = useState(false); const [audioBusy, setAudioBusy] = useState(false);
  const [muted, setMuted] = useState(false); const [original, setOriginal] = useState(false);
  const [tracking, setTracking] = useState('Idle'); const [error, setError] = useState('');
  const [metrics, setMetrics] = useState(initialMetrics); const [outputOn, setOutputOn] = useState(false);
  const [help, setHelp] = useState(false); const [consent, setConsent] = useState(false); const [presetName, setPresetName] = useState('');
  const canvas = useRef<HTMLCanvasElement>(null); const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null); const worker = useRef<Worker | null>(null);
  const engine = useRef(new AudioEngine()); const frame = useRef(0); const busyTracking = useRef(false);
  const points = useRef<Point[]>([]); const pointTime = useRef(0); const trackerReady = useRef(false);
  const liveSettings = useRef(settings); const liveOriginal = useRef(original);
  const outputPending = useRef(false);
  const projector = useRef<Window | null>(null); const channel = useRef<BroadcastChannel | null>(null);
  const captureGeneration = useRef(0); const audioGeneration = useRef(0);
  const activePersona = personas.find(p => p.id === settings.persona)!;
  liveSettings.current = settings; liveOriginal.current = original;
  const update = (patch: Partial<Settings>) => setSettings(s => ({ ...s, ...patch }));
  const refresh = async () => { try { setDevices((await navigator.mediaDevices.enumerateDevices()).map(d => ({ deviceId: d.deviceId, label: d.label, kind: d.kind }))); } catch (e) { setError(message(e)); } };
  useEffect(() => {
    void refresh(); navigator.mediaDevices.addEventListener('devicechange', refresh);
    channel.current = new BroadcastChannel('morphlive-output');
    channel.current.onmessage = event => { if(event.data.type === 'ack' || event.data.type === 'ready') outputPending.current=false; if(event.data.type === 'emergency') emergency(); };
    return () => { stopCamera(); stopAudio(); channel.current?.close(); projector.current?.close(); navigator.mediaDevices.removeEventListener('devicechange', refresh); };
  }, []);
  useEffect(() => { try { const serialized=JSON.stringify(settings); localStorage.setItem('morphlive.settings.v1', serialized); void window.morphPreferences?.save(serialized).then(saved=>{if(!saved)setError('Preferences could not be saved to disk.');}); } catch { setError('Settings could not be saved. Check available disk space.'); } }, [settings]);
  useEffect(() => { engine.current.configure({ pitch: settings.pitch, formant: settings.formant, robot: settings.robot, gain: settings.gain, gate: settings.gate, muted, bypass: original }, settings.offset); }, [settings, muted, original, audioOn]);
  useEffect(() => {
    const handler = () => { stopCamera(); stopAudio(); };
    const keys = (e: KeyboardEvent) => { if (e.key === 'Escape') emergency(); };
    window.addEventListener('beforeunload',handler); window.addEventListener('keydown',keys);
    return () => { window.removeEventListener('beforeunload',handler); window.removeEventListener('keydown',keys); };
  }, []);
  useEffect(() => {
    if (!audioOn) return;
    const timer = setInterval(() => { if (!engine.current.stream) { setAudioOn(false); setError('Microphone disconnected. Refresh devices and start it again.'); } }, 1000);
    return () => clearInterval(timer);
  }, [audioOn]);
  function stopCamera() {
    captureGeneration.current++; cancelAnimationFrame(frame.current);
    stream.current?.getTracks().forEach(t => t.stop()); stream.current = null;
    worker.current?.terminate(); worker.current = null; busyTracking.current = false; trackerReady.current = false; points.current = [];
    if (video.current) video.current.srcObject = null;
    const ctx = canvas.current?.getContext('2d'); if (ctx) { ctx.fillStyle='#10131b'; ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height); }
    channel.current?.postMessage({ type: 'stop' }); setCameraOn(false); setCameraBusy(false); setTracking('Idle'); setMetrics(m => ({ ...m, fps: 0, process: 0, tracking: 0 }));
  }
  function stopAudio() { audioGeneration.current++; engine.current.stop(); setAudioOn(false); setAudioBusy(false); setMetrics(m => ({ ...m, level: 0, audio: 0 })); }
  function emergency() { stopCamera(); stopAudio(); projector.current?.close(); projector.current=null; setOutputOn(false); setOriginal(false); setError('Emergency stop: all capture tracks and outputs are closed.'); }
  async function startCamera() {
    if (!consent) { setError('Confirm the local capture consent below before starting a device.'); return; }
    stopCamera(); const generation = captureGeneration.current; setCameraBusy(true); setError('');
    try {
      const s = liveSettings.current; const width = s.profile === 'Performance' ? 640 : s.profile === 'Quality' ? 1920 : 1280;
      const captured = await navigator.mediaDevices.getUserMedia({ video: { deviceId: camera ? { exact: camera } : undefined, width: { ideal: width }, height: { ideal: width*9/16 }, frameRate: { ideal: 30, max: 30 } } });
      if (generation !== captureGeneration.current) { captured.getTracks().forEach(t => t.stop()); return; }
      stream.current=captured;
      captured.getVideoTracks()[0].onended = () => { stopCamera(); setError('Camera disconnected or permission revoked. Refresh devices and start again.'); };
      video.current!.srcObject = captured; await video.current!.play();
      if (generation !== captureGeneration.current) return;
      const actual = captured.getVideoTracks()[0].getSettings(); canvas.current!.width = actual.width || width; canvas.current!.height = actual.height || width*9/16;
      setCameraOn(true); setCameraBusy(false); await refresh(); setTracking('Loading local model…');
      const tracker = new Worker(new URL('./video/tracker.worker.ts', import.meta.url)); worker.current=tracker;
      tracker.onmessage = event => {
        if (generation !== captureGeneration.current) return;
        if (event.data.type === 'ready') { trackerReady.current=true; setTracking('Searching for face'); }
        else if (event.data.type === 'result') { points.current=event.data.points; pointTime.current=performance.now(); busyTracking.current=false; setTracking(points.current.length ? 'Face tracked' : 'No face detected'); setMetrics(m => ({ ...m, tracking: performance.now()-event.data.timestamp })); }
        else { trackerReady.current=false; busyTracking.current=false; setTracking('Unavailable'); setError(event.data.message); }
      };
      tracker.onerror = () => { trackerReady.current=false; busyTracking.current=false; setTracking('Unavailable'); setError('Tracking worker stopped. Stop and restart the camera to retry.'); };
      tracker.postMessage({ type: 'init', base: new URL('./',location.href).href });
      let lastRender=0, lastTrack=0, lastOutput=0, lastStats=performance.now(), count=0, total=0, dropped=0, lastVideoTime=-1, outputBusy=false;
      const render = (now: number) => {
        if (generation !== captureGeneration.current || !stream.current) return;
        frame.current=requestAnimationFrame(render);
        const input=video.current!, target=canvas.current!, ctx=target.getContext('2d')!;
        if (now-lastRender<1000/30-1 || input.readyState<2 || input.currentTime===lastVideoTime) return;
        if (lastRender && now-lastRender>70) dropped += Math.max(0,Math.floor((now-lastRender)/(1000/30))-1);
        lastRender=now; lastVideoTime=input.currentTime;
        if (busyTracking.current && now-lastTrack>2500) { tracker.terminate(); trackerReady.current=false; busyTracking.current=false; points.current=[]; setTracking('Tracking timed out'); setError('Face tracker timed out. Stop and restart camera. Privacy output remains anonymous.'); }
        const s=liveSettings.current; const p=personas.find(p => p.id===s.persona)!;
        const validPoints=now-pointTime.current<400 ? points.current : [];
        const start=performance.now(); renderEffect(ctx,input,p,validPoints,s.intensity,s.debug,liveOriginal.current,s.disclosure); total+=performance.now()-start; count++;
        if (trackerReady.current && !busyTracking.current && now-lastTrack > (s.profile==='Performance' ? 100 : 65)) {
          busyTracking.current=true; lastTrack=now;
          void createImageBitmap(input,{ resizeWidth: 640, resizeHeight: Math.round(640*target.height/target.width) }).then(bitmap => {
            if (generation !== captureGeneration.current) { bitmap.close(); return; }
            tracker.postMessage({ type:'frame', bitmap, timestamp: performance.now() },[bitmap]);
          }).catch(() => { busyTracking.current=false; });
        }
        if (projector.current && !projector.current.closed && now-lastOutput>65 && !outputBusy && !outputPending.current) {
          outputBusy=true; outputPending.current=true; lastOutput=now;
          void createImageBitmap(target).then(bitmap => { if(generation===captureGeneration.current) channel.current?.postMessage({ type:'frame', bitmap }); else outputPending.current=false; bitmap.close(); }).catch(() => { outputPending.current=false; setError('Output window stopped receiving frames. Reopen it.'); }).finally(() => { outputBusy=false; });
        }
        if (now-lastStats>1000) {
          const measuredFps=count*1000/(now-lastStats), measuredProcess=total/Math.max(count,1), measuredDropped=dropped;
          setMetrics(m=>({ ...m, fps: measuredFps, process: measuredProcess, dropped: measuredDropped }));
          if (s.profile==='Auto' && count<22 && target.width>640) { target.width=640; target.height=Math.round(640*(actual.height||720)/(actual.width||1280)); }
          count=0; total=0; lastStats=now;
        }
      };
      frame.current=requestAnimationFrame(render);
    } catch (e) { if (generation===captureGeneration.current) { stopCamera(); setError('Camera: '+message(e)); } }
  }
  async function startAudio() {
    if (!consent) { setError('Confirm local capture consent before starting a device.'); return; }
    setAudioBusy(true); setError(''); const generation=++audioGeneration.current;
    try {
      await engine.current.start(microphone,sink,(level,audio) => setMetrics(m=>({ ...m,level,audio })));
      if (generation !== audioGeneration.current) { engine.current.stop(); return; }
      setAudioOn(true); setAudioBusy(false); await refresh();
    } catch (e) { if (generation===audioGeneration.current) { stopAudio(); setError('Microphone: '+message(e)); } }
  }
  function selectPersona(id: string) {
    const p=personas.find(p=>p.id===id); if (!p) return;
    update({ persona:id, ...(settings.autoVoice ? { pitch:p.pitch,formant:p.formant,robot:p.robot } : {}) }); setOriginal(false);
  }
  function openOutput() {
    if (projector.current && !projector.current.closed) { projector.current.focus(); return; }
    projector.current=window.open(new URL('?output=1',location.href).href,'MorphLive Output','width=1280,height=720');
    if (!projector.current) { setError('Output window blocked. Allow local popup windows.'); return; }
    outputPending.current=false; setOutputOn(true);
  }
  function diagnostics() {
    const data={ app:'MorphLive',version:'0.1.0', metrics, cameraActive:cameraOn,audioActive:audioOn,tracking,persona:settings.persona, profile:settings.profile, outputWindow:!!projector.current&&!projector.current.closed, note:'Device names, identifiers, personal paths, and media are excluded. Latency is an estimate, not an end-to-end measurement.' };
    const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})); const a=document.createElement('a'); a.href=url; a.download='morphlive-diagnostics.json'; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  const options = (kind: MediaDeviceKind) => devices.filter(d=>d.kind===kind).map((d,i)=><option key={d.deviceId || i} value={d.deviceId}>{d.label || `${kind==='videoinput'?'Camera':kind==='audioinput'?'Microphone':'Output'} ${i+1}`}</option>);
  const deviceSelect = (label:string, kind:MediaDeviceKind, value:string, setter:(v:string)=>void, active:boolean) => <label className="field">{label}<select value={value} disabled={active} onChange={e=>setter(e.target.value)}><option value="">{kind==='audiooutput'?'Select headphones or virtual cable':'System default'}</option>{kind==='audiooutput'&&<option value="__silent__">Silent processing (no playback)</option>}{options(kind)}</select></label>;
  const slider = (label:string,key:'pitch'|'formant'|'gain'|'intensity'|'offset',min:number,max:number,step:number,suffix:string) => <label className="range"><span>{label}<b>{settings[key].toFixed(step<1?2:0)}{suffix}</b></span><input type="range" min={min} max={max} step={step} value={settings[key]} onChange={e=>update({[key]:Number(e.target.value),...(['pitch','formant'].includes(key)?{autoVoice:false}:{})})}/></label>;
  return <div className="app-shell">
    <aside className="sidebar"><a className="brand" href="#"><span className="brand-icon"><Waves size={23}/></span><span>morph<span className="brand-light">live</span><small>YOUR LOCAL REALITY STUDIO</small></span></a>
      <div className="workspace-label">WORKSPACE</div><nav>{[['Studio',Layers],['Voice lab',AudioLines],['Devices',Video],['Settings',Settings2]].map(([name,Icon])=><button key={name as string} className={tab===name?'nav active':'nav'} onClick={()=>setTab(name as string)}><Icon size={19}/>{name as string}{tab===name&&<span className="nav-dot"/>}</button>)}</nav>
      <div className="side-note"><div className="orbit-mark">◎</div><h3>A different you.<br/>Entirely on your device.</h3><p>No accounts. No cloud processing. Just your imagination.</p><span><LockKeyhole size={12}/> LOCAL-FIRST BY DESIGN</span></div>
      <div className="side-bottom"><button className="nav" onClick={()=>setHelp(true)}><CircleHelp size={18}/> Setup & routing</button><div className="version"><span className="dot green"/> MorphLive <span>v0.1.0 · preview</span></div></div>
    </aside>
    <main><header><div className="breadcrumb">Workspace <ChevronRight size={13}/><span>{tab}</span></div><div className="header-right"><span className="privacy-pill"><ShieldCheck size={14}/> On-device processing</span><button className="icon-button" title="Download redacted diagnostics" onClick={diagnostics}><Download size={17}/></button></div></header>
      <div className="page-title"><div><div className="eyebrow">MAKE YOURSELF SOMETHING NEW</div><h1>{tab==='Studio'?'Your transformation studio':tab==='Voice lab'?'Find your frequency':tab==='Devices'?'Connect your studio':'Make it yours'}<span>.</span></h1><p>{tab==='Studio'?'A new look. A different voice. Still entirely you.':tab==='Voice lab'?'Local DSP, independent pitch and spectral resonance controls.':tab==='Devices'?'Choose your inputs and build a route to your next call.':'Fine-tune performance, privacy, and your personal presets.'}</p></div><button className="emergency" onClick={emergency}><Power size={15}/> Emergency stop <kbd>esc</kbd></button></div>
      {error&&<div role="alert" className="alert"><span>{error}</span><button aria-label="Dismiss notification" onClick={()=>setError('')}><X size={15}/></button></div>}
      <div className={tab==='Studio'?'studio-grid':'studio-grid secondary'}>
        <section className="preview-column" style={tab==='Studio'?{}:{display:'none'}}>
          <div className="panel preview-panel"><div className="panel-heading"><span><span className={'dot '+(cameraOn?'green':'')}/> LIVE PREVIEW</span><span className="subtle">{cameraOn?`${canvas.current?.width} × ${canvas.current?.height}`:'CAMERA OFF'} <span className="divider">/</span> LOCAL</span></div>
            <div className="preview-stage"><canvas ref={canvas} width={1280} height={720}/><video ref={video} autoPlay muted playsInline className={cameraOn?'raw-preview':'hidden'} />
              {!cameraOn&&<div className="empty-preview"><div className="scan-frame"><Camera size={36} strokeWidth={1}/><i/><i/><i/><i/></div><h2>Your next persona starts here</h2><p>Start your camera to see your live transformation.<br/>Your video stays on this device.</p><button className="primary" disabled={cameraBusy} onClick={startCamera}><Camera size={16}/>{cameraBusy?'Connecting…':'Start camera'}</button><small>Explicit permission. Always.</small></div>}
              {cameraOn&&<><div className="live-tag"><span className="dot green"/> LIVE <span>{original?'Original camera':activePersona.name}</span></div><div className="tracking-tag"><Activity size={13}/>{tracking}</div><button className={'compare '+(original?'selected':'')} onClick={()=>setOriginal(v=>!v)}>{original?'Show transformation':'View original'}</button></>}
            </div>
            <div className="preview-toolbar"><div className="capture-controls"><button className={cameraOn?'tool enabled':'tool'} onClick={cameraOn?stopCamera:startCamera} disabled={cameraBusy} title={cameraOn?'Stop camera':'Start camera'}><Camera size={18}/></button><button className={audioOn?'tool enabled':'tool'} onClick={audioOn?()=>setMuted(v=>!v):startAudio} disabled={audioBusy} title={audioOn?'Toggle mute':'Start microphone'}>{muted?<MicOff size={18}/>:<Mic size={18}/>}</button><div className="mini-meter">{Array.from({length:12},(_,i)=><i key={i} style={{background:audioOn&&!muted&&metrics.level>i/15?'#72e9c1':undefined}}/>)}</div><span className="subtle">{audioOn?(muted?'Muted':'Microphone active'):'Microphone off'}</span></div><button className="text-button" onClick={openOutput}><MonitorUp size={15}/> Open output</button></div>
          </div>
          <div className="metrics">{[[Activity,'FRAME RATE',cameraOn?metrics.fps.toFixed(1):'—','fps'],[Cpu,'RENDER TIME',cameraOn?metrics.process.toFixed(1):'—','ms'],[AudioLines,'AUDIO LATENCY',audioOn?metrics.audio.toFixed(0):'—','ms est.'],[ShieldCheck,'PROCESSING','100','% local']].map(([Icon,label,value,unit])=><div className="metric" key={label as string}><span><Icon size={14}/>{label as string}</span><strong>{value as string}<small>{unit as string}</small></strong></div>)}</div>
          <div className="panel output-panel"><div className="section-heading"><span className="small-icon"><Radio size={18}/></span><div><h3>Take it to your next call</h3><p>Route your transformed feed into your favorite apps.</p></div><button className="text-button" onClick={()=>setHelp(true)}>Setup guide <ChevronRight size={14}/></button></div><div className="route-row"><div><Video size={17}/><span>Virtual camera<small>OBS window capture → OBS Virtual Camera</small></span></div><span className="badge">{outputOn&&projector.current&&!projector.current.closed?'WINDOW OPEN':'SETUP REQUIRED'}</span></div><div className="route-row"><div><Headphones size={17}/><span>Virtual microphone<small>Choose an installed virtual audio device</small></span></div><span className="badge">{audioOn?(sink==='__silent__'?'SILENT DSP':'AUDIO ROUTED'):'SELECT OUTPUT'}</span></div><div className="app-list"><span>Works through standard device routes</span><b>zoom</b><b>Meet</b><b>Teams</b><small>Call compatibility unverified</small></div></div>
        </section>
        <section className="controls-column">
          {(tab==='Studio'||tab==='Settings')&&<div className="panel persona-panel"><div className="section-title"><h2><Sparkles size={18}/> Choose your persona</h2><span className="count">06</span></div><p className="panel-description">Original characters. A whole new presence.</p><div className="persona-grid">{personas.map(p=><button key={p.id} className={'persona '+(settings.persona===p.id?'chosen':'')} onClick={()=>selectPersona(p.id)} style={{'--persona':p.color} as React.CSSProperties}><div className={'persona-art '+p.id}><span>{p.glyph}</span><div className="character-head"><i/><i/><em/></div>{settings.persona===p.id&&<b><Check size={12}/></b>}</div><strong>{p.name}</strong><small>{p.tag}</small></button>)}</div><div className="persona-description"><span className="dot" style={{background:activePersona.color}}/>{activePersona.description}</div>{slider('Effect intensity','intensity',0,1,.01,'')}<label className="toggle-row"><span><Layers size={15}/>Landmark debug overlay</span><input type="checkbox" checked={settings.debug} onChange={e=>update({debug:e.target.checked})}/></label></div>}
          {(tab==='Studio'||tab==='Voice lab')&&<div className="panel voice-panel"><div className="section-title"><h2><AudioLines size={18}/> Voice pairing</h2><span className="tiny-label">LIVE DSP</span></div><label className="toggle-row pairing"><span>Match voice to persona<small>Editable character settings, independent of identity</small></span><input type="checkbox" checked={settings.autoVoice} onChange={e=>{if(e.target.checked) update({autoVoice:true,pitch:activePersona.pitch,formant:activePersona.formant,robot:activePersona.robot}); else update({autoVoice:false});}}/></label><label className="field">Voice preset<select value="" onChange={e=>{const v=voices.find(v=>v.id===e.target.value); if(v) update({pitch:v.pitch,formant:v.formant,robot:v.robot,autoVoice:false});}}><option value="">{settings.autoVoice?activePersona.name+' · linked voice':'Custom / manual voice'}</option>{voices.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}</select></label>{slider('Pitch','pitch',-12,12,1,' st')}{slider('Formant envelope','formant',-6,6,1,' st')}{tab==='Voice lab'&&<>{slider('Output gain','gain',0,2,.01,'×')}<label className="range"><span>Robot modulation<b>{Math.round(settings.robot*100)}%</b></span><input type="range" min="0" max="1" step="0.01" value={settings.robot} onChange={e=>update({robot:Number(e.target.value),autoVoice:false})}/></label><label className="toggle-row"><span>Soft noise gate</span><input type="checkbox" checked={settings.gate} onChange={e=>update({gate:e.target.checked})}/></label><p className="fine-print">Formants use a smoothed spectral envelope approximation. This is not voice cloning. Listen with headphones before routing to a call.</p><div className="button-row"><button className="primary" disabled={audioBusy} onClick={audioOn?stopAudio:startAudio}>{audioOn?<Square size={15}/>:<Mic size={15}/>} {audioOn?'Stop microphone':'Start microphone'}</button><button className="secondary-button" onClick={()=>setMuted(v=>!v)}>{muted?'Unmute':'Mute'}</button></div></>}<div className="voice-footer"><Waves size={16}/><span>{settings.autoVoice?'Voice follows your character':'Manual voice override active'}</span><span className="dot green"/></div></div>}
          {(tab==='Devices'||tab==='Voice lab')&&<div className="panel device-panel"><div className="section-title"><h2><SlidersHorizontal size={18}/> Device routing</h2><button className="icon-button" onClick={refresh} title="Refresh devices"><RefreshCw size={16}/></button></div>{deviceSelect('Camera input','videoinput',camera,setCamera,cameraOn||cameraBusy)}{deviceSelect('Microphone input','audioinput',microphone,setMicrophone,audioOn||audioBusy)}{deviceSelect('Processed audio output','audiooutput',sink,setSink,audioOn||audioBusy)}<p className="fine-print">Choose silent processing to test without playback, headphones for monitoring, BlackHole on macOS, or CABLE Input on Windows for calls. Stop audio before changing its route. Never route output back to the selected input.</p><div className="button-row"><button className="primary" disabled={cameraBusy} onClick={cameraOn?stopCamera:startCamera}><Camera size={15}/>{cameraOn?'Stop camera':'Start camera'}</button><button className="secondary-button" disabled={audioBusy} onClick={audioOn?stopAudio:startAudio}><Mic size={15}/>{audioOn?'Stop audio':'Start audio'}</button><button className="secondary-button" onClick={openOutput}><MonitorUp size={15}/>Output window</button></div>{slider('Additional audio delay','offset',0,250,1,' ms')}<p className="fine-print">Tune delay using a visible clap in the receiving app. Audio and video use separate conferencing device clocks; automatic drift correction is not implemented.</p></div>}
          {tab==='Settings'&&<><div className="panel"><div className="section-title"><h2><Cpu size={18}/> Performance & privacy</h2></div><label className="field">Performance profile<select value={settings.profile} onChange={e=>update({profile:e.target.value})}>{['Performance','Balanced','Quality','Auto'].map(p=><option key={p}>{p}</option>)}</select></label><p className="fine-print">Restart camera after changing profiles. Performance: 640 wide. Balanced: 720p target. Quality: 1080p target. Auto reduces canvas resolution under load. CPU face tracking; no GPU model claim.</p><label className="toggle-row"><span>Synthetic appearance disclosure</span><input type="checkbox" checked={settings.disclosure} onChange={e=>update({disclosure:e.target.checked})}/></label><button className="secondary-button" onClick={diagnostics}><Download size={15}/>Export redacted diagnostics</button><button className="danger-text" onClick={()=>setSettings({...defaults})}>Reset preferences</button></div><div className="panel"><div className="section-title"><h2><Layers size={18}/> Your saved pairings</h2></div><label className="field">Preset name<input value={presetName} maxLength={40} onChange={e=>setPresetName(e.target.value)} placeholder="e.g. Evening studio"/></label><button className="secondary-button" disabled={!presetName.trim()||settings.custom.length>=20} onClick={()=>{ update({custom:[...settings.custom,{name:presetName.trim(),persona:settings.persona,pitch:settings.pitch,formant:settings.formant,robot:settings.robot}]}); setPresetName('');}}>Save current appearance & voice</button>{settings.custom.map((p,i)=><div className="saved-preset" key={i}><button onClick={()=>update({persona:p.persona,pitch:p.pitch,formant:p.formant,robot:p.robot,autoVoice:false})}>{p.name}</button><button title="Delete preset" onClick={()=>update({custom:settings.custom.filter((_,j)=>i!==j)})}><X size={14}/></button></div>)}</div></>}
        </section>
      </div>
      <footer><label><input type="checkbox" checked={consent} onChange={e=>{setConsent(e.target.checked);if(!e.target.checked){stopCamera();stopAudio();}}}/><span>I have permission to transform this camera and voice input.</span></label><span><LockKeyhole size={12}/> No recording · No uploads · No telemetry</span></footer>
    </main>
    {help&&<div className="modal-scrim" onClick={()=>setHelp(false)}><section role="dialog" aria-modal="true" aria-label="Output routing setup" className="modal" onClick={e=>e.stopPropagation()}><button className="modal-close icon-button" aria-label="Close guide" onClick={()=>setHelp(false)}><X size={20}/></button><div className="eyebrow">FROM YOUR STUDIO TO YOUR CALL</div><h2>Connect your new presence.</h2><ol><li><b>Start a local preview.</b><p>Confirm consent, select devices in Devices, then start camera. Face tracking needs the optional local model installation described in README.</p></li><li><b>Send video through OBS.</b><p>Open the MorphLive Output window. In OBS add macOS Screen Capture (window mode) or Window Capture on Windows. Select MorphLive Output, fit to canvas, and start OBS Virtual Camera.</p></li><li><b>Route transformed audio.</b><p>Install BlackHole separately on macOS or VB-CABLE separately on Windows. Choose BlackHole 2ch or CABLE Input as MorphLive’s output. Choose the matching microphone device in your call. Never select the cable as MorphLive’s microphone.</p></li><li><b>Select devices in your call.</b><p>In Zoom, Meet, or Teams choose OBS Virtual Camera for camera and BlackHole 2ch / CABLE Output for microphone. Test a clap and adjust additional audio delay if needed.</p></li></ol><div className="notice">These are supported integration approaches, pending hands-on conferencing verification. This app does not install or provide native virtual device drivers. Output window targets about 15 FPS.</div><button className="primary" onClick={()=>{setHelp(false);setTab('Devices');}}>Configure devices <ChevronRight size={15}/></button></section></div>}
  </div>;
}
export function Projector() {
  const canvas=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{
    document.title='MorphLive Output'; let last=0;
    const channel=new BroadcastChannel('morphlive-output');
    const clear=()=>{const ctx=canvas.current?.getContext('2d');if(!ctx)return;ctx.fillStyle='#090b10';ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);ctx.fillStyle='#a4adbe';ctx.font='20px sans-serif';ctx.textAlign='center';ctx.fillText('MorphLive · Output stopped',ctx.canvas.width/2,ctx.canvas.height/2);};
    clear();
    channel.onmessage=event=>{ if(event.data.type==='stop'){clear();return;} const bitmap=event.data.bitmap as ImageBitmap; if(!bitmap)return;last=performance.now(); const target=canvas.current!;if(target.width!==bitmap.width||target.height!==bitmap.height){target.width=bitmap.width;target.height=bitmap.height;}target.getContext('2d')!.drawImage(bitmap,0,0);bitmap.close(); channel.postMessage({type:'ack'}); };
    channel.postMessage({type:'ready'});
    const stopKey=(event: KeyboardEvent)=>{if(event.key==='Escape')channel.postMessage({type:'emergency'});};
    window.addEventListener('keydown',stopKey);
    const timer=setInterval(()=>{if(performance.now()-last>1200)clear();},500);
    return()=>{window.removeEventListener('keydown',stopKey);channel.close();clearInterval(timer);};
  },[]);
  return <canvas className="projector" ref={canvas} width={1280} height={720}/>;
}
