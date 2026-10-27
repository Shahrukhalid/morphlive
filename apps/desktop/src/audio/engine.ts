import workletURL from './worklet.js?worker&url';
export type AudioConfig = { pitch: number; formant: number; robot: number; gain: number; gate: boolean; muted: boolean; bypass: boolean };
export class AudioEngine {
  generation = 0;
  pending: AudioConfig = {pitch:0,formant:0,robot:0,gain:1,gate:false,muted:true,bypass:false};
  offset = 0;
  context?: AudioContext; stream?: MediaStream; processor?: AudioWorkletNode; delay?: DelayNode;
  async start(device: string, sink: string, onLevel: (peak: number, latency: number) => void) {
    if (!sink) throw new Error('Select an explicit audio output first. Use headphones for monitoring or a virtual audio cable for calls.');
    // Release any previous capture first so a repeated start can never orphan a
    // live microphone track or an open AudioContext.
    this.stop();
    const generation = ++this.generation;
    const cancelled = () => { if (generation !== this.generation) throw new DOMException('Audio start cancelled', 'AbortError'); };
    try {
      const captured = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: device ? { exact: device } : undefined, channelCount: 1, sampleRate: 48000, echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      if (generation !== this.generation) { captured.getTracks().forEach(t => t.stop()); cancelled(); }
      this.stream = captured;
      this.stream.getAudioTracks()[0].onended = () => { this.stop(); onLevel(0,0); };
      this.context = new AudioContext({ sampleRate: 48000, latencyHint: 'interactive' });
      if (!('setSinkId' in this.context)) throw new Error('This runtime cannot choose an output device. Upgrade Electron.');
      await (this.context as AudioContext & { setSinkId(id: string | {type: 'none'}): Promise<void> }).setSinkId(sink === '__silent__' ? {type:'none'} : sink);
      cancelled();
      await this.context.audioWorklet.addModule(workletURL);
      cancelled();
      this.processor = new AudioWorkletNode(this.context,'morph-voice',{ numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [1], channelCount: 1 });
      this.delay = this.context.createDelay(.5);
      this.delay.delayTime.value=this.offset/1000;
      this.processor.port.postMessage(this.pending);
      this.processor.port.onmessage = event => onLevel(event.data.peak, event.data.algorithmMs + (this.context?.baseLatency || 0)*1000 + (this.context?.outputLatency || 0)*1000 + (this.delay?.delayTime.value || 0)*1000);
      this.context.createMediaStreamSource(this.stream).connect(this.processor).connect(this.delay).connect(this.context.destination);
      await this.context.resume();
    } catch (error) { if (generation === this.generation) this.stop(); throw error; }
  }
  configure(config: AudioConfig, offset: number) {
    this.pending=config; this.offset=offset;
    this.processor?.port.postMessage(config);
    if (this.context && this.delay) this.delay.delayTime.setTargetAtTime(offset/1000,this.context.currentTime,.03);
  }
  stop() {
    this.generation++;
    this.stream?.getTracks().forEach(t => t.stop()); this.stream = undefined;
    this.processor?.disconnect(); this.processor?.port.close(); this.processor = undefined;
    this.delay?.disconnect(); this.delay = undefined;
    void this.context?.close(); this.context = undefined;
  }
}
