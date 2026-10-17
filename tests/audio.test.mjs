import test from 'node:test';
import assert from 'node:assert/strict';
import { FFT, VoiceDSP } from '../apps/desktop/src/audio/dsp.js';
function signal(seconds=1, frequency=220) { return Float32Array.from({length:48000*seconds},(_,i)=>.2*Math.sin(2*Math.PI*frequency*i/48000)); }
function run(config, input) { const dsp=new VoiceDSP(); dsp.configure(config); const output=new Float32Array(input.length); for(let i=0;i<input.length;i+=128)dsp.process(input.subarray(i,i+128),output.subarray(i,i+128)); return output; }
function peakFrequency(samples) { const n=16384, fft=new FFT(n); const re=Float64Array.from(samples.slice(-n), (x,i)=>x*(.5-.5*Math.cos(2*Math.PI*i/n))),im=new Float64Array(n);fft.run(re,im);let max=0,bin=0;for(let k=20;k<1000;k++){const m=Math.hypot(re[k],im[k]);if(m>max){max=m;bin=k;}}return bin*48000/n; }
test('FFT round trip retains signal',()=>{const re=Float64Array.from({length:1024},(_,i)=>Math.sin(i*.1)),expected=re.slice(),im=new Float64Array(1024),fft=new FFT(1024);fft.run(re,im);fft.run(re,im,true);for(let i=0;i<1024;i++)assert.ok(Math.abs(re[i]-expected[i])<1e-10);});
test('pitch changes harmonic frequency while retaining duration',()=>{const input=signal(2);for(const pitch of [-12,0,12]){const output=run({pitch},input);assert.equal(output.length,input.length);assert.ok(Math.abs(peakFrequency(output)-220*2**(pitch/12))<8,`${pitch}: ${peakFrequency(output)}`);}});
test('formant change leaves fundamental pitch intact',()=>{const input=signal(2);for(const formant of [-4,4])assert.ok(Math.abs(peakFrequency(run({formant},input))-220)<5);});
test('silence stays silent and output remains finite',()=>{const out=run({pitch:7,formant:3},new Float32Array(48000));assert.ok(out.every(x=>x===0));});
test('mute returns exact zero; unbounded input is clipped safely',()=>{const input=new Float32Array(48000).fill(100);assert.ok(run({muted:true},input).every(x=>x===0));assert.ok(run({gain:2},input).every(x=>Number.isFinite(x)&&Math.abs(x)<=.980001));});
test('invalid input samples do not poison subsequent output',()=>{const input=signal();input[200]=NaN;input[201]=Infinity;assert.ok(run({},input).every(Number.isFinite));});
test('rapid preset changes keep buffers bounded and output finite',()=>{const dsp=new VoiceDSP(),input=signal(),out=new Float32Array(128);for(let i=0;i<3000;i++){if(i%13===0)dsp.configure({pitch:(i%25)-12,formant:(i%13)-6,robot:i%2});dsp.process(input.subarray(0,128),out);assert.ok(out.every(Number.isFinite));}assert.equal(dsp.input.length,1024);assert.equal(dsp.output.length,1024);});
