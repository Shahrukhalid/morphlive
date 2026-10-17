/** Allocation-free streaming phase vocoder. FFT work is bounded to 1024 bins. */
export class FFT {
  constructor(n) { this.n = n; }
  run(re, im, inverse = false) {
    const n = this.n;
    for (let i = 1, j = 0; i < n; i++) {
      let bit = n >> 1;
      for (; j & bit; bit >>= 1) j ^= bit;
      j ^= bit;
      if (i < j) { let v = re[i]; re[i] = re[j]; re[j] = v; v = im[i]; im[i] = im[j]; im[j] = v; }
    }
    for (let len = 2; len <= n; len <<= 1) {
      const angle = (inverse ? 2 : -2) * Math.PI / len;
      const cr = Math.cos(angle), ci = Math.sin(angle);
      for (let i = 0; i < n; i += len) {
        let wr = 1, wi = 0;
        for (let j = 0; j < len / 2; j++) {
          const a = i + j, b = a + len / 2;
          const tr = wr * re[b] - wi * im[b], ti = wr * im[b] + wi * re[b];
          re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
          const next = wr * cr - wi * ci; wi = wr * ci + wi * cr; wr = next;
        }
      }
    }
    if (inverse) for (let i = 0; i < n; i++) { re[i] /= n; im[i] /= n; }
  }
}
const wrap = x => x - 2 * Math.PI * Math.round(x / (2 * Math.PI));
export class VoiceDSP {
  constructor(sampleRate = 48000) {
    this.rate = sampleRate; this.n = 1024; this.hop = 256;
    this.fft = new FFT(this.n);
    for (const key of ['input', 'output', 're', 'im', 'window']) this[key] = new Float64Array(this.n);
    for (const key of ['lastPhase', 'phase', 'magnitude', 'envelope', 'sumMagnitude', 'sumFrequency']) this[key] = new Float64Array(this.n / 2 + 1);
    for (let i = 0; i < this.n; i++) this.window[i] = .5 - .5 * Math.cos(2 * Math.PI * i / this.n);
    this.index = 0; this.count = 0; this.pitch = 1; this.formant = 1; this.gain = 1;
    this.targetPitch = 1; this.targetFormant = 1; this.targetGain = 1; this.robot = 0; this.targetRobot = 0; this.osc = 0; this.gate = false; this.muted = false; this.envelopeLevel = 0; this.bypass = false;
    this.dry = new Float64Array(this.n); this.wet = 1;
  }
  configure({ pitch = 0, formant = 0, gain = 1, robot = 0, gate = false, muted = false, bypass = false } = {}) {
    this.targetPitch = 2 ** (Math.max(-12, Math.min(12, pitch)) / 12);
    this.targetFormant = 2 ** (Math.max(-6, Math.min(6, formant)) / 12);
    this.targetGain = Math.max(0, Math.min(2, gain)); this.targetRobot = Math.max(0, Math.min(1, robot));
    this.gate = gate; this.muted = muted; this.bypass = bypass;
  }
  frame() {
    const n = this.n, half = n / 2, step = 2 * Math.PI * this.hop / n;
    this.pitch += (this.targetPitch - this.pitch) * .2;
    this.formant += (this.targetFormant - this.formant) * .2;
    for (let i = 0; i < n; i++) { this.re[i] = this.input[(this.index + i) % n] * this.window[i]; this.im[i] = 0; }
    this.fft.run(this.re, this.im);
    this.sumMagnitude.fill(0); this.sumFrequency.fill(0);
    for (let k = 0; k <= half; k++) this.magnitude[k] = Math.hypot(this.re[k], this.im[k]);
    // Smoothed log spectrum estimates the vocal envelope; shift it independently
    // of harmonic frequencies. This is DSP approximation, not neural conversion.
    for (let k = 0; k <= half; k++) {
      let sum = 0, count = 0;
      for (let j = Math.max(0, k - 8); j <= Math.min(half, k + 8); j++) { sum += Math.log(this.magnitude[j] + 1e-8); count++; }
      this.envelope[k] = Math.exp(sum / count);
    }
    for (let k = 0; k <= half; k++) {
      const phase = Math.atan2(this.im[k], this.re[k]);
      const frequency = k + wrap(phase - this.lastPhase[k] - k * step) / step;
      this.lastPhase[k] = phase;
      const dst = Math.round(k * this.pitch);
      if (dst > half) continue;
      const sourceEnvelope = this.envelope[k];
      const envelopeIndex = Math.min(half, Math.round(dst / this.formant));
      const correction = Math.max(.1, Math.min(10, this.envelope[envelopeIndex] / (sourceEnvelope + 1e-8)));
      const mag = this.magnitude[k] * correction;
      this.sumMagnitude[dst] += mag;
      this.sumFrequency[dst] += frequency * this.pitch * mag;
    }
    this.re.fill(0); this.im.fill(0);
    for (let k = 0; k <= half; k++) {
      const mag = this.sumMagnitude[k];
      this.phase[k] = wrap(this.phase[k] + (mag > 1e-8 ? this.sumFrequency[k] / mag : k) * step);
      this.re[k] = mag * Math.cos(this.phase[k]); this.im[k] = mag * Math.sin(this.phase[k]);
      if (k > 0 && k < half) { this.re[n-k] = this.re[k]; this.im[n-k] = -this.im[k]; }
    }
    this.fft.run(this.re, this.im, true);
    for (let i = 0; i < n; i++) this.output[(this.index + i) % n] += this.re[i] * this.window[i] / 1.5;
  }
  process(input, output) {
    let peak = 0;
    for (let i = 0; i < output.length; i++) {
      const x = Number.isFinite(input[i]) ? input[i] : 0;
      let y = this.output[this.index]; this.output[this.index] = 0;
      const dry = this.dry[this.index]; this.dry[this.index] = x;
      this.input[this.index] = x; this.index = (this.index + 1) % this.n;
      if (++this.count === this.hop) { this.count = 0; this.frame(); }
      this.gain += (this.targetGain - this.gain) * .002;
      this.robot += (this.targetRobot - this.robot) * .002;
      this.wet += ((this.bypass ? 0 : 1) - this.wet) * .002;
      this.envelopeLevel += (Math.abs(x) - this.envelopeLevel) * .01;
      this.osc = (this.osc + 2 * Math.PI * 70 / this.rate) % (2 * Math.PI);
      y = (dry * (1 - this.wet) + y * this.wet) * ((1 - this.robot) + this.robot * Math.sin(this.osc));
      const gateGain = this.gate ? Math.min(1, this.envelopeLevel / .008) : 1;
      y *= this.gain * gateGain;
      // Hard output ceiling; muted output is exact zero.
      output[i] = this.muted ? 0 : Math.max(-.98, Math.min(.98, y)); peak = Math.max(peak, Math.abs(output[i]));
    }
    return peak;
  }
}
