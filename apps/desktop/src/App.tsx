import { useEffect, useRef, useState } from 'react';
import { Activity, AudioLines, Camera, Check, ChevronRight, CircleHelp, Cpu, Download, Headphones, Layers, LockKeyhole, Mic, MicOff, MonitorUp, Play, Power, Radio, RefreshCw, Settings2, ShieldCheck, SlidersHorizontal, Sparkles, Square, Video, Waves, X } from 'lucide-react';
import { defaults, loadSettings, voices, type Settings } from './presets';
import { AudioEngine } from './audio/engine';

type Device = { deviceId: string; label: string; kind: MediaDeviceKind };
type Metrics = { fps: number; process: number; dropped: number; tracking: number; audio: number; level: number };
const initialMetrics: Metrics = { fps: 0, process: 0, dropped: 0, tracking: 0, audio: 0, level: 0 };
const message = (e: unknown) => e instanceof Error ? e.message : 'An unexpected device error occurred.';
export function App() {
  const [settings, setSettings] = useState(loadSettings);
  const [tab, setTab] = useState('Studio');
  const [renderStatus,setRenderStatus]=useState<RenderStatus>({state:'idle',frames:0,total:0});
  const [renderRestore,setRenderRestore]=useState(false);
  const [clipReference,setClipReference]=useState('');
  const rendering=['loading','rendering','encoding','cancelling'].includes(renderStatus.state);
  async function renderCommand(op:string){try{const result=await window.morphRender?.command({op,reference:clipReference,restore:renderRestore&&restorationAvailable});if(result)setRenderStatus(result);}catch(e){setError(message(e));}}
  useEffect(()=>{if(tab!=='Render clip'&&!rendering)return;let active=true;const poll=()=>void window.morphRender?.command({op:'status'}).then(value=>{if(active)setRenderStatus(value);}).catch(()=>{});poll();const timer=setInterval(poll,500);return()=>{active=false;clearInterval(timer);};},[tab,rendering]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [camera, setCamera] = useState(''); const [microphone, setMicrophone] = useState(''); const [sink, setSink] = useState('');
  const [cameraOn, setCameraOn] = useState(false); const [audioOn, setAudioOn] = useState(false);
  const [occlusion,setOcclusion]=useState(false);
  const [references,setReferences]=useState<NeuralReference[]>([]);
  const [reference,setReference]=useState('fictional-female');
  const [nativeOutput,setNativeOutput]=useState(false);
  const [restoration,setRestoration]=useState(false);const [restorationAvailable,setRestorationAvailable]=useState(false);
  const [cameraBusy, setCameraBusy] = useState(false); const [audioBusy, setAudioBusy] = useState(false);
  const [muted, setMuted] = useState(false); const [original, setOriginal] = useState(false);
  const [tracking, setTracking] = useState('Idle'); const [error, setError] = useState('');
  const [metrics, setMetrics] = useState(initialMetrics);
  const [help, setHelp] = useState(false); const [consent, setConsent] = useState(false); const [presetName, setPresetName] = useState('');
  const canvas = useRef<HTMLCanvasElement>(null); const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const engine = useRef(new AudioEngine()); const frame = useRef(0);
  const liveSettings = useRef(settings); const liveOriginal = useRef(original);
  const captureGeneration = useRef(0); const audioGeneration = useRef(0);
  const neuralQueue=useRef(Promise.resolve<NeuralResponse>({}));
  const runNeural=(request:{op:string;reference?:string;jpeg?:string;enabled?:boolean;backend?:string;enhance?:boolean})=>{
    const next=neuralQueue.current.catch(()=>({})).then(()=>{
      if(!window.morphNeural)throw new Error('Neural mode requires the desktop app.');
      return window.morphNeural.command(request);
    });neuralQueue.current=next;return next;
  };
  const activeReference=references.find(item=>item.id===reference);
  const pairedVoice=activeReference||{pitch:0,formant:0,name:'Unselected appearance'};
  liveSettings.current = settings; liveOriginal.current = original;
  const update = (patch: Partial<Settings>) => setSettings(s => ({ ...s, ...patch }));
  const refresh = async () => {
    try {
      const list = (await navigator.mediaDevices.enumerateDevices()).map(d => ({ deviceId: d.deviceId, label: d.label, kind: d.kind }));
      setDevices(list);
      setCamera(curr => {
        if (curr && list.some(d => d.kind === 'videoinput' && d.deviceId === curr && !d.label.toLowerCase().includes('obs') && !d.label.toLowerCase().includes('virtual'))) return curr;
        const physical = list.find(d => d.kind === 'videoinput' && d.label && !d.label.toLowerCase().includes('obs') && !d.label.toLowerCase().includes('virtual'));
        return physical?.deviceId || curr;
      });
      setMicrophone(curr => {
        if (curr && list.some(d => d.kind === 'audioinput' && d.deviceId === curr && !d.label.toLowerCase().includes('blackhole') && !d.label.toLowerCase().includes('cable'))) return curr;
        const physical = list.find(d => d.kind === 'audioinput' && d.label && !d.label.toLowerCase().includes('blackhole') && !d.label.toLowerCase().includes('cable'));
        return physical?.deviceId || curr;
      });
    } catch (e) { setError(message(e)); }
  };
  useEffect(() => {
    void window.morphNeural?.command({op:'status'}).then(result=>{setReferences(result.references||[]);setRestorationAvailable(!!result.restorationAvailable);}).catch(()=>{});
    void refresh(); navigator.mediaDevices.addEventListener('devicechange', refresh);
    return () => { stopCamera(); stopAudio(); navigator.mediaDevices.removeEventListener('devicechange', refresh); };
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
    void window.morphNeural?.command({op:'stop'}).catch(()=>{});setNativeOutput(false);setOcclusion(false);
    captureGeneration.current++; cancelAnimationFrame(frame.current);
    stream.current?.getTracks().forEach(t => t.stop()); stream.current = null;
    if (video.current) video.current.srcObject = null;
    const ctx = canvas.current?.getContext('2d'); if (ctx) { ctx.fillStyle='#10131b'; ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height); }
    setCameraOn(false); setCameraBusy(false); setTracking('Idle'); setMetrics(m => ({ ...m, fps: 0, process: 0, tracking: 0 }));
  }
  function stopAudio() { audioGeneration.current++; engine.current.stop(); setAudioOn(false); setAudioBusy(false); setMetrics(m => ({ ...m, level: 0, audio: 0 })); }
  function emergency() { void renderCommand('cancel'); stopCamera(); stopAudio(); setOriginal(false); setError('Emergency stop: all capture tracks and outputs are closed.'); }
  async function startCamera() {
    if(rendering){setError('Wait for rendering to finish or cancel it first.');return;}
    if (!consent) setConsent(true);
    stopCamera(); const generation = captureGeneration.current; setCameraBusy(true); setError('');
    try {
      let currentRefs = references;
      if (currentRefs.length === 0 && window.morphNeural) {
        try {
          const status = await window.morphNeural.command({ op: 'status' });
          if (status?.references) {
            currentRefs = status.references;
            setReferences(status.references);
            if (status.restorationAvailable) setRestorationAvailable(true);
          }
        } catch {}
      }
      const refItem = currentRefs.find(r => r.id === reference) || activeReference;
      if (settings.autoVoice && refItem) update({ pitch: refItem.pitch, formant: refItem.formant, robot: 0 });
      if ((!refItem || !refItem.installed)) throw new Error('Install the local neural runtime and choose an available reference first.');
      const s = liveSettings.current; const width = s.profile === 'Performance' ? 640 : s.profile === 'Quality' ? 1920 : 1280;
      let chosenCamera = camera;
      try {
        const list = await navigator.mediaDevices.enumerateDevices();
        const physical = list.find(d => d.kind === 'videoinput' && d.label && !d.label.toLowerCase().includes('virtual') && !d.label.toLowerCase().includes('obs'));
        const currDevice = list.find(d => d.kind === 'videoinput' && d.deviceId === chosenCamera);
        if (!chosenCamera || (currDevice && (currDevice.label.toLowerCase().includes('virtual') || currDevice.label.toLowerCase().includes('obs')))) {
          if (physical) {
            chosenCamera = physical.deviceId;
            setCamera(physical.deviceId);
          }
        }
      } catch {}
      let captured = await navigator.mediaDevices.getUserMedia({ video: { deviceId: chosenCamera ? { exact: chosenCamera } : undefined, width: { ideal: width }, height: { ideal: width*9/16 }, frameRate: { ideal: 30, max: 30 } } });
      const firstTrack = captured.getVideoTracks()[0];
      if (firstTrack?.label && (firstTrack.label.toLowerCase().includes('virtual') || firstTrack.label.toLowerCase().includes('obs'))) {
        try {
          const list = await navigator.mediaDevices.enumerateDevices();
          const physical = list.find(d => d.kind === 'videoinput' && d.label && !d.label.toLowerCase().includes('virtual') && !d.label.toLowerCase().includes('obs'));
          if (physical && physical.deviceId !== firstTrack.getSettings().deviceId) {
            captured.getTracks().forEach(t => t.stop());
            chosenCamera = physical.deviceId;
            setCamera(physical.deviceId);
            captured = await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: physical.deviceId }, width: { ideal: width }, height: { ideal: width*9/16 }, frameRate: { ideal: 30, max: 30 } } });
          }
        } catch {}
      }
      if (generation !== captureGeneration.current) { captured.getTracks().forEach(t => t.stop()); return; }
      stream.current=captured;
      captured.getVideoTracks()[0].onended = () => { stopCamera(); setError('Camera disconnected or permission revoked. Refresh devices and start again.'); };
      video.current!.srcObject = captured; await video.current!.play();
      if (generation !== captureGeneration.current) return;
      const actual = captured.getVideoTracks()[0].getSettings();
      const initialWidth = actual.width || width;
      const initialHeight = actual.height || Math.round(width * 9 / 16);
      canvas.current!.width = initialWidth;
      canvas.current!.height = initialHeight;
      const initialCtx = canvas.current?.getContext('2d');
      if (initialCtx) { initialCtx.fillStyle='#000'; initialCtx.fillRect(0,0,initialWidth,initialHeight); }
      setCameraOn(true); setCameraBusy(false); await refresh(); setTracking('Loading local model…');
        setCameraBusy(true);
        const bridge=window.morphNeural;if(!bridge)throw new Error('Neural mode requires the desktop app.');
        const ready=await runNeural({op:'start',reference,backend:'faceswap',enhance:restoration});
        if(generation!==captureGeneration.current){void bridge.command({op:'stop'});return;}
        setCameraBusy(false);setOcclusion(!!ready.occlusion);setTracking('Live face replacement · '+ready.device);
        const capture=document.createElement('canvas');
        const captureWidth=s.profile!=='Performance'?1280:640;
        const factor=Math.min(1,captureWidth/(actual.width||1280),1080/(actual.height||720));
        capture.width=Math.max(2,2*Math.floor((actual.width||1280)*factor/2));capture.height=Math.max(2,2*Math.floor((actual.height||720)*factor/2));
        canvas.current!.width=capture.width;canvas.current!.height=capture.height;
        const captureContext=capture.getContext('2d')!;let last=performance.now(),count=0,total=0,lastCapture=0;
        const renderNeural=async()=>{
          if(generation!==captureGeneration.current||!stream.current)return;
          try{
            const now=performance.now();
            const input=video.current;
            if(!input || input.readyState < 2 || now-lastCapture < 1000/30-1){
              frame.current=requestAnimationFrame(()=>{void renderNeural();});
              return;
            }
            lastCapture=now;
            const vw = input.videoWidth || actual.width || 1280;
            const vh = input.videoHeight || actual.height || 720;
            const cWidth = s.profile!=='Performance'?1280:640;
            const scaleFactor = Math.min(1, cWidth / vw, 1080 / vh);
            const targetW = Math.max(2, 2 * Math.floor(vw * scaleFactor / 2));
            const targetH = Math.max(2, 2 * Math.floor(vh * scaleFactor / 2));
            if (capture.width !== targetW || capture.height !== targetH) {
              capture.width = targetW; capture.height = targetH;
              if (canvas.current) {
                canvas.current.width = targetW; canvas.current.height = targetH;
              }
            }
            captureContext.drawImage(input,0,0,capture.width,capture.height);
            const response=await runNeural({op:'frame',jpeg:capture.toDataURL('image/jpeg',.92).split(',')[1]});
            if(generation!==captureGeneration.current)return;
            const target=canvas.current;
            if(target){
              const ctx=target.getContext('2d')!;
              if(response.tracked && response.jpeg){
                const image=new Image();image.src='data:image/jpeg;base64,'+response.jpeg;await image.decode();
                if(generation!==captureGeneration.current)return;
                if(target.width!==image.naturalWidth||target.height!==image.naturalHeight){
                  target.width=image.naturalWidth;
                  target.height=image.naturalHeight;
                }
                if(liveOriginal.current) ctx.drawImage(input,0,0,target.width,target.height);
                else ctx.drawImage(image,0,0,target.width,target.height);
                setTracking('Live webcam face replacement');
              } else {
                ctx.fillStyle='#000';ctx.fillRect(0,0,target.width,target.height);
                setTracking('No face · output blanked');
              }
            }
            count++;total+=response.ms||0;const finished=performance.now();
            if(finished-last>1000){const measuredFps=count*1000/(finished-last),measuredProcess=total/count;setMetrics(m=>({...m,fps:measuredFps,process:measuredProcess}));last=finished;count=0;total=0;}
            frame.current=requestAnimationFrame(()=>{void renderNeural();});
          }catch(e){if(generation===captureGeneration.current){stopCamera();setError(message(e));}}
        };
        void renderNeural();
    } catch (e) { if (generation===captureGeneration.current) { stopCamera(); setError('Camera: '+message(e)); } }
  }
  async function startAudio() {
    if (!consent) setConsent(true);
    setAudioBusy(true); setError(''); const generation=++audioGeneration.current;
    try {
      await engine.current.start(microphone,sink,(level,audio) => setMetrics(m=>({ ...m,level,audio })));
      if (generation !== audioGeneration.current) { engine.current.stop(); return; }
      setAudioOn(true); setAudioBusy(false); await refresh();
    } catch (e) { if (generation===audioGeneration.current) { stopAudio(); setError('Microphone: '+message(e)); } }
  }
  async function selectReference(id:string){
    const item=references.find(value=>value.id===id);if(!item)return;
    const generation=captureGeneration.current;
    try{
      if(cameraOn){setCameraBusy(true);await runNeural({op:'reference',reference:id});if(generation!==captureGeneration.current)return;}
      setReference(id);setOriginal(false);
      if(settings.autoVoice)update({pitch:item.pitch,formant:item.formant,robot:0});
    }catch(e){if(generation===captureGeneration.current)setError(message(e));}
    finally{setCameraBusy(false);}
  }
  async function neuralAction(op:'setup'|'import'|'virtual'){
    try{
      const response=await runNeural({op,reference,enabled:!nativeOutput});
      if(response?.references)setReferences(response.references);
      if(response?.restorationAvailable!==undefined)setRestorationAvailable(response.restorationAvailable);
      if(op==='virtual')setNativeOutput(!!response?.virtual);
    }catch(e){setError(message(e));}
  }
  async function toggleRestoration(enabled: boolean) {
    setRestoration(enabled);
    if (cameraOn) {
      try {
        await runNeural({ op: 'enhance', enhance: enabled });
      } catch (e) {
        setError(message(e));
      }
    }
  }
  function diagnostics() {
    const data={ app:'MorphLive',version:'0.1.0', metrics, cameraActive:cameraOn,audioActive:audioOn,tracking,backend:'faceswap',reference,restoration,occlusion, profile:settings.profile, virtualCamera:nativeOutput, note:'Device names, identifiers, personal paths, and media are excluded. Latency is an estimate, not an end-to-end measurement.' };
    const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})); const a=document.createElement('a'); a.href=url; a.download='morphlive-diagnostics.json'; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  const isVirtual = (label: string) => /obs|virtual|blackhole|cable/i.test(label);
  const options = (kind: MediaDeviceKind) => devices.filter(d=>d.kind===kind).map((d,i)=>{
    const virt = isVirtual(d.label);
    const tag = kind==='videoinput' && virt ? ' ⚠️ (Virtual Camera)' : kind==='audioinput' && virt ? ' (Virtual Cable)' : '';
    return <option key={d.deviceId || i} value={d.deviceId}>{d.label ? `${d.label}${tag}` : `${kind==='videoinput'?'Camera':kind==='audioinput'?'Microphone':'Output'} ${i+1}`}</option>;
  });
  const deviceSelect = (label:string, kind:MediaDeviceKind, value:string, setter:(v:string)=>void, active:boolean) => <label className="field">{label}<select value={value} disabled={active} onChange={e=>setter(e.target.value)}><option value="">{kind==='audiooutput'?'Select headphones or virtual cable':kind==='videoinput'?'Physical webcam (auto-detect)':'System default'}</option>{kind==='audiooutput'&&<option value="__silent__">Silent processing (no playback)</option>}{options(kind)}</select></label>;
  const slider = (label:string,key:'pitch'|'formant'|'gain'|'intensity'|'offset',min:number,max:number,step:number,suffix:string) => <label className="range"><span>{label}<b>{settings[key].toFixed(step<1?2:0)}{suffix}</b></span><input type="range" min={min} max={max} step={step} value={settings[key]} onChange={e=>update({[key]:Number(e.target.value),...(['pitch','formant'].includes(key)?{autoVoice:false}:{})})}/></label>;
  return <div className="app-shell">
    <aside className="sidebar"><a className="brand" href="#"><span className="brand-icon"><Waves size={23}/></span><span>morph<span className="brand-light">live</span><small>YOUR LOCAL REALITY STUDIO</small></span></a>
      <div className="workspace-label">WORKSPACE</div><nav>{[['Studio',Layers],['Render clip',Video],['Voice lab',AudioLines],['Devices',Video],['Settings',Settings2]].map(([name,Icon])=><button key={name as string} className={tab===name?'nav active':'nav'} onClick={()=>setTab(name as string)}><Icon size={19}/>{name as string}{tab===name&&<span className="nav-dot"/>}</button>)}</nav>
      <div className="side-note"><div className="orbit-mark">◎</div><h3>A different you.<br/>Entirely on your device.</h3><p>No accounts. No cloud processing. Just your imagination.</p><span><LockKeyhole size={12}/> LOCAL-FIRST BY DESIGN</span></div>
      <div className="side-bottom"><button className="nav" onClick={()=>setHelp(true)}><CircleHelp size={18}/> Setup & routing</button><div className="version"><span className="dot green"/> MorphLive <span>v0.1.0 · preview</span></div></div>
    </aside>
    <main><header><div className="breadcrumb">Workspace <ChevronRight size={13}/><span>{tab}</span></div><div className="header-right"><span className="privacy-pill"><ShieldCheck size={14}/> On-device processing</span><button className="icon-button" title="Download redacted diagnostics" onClick={diagnostics}><Download size={17}/></button></div></header>
      <div className="page-title"><div><div className="eyebrow">MAKE YOURSELF SOMETHING NEW</div><h1>{tab==='Studio'?'Your transformation studio':tab==='Render clip'?'Render a local clip':tab==='Voice lab'?'Find your frequency':tab==='Devices'?'Connect your studio':'Make it yours'}<span>.</span></h1><p>{tab==='Studio'?'A new look. A different voice. Still entirely you.':tab==='Render clip'?'Frame-by-frame face replacement with original motion and audio.':tab==='Voice lab'?'Local DSP, independent pitch and spectral resonance controls.':tab==='Devices'?'Choose your inputs and build a route to your next call.':'Fine-tune performance, privacy, and your personal presets.'}</p></div><button className="emergency" onClick={emergency}><Power size={15}/> Emergency stop <kbd>esc</kbd></button></div>
      {error&&<div role="alert" className="alert"><span>{error}</span><button aria-label="Dismiss notification" onClick={()=>setError('')}><X size={15}/></button></div>}
      {tab==='Render clip'&&<section className="panel"><h2>Local clip renderer</h2><p>Replaces the face in each video frame. Keeps the input motion, hair, body, surroundings, and original audio. No voice cloning. This experimental model can still produce seams and identity artifacts.</p><label className="field">Adult appearance<select value={clipReference} disabled={rendering} onChange={e=>setClipReference(e.target.value)}><option value="">Choose an installed appearance</option>{references.filter(item=>item.installed).map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="toggle-row"><span>Face detail restoration<small>Slower export with full-precision processing. May change facial details.</small></span><input type="checkbox" checked={renderRestore&&restorationAvailable} disabled={rendering||!restorationAvailable} onChange={e=>setRenderRestore(e.target.checked)}/></label><p className="fine-print">Local videos up to five minutes; output up to 1080p / 30 FPS. FFmpeg and the neural runtime are required. Select a new MP4 filename. Frames without a detected face are black.</p><div className="button-row"><button className="primary" disabled={rendering||cameraOn||cameraBusy||!references.some(item=>item.id===clipReference&&item.installed)} onClick={()=>void renderCommand('start')}>Choose video and render</button>{rendering&&<button className="secondary-button" onClick={()=>void renderCommand('cancel')}>Cancel render</button>}{renderStatus.state==='completed'&&<button className="secondary-button" onClick={()=>void renderCommand('open')}>Open rendered clip</button>}</div><p role="status">{renderStatus.state} {renderStatus.frames>0&&`· ${renderStatus.frames} / ~${renderStatus.total} frames`}</p>{rendering&&<progress max={Math.max(renderStatus.total,renderStatus.frames,1)} value={renderStatus.frames}/>} {!!renderStatus.untracked&&<p>{renderStatus.untracked} frames had no detected face and were blanked.</p>}{renderStatus.error&&<p role="alert">{renderStatus.error}</p>}</section>}
      <div className={tab==='Studio'?'studio-grid':'studio-grid secondary'}>
        <section className="preview-column" style={tab==='Studio'?{}:{display:'none'}}>
          <div className="panel preview-panel"><div className="panel-heading"><span><span className={'dot '+(cameraOn?'green':'')}/> LIVE PREVIEW</span><span className="subtle">{cameraOn?`${canvas.current?.width} × ${canvas.current?.height}`:'CAMERA OFF'} <span className="divider">/</span> LOCAL</span></div>
            <div className="preview-stage"><canvas ref={canvas} width={1280} height={720}/><video ref={video} autoPlay muted playsInline className={cameraOn?'raw-preview':'hidden'} />
              {!cameraOn&&<div className="empty-preview"><div className="scan-frame"><Camera size={36} strokeWidth={1}/><i/><i/><i/><i/></div><h2>Your next persona starts here</h2><p>Start your camera to see your live transformation.<br/>Your video stays on this device.</p><button className="primary" disabled={cameraBusy} onClick={startCamera}><Camera size={16}/>{cameraBusy?'Connecting…':'Start camera'}</button><small>Explicit permission. Always.</small></div>}
              {cameraOn&&<><div className="live-tag"><span className="dot green"/> LIVE <span>{original?'Original camera':activeReference?.name}</span></div><div className="tracking-tag"><Activity size={13}/>{tracking}</div><button className={'compare '+(original?'selected':'')} onClick={()=>setOriginal(v=>!v)}>{original?'Show transformation':'View original'}</button></>}
            </div>
            <div className="preview-toolbar"><div className="capture-controls"><button className={cameraOn?'tool enabled':'tool'} onClick={cameraOn?stopCamera:startCamera} disabled={cameraBusy} title={cameraOn?'Stop camera':'Start camera'}><Camera size={18}/></button><button className={audioOn?'tool enabled':'tool'} onClick={audioOn?()=>setMuted(v=>!v):startAudio} disabled={audioBusy} title={audioOn?'Toggle mute':'Start microphone'}>{muted?<MicOff size={18}/>:<Mic size={18}/>}</button><div className="mini-meter">{Array.from({length:12},(_,i)=><i key={i} style={{background:audioOn&&!muted&&metrics.level>i/15?'#72e9c1':undefined}}/>)}</div><span className="subtle">{audioOn?(muted?'Muted':'Microphone active'):'Microphone off'}</span></div><button className="text-button" disabled={!cameraOn||cameraBusy} onClick={()=>void neuralAction('virtual')}><MonitorUp size={15}/> {nativeOutput?'Stop virtual camera':'Start virtual camera'}</button></div>
          </div>
          <div className="metrics">{[[Activity,'FRAME RATE',cameraOn?metrics.fps.toFixed(1):'—','fps'],[Cpu,'NEURAL INFERENCE',cameraOn?metrics.process.toFixed(1):'—','ms'],[AudioLines,'AUDIO LATENCY',audioOn?metrics.audio.toFixed(0):'—','ms est.'],[ShieldCheck,'PROCESSING','100','% local']].map(([Icon,label,value,unit])=><div className="metric" key={label as string}><span><Icon size={14}/>{label as string}</span><strong>{value as string}<small>{unit as string}</small></strong></div>)}</div>
          <div className="panel output-panel"><div className="section-heading"><span className="small-icon"><Radio size={18}/></span><div><h3>Take it to your next call</h3><p>Route your transformed feed into your favorite apps.</p></div><button className="text-button" onClick={()=>setHelp(true)}>Setup guide <ChevronRight size={14}/></button></div><div className="route-row"><div><Video size={17}/><span>Virtual camera<small>Neural frames → OBS Virtual Camera</small></span></div><span className="badge">{nativeOutput?'DIRECT OUTPUT ACTIVE':'SETUP REQUIRED'}</span></div><div className="route-row"><div><Headphones size={17}/><span>Virtual microphone<small>Choose an installed virtual audio device</small></span></div><span className="badge">{audioOn?(sink==='__silent__'?'SILENT DSP':'AUDIO ROUTED'):'SELECT OUTPUT'}</span></div><div className="app-list"><span>Works through standard device routes</span><b>zoom</b><b>Meet</b><b>Teams</b><small>Call compatibility unverified</small></div></div>
        </section>
        <section className="controls-column">
          {(tab==='Studio'||tab==='Settings')&&<div className="panel"><div className="section-title"><h2><Sparkles size={18}/> Appearance engine</h2><span className="tiny-label">NEURAL AI</span></div><p className="fine-print">Live camera · GhostV2</p><><p className="fine-print">Replaces inner facial features in the current webcam frame. Hair, beard outside the face region, head shape, body, and surroundings stay original. The optional foreground guard preserves detected obstructions; missed objects can still be overwritten. Full appearance transformation is not implemented.</p><p className="fine-print">Foreground guard: {occlusion?'active in current session':'checked when capture starts'} · adds processing time.</p><label className="toggle-row"><span>Face detail restoration<small>Optional detail enhancement; reduces frame rate and does not guarantee realism.</small></span><input type="checkbox" checked={restoration} disabled={!restorationAvailable||cameraBusy} onChange={e=>void toggleRestoration(e.target.checked)}/></label><label className="field">Adult appearance<select value={reference} disabled={cameraBusy} onChange={e=>void selectReference(e.target.value)}>{references.map(item=><option key={item.id} value={item.id} disabled={cameraOn&&!item.installed}>{item.name}{item.installed?'':' · local reference needed'}</option>)}</select></label><p className="fine-print">Eighteen adult character, executive, and public reference entries are a curated selection. Public reference photos retain their original credits and licenses. Voice pairing uses generic pitch/formant settings, not synthetic voice cloning.</p>{activeReference?.attribution&&<details className="fine-print"><summary>Reference photo credit</summary><p>{activeReference.attribution.credit} · {activeReference.attribution.license} · modified output</p><p style={{overflowWrap:'anywhere'}}>{activeReference.attribution.source}<br/>{activeReference.attribution.licenseUrl}</p></details>}<div className="button-row"><button className="secondary-button" disabled={cameraOn||cameraBusy} onClick={()=>void neuralAction('setup')}>Choose runtime folder</button><button className="secondary-button" disabled={cameraOn||cameraBusy} onClick={()=>void neuralAction('import')}>Import local reference</button></div><p className="fine-print">Start with a relaxed face looking forward. Click Start virtual camera after capture begins, then select OBS Virtual Camera in your call. Keep OBS’s own virtual camera stopped.</p></></div>}
          {(tab==='Studio'||tab==='Voice lab')&&<div className="panel voice-panel"><div className="section-title"><h2><AudioLines size={18}/> Voice pairing</h2><span className="tiny-label">LIVE DSP</span></div><label className="toggle-row pairing"><span>Match voice to persona<small>Editable character settings, independent of identity</small></span><input type="checkbox" checked={settings.autoVoice} onChange={e=>{if(e.target.checked) update({autoVoice:true,pitch:pairedVoice.pitch,formant:pairedVoice.formant,robot:0}); else update({autoVoice:false});}}/></label><label className="field">Voice preset<select value="" onChange={e=>{const v=voices.find(v=>v.id===e.target.value); if(v) update({pitch:v.pitch,formant:v.formant,robot:v.robot,autoVoice:false});}}><option value="">{settings.autoVoice?pairedVoice.name+' · generic linked voice':'Custom / manual voice'}</option>{voices.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}</select></label>{slider('Pitch','pitch',-12,12,1,' st')}{slider('Formant envelope','formant',-6,6,1,' st')}{tab==='Voice lab'&&<>{slider('Output gain','gain',0,2,.01,'×')}<label className="range"><span>Robot modulation<b>{Math.round(settings.robot*100)}%</b></span><input type="range" min="0" max="1" step="0.01" value={settings.robot} onChange={e=>update({robot:Number(e.target.value),autoVoice:false})}/></label><label className="toggle-row"><span>Soft noise gate</span><input type="checkbox" checked={settings.gate} onChange={e=>update({gate:e.target.checked})}/></label><p className="fine-print">Formants use a smoothed spectral envelope approximation. This is not voice cloning. Listen with headphones before routing to a call.</p><div className="button-row"><button className="primary" disabled={audioBusy} onClick={audioOn?stopAudio:startAudio}>{audioOn?<Square size={15}/>:<Mic size={15}/>} {audioOn?'Stop microphone':'Start microphone'}</button><button className="secondary-button" onClick={()=>setMuted(v=>!v)}>{muted?'Unmute':'Mute'}</button></div></>}<div className="voice-footer"><Waves size={16}/><span>{settings.autoVoice?'Voice follows your character':'Manual voice override active'}</span><span className="dot green"/></div></div>}
          {(tab==='Devices'||tab==='Voice lab')&&<div className="panel device-panel"><div className="section-title"><h2><SlidersHorizontal size={18}/> Device routing</h2><button className="icon-button" onClick={refresh} title="Refresh devices"><RefreshCw size={16}/></button></div>{deviceSelect('Camera input','videoinput',camera,setCamera,cameraOn||cameraBusy)}<p className="fine-print" style={{color:'#f3c574'}}>💡 <b>Camera input:</b> Select your physical webcam (e.g. <b>MacBook Pro Camera</b>). Do not select OBS Virtual Camera here; OBS Virtual Camera is the output destination for your calls.</p>{deviceSelect('Microphone input','audioinput',microphone,setMicrophone,audioOn||audioBusy)}{deviceSelect('Processed audio output','audiooutput',sink,setSink,audioOn||audioBusy)}<p className="fine-print">Choose silent processing to test without playback, headphones for monitoring, BlackHole on macOS, or CABLE Input on Windows for calls. Stop audio before changing its route. Never route output back to the selected input.</p><div className="button-row"><button className="primary" disabled={cameraBusy} onClick={cameraOn?stopCamera:startCamera}><Camera size={15}/>{cameraOn?'Stop camera':'Start camera'}</button><button className="secondary-button" disabled={audioBusy} onClick={audioOn?stopAudio:startAudio}><Mic size={15}/>{audioOn?'Stop audio':'Start audio'}</button><button className="secondary-button" disabled={!cameraOn||cameraBusy} onClick={()=>void neuralAction('virtual')}><MonitorUp size={15}/>{nativeOutput?'Stop virtual camera':'Start virtual camera'}</button></div>{slider('Additional audio delay','offset',0,250,1,' ms')}<p className="fine-print">Tune delay using a visible clap in the receiving app. Audio and video use separate conferencing device clocks; automatic drift correction is not implemented.</p></div>}
          {tab==='Settings'&&<><div className="panel"><div className="section-title"><h2><Cpu size={18}/> Performance & privacy</h2></div><label className="field">Performance profile<select value={settings.profile} onChange={e=>update({profile:e.target.value})}>{['Performance','Balanced','Quality','Auto'].map(p=><option key={p}>{p}</option>)}</select></label><p className="fine-print">Restart camera after changing profiles. Performance processes up to 640 pixels wide; other profiles process up to 1280 pixels wide. Auto currently uses the Balanced capture limit. The neural engine chooses the available local compute backend.</p><label className="toggle-row"><span>Synthetic appearance disclosure</span><input type="checkbox" checked={settings.disclosure} onChange={e=>update({disclosure:e.target.checked})}/></label><button className="secondary-button" onClick={diagnostics}><Download size={15}/>Export redacted diagnostics</button><button className="danger-text" onClick={()=>setSettings({...defaults})}>Reset preferences</button></div><div className="panel"><div className="section-title"><h2><Layers size={18}/> Your saved voice settings</h2></div><label className="field">Preset name<input value={presetName} maxLength={40} onChange={e=>setPresetName(e.target.value)} placeholder="e.g. Evening studio"/></label><button className="secondary-button" disabled={!presetName.trim()||settings.custom.length>=20} onClick={()=>{ update({custom:[...settings.custom,{name:presetName.trim(),persona:settings.persona,pitch:settings.pitch,formant:settings.formant,robot:settings.robot}]}); setPresetName('');}}>Save voice settings</button>{settings.custom.map((p,i)=><div className="saved-preset" key={i}><button onClick={()=>update({persona:p.persona,pitch:p.pitch,formant:p.formant,robot:p.robot,autoVoice:false})}>{p.name}</button><button title="Delete preset" onClick={()=>update({custom:settings.custom.filter((_,j)=>i!==j)})}><X size={14}/></button></div>)}</div></>}
        </section>
      </div>
      <footer><label><input type="checkbox" checked={consent} onChange={e=>{setConsent(e.target.checked);if(!e.target.checked){stopCamera();stopAudio();}}}/><span>I have permission to transform this camera and voice input.</span></label><span><LockKeyhole size={12}/> No recording · No uploads · No telemetry</span></footer>
    </main>
    {help&&<div className="modal-scrim" onClick={()=>setHelp(false)}><section role="dialog" aria-modal="true" aria-label="Output routing setup" className="modal" onClick={e=>e.stopPropagation()}><button className="modal-close icon-button" aria-label="Close guide" onClick={()=>setHelp(false)}><X size={20}/></button><div className="eyebrow">FROM YOUR STUDIO TO YOUR CALL</div><h2>Connect your new presence.</h2><ol><li><b>Start a local preview.</b><p>Confirm consent, select devices in Devices, then start camera. Face tracking needs the optional local model installation described in README.</p></li><li><b>Send transformed video.</b><p>For neural modes, install the optional local runtime and activate the OBS camera extension. Start capture, then Start virtual camera. Keep OBS’s own virtual camera stopped. </p></li><li><b>Route transformed audio.</b><p>Install BlackHole separately on macOS or VB-CABLE separately on Windows. Choose BlackHole 2ch or CABLE Input as MorphLive’s output. Choose the matching microphone device in your call. Never select the cable as MorphLive’s microphone.</p></li><li><b>Select devices in your call.</b><p>In Zoom, Meet, or Teams choose OBS Virtual Camera for camera and BlackHole 2ch / CABLE Output for microphone. Test a clap and adjust additional audio delay if needed.</p></li></ol><div className="notice">Direct synthetic-frame delivery to OBS Virtual Camera passed on the development Mac. Receiving-call quality and synchronization remain unverified. This app does not install virtual device drivers.</div><button className="primary" onClick={()=>{setHelp(false);setTab('Devices');}}>Configure devices <ChevronRight size={15}/></button></section></div>}
  </div>;
}
