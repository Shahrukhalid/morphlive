import { VoiceDSP } from './dsp.js';
class MorphProcessor extends AudioWorkletProcessor {
  constructor() {
    super(); this.dsp = new VoiceDSP(sampleRate); this.silent = new Float32Array(128); this.frames = 0;
    this.port.onmessage = event => this.dsp.configure(event.data);
  }
  process(inputs, outputs) {
    const output = outputs[0]?.[0]; if (!output) return true;
    const peak = this.dsp.process(inputs[0]?.[0] || this.silent, output);
    if (++this.frames % 16 === 0) this.port.postMessage({ peak, audioTime: currentTime, algorithmMs: 1024 / sampleRate * 1000 });
    return true;
  }
}
registerProcessor('morph-voice', MorphProcessor);
