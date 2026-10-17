import { VoiceDSP } from '../apps/desktop/src/audio/dsp.js';
import { performance } from 'node:perf_hooks';
const dsp=new VoiceDSP();dsp.configure({pitch:3,formant:2,robot:.2});
const input=Float32Array.from({length:128},(_,i)=>.2*Math.sin(i*.05)),out=new Float32Array(128);
for(let i=0;i<1000;i++)dsp.process(input,out);
const start=performance.now();const frames=11250;
for(let i=0;i<frames;i++)dsp.process(input,out);
const elapsed=performance.now()-start;
console.log(JSON.stringify({type:'synthetic DSP throughput; not hardware end-to-end latency',audioSeconds:frames*128/48000,elapsedMs:Math.round(elapsed),realtimeFactor:Number((elapsed/(frames*128/48)).toFixed(4)),algorithmDelayMs:1024/48,blockSize:128,fftSize:1024},null,2));
