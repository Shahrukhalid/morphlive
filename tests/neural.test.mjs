import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { createRequire } from 'node:module';
const {NeuralBridge}=createRequire(import.meta.url)('../apps/desktop/electron/neural.cjs');
function fixture(){
  const child=new EventEmitter();child.stdin=new PassThrough();child.stdout=new PassThrough();child.stderr=new PassThrough();
  child.kill=()=>child.emit('exit');child.stdin.on('finish',()=>queueMicrotask(()=>child.emit('exit')));
  return {child,bridge:new NeuralBridge('local-runtime','server.py',{exists:()=>true,spawn:()=>child})};
}
test('neural bridge allows one response at a time and rejects overlapping frames',async()=>{
  const {bridge,child}=fixture();const start=bridge.start('fictional-female');
  child.stdout.write('{"ok":true,"device":"test"}\n');assert.equal((await start).device,'test');
  const frame=bridge.request({op:'frame',jpeg:'test'});
  await assert.rejects(bridge.request({op:'frame',jpeg:'test'}),/busy/);
  child.stdout.write('{"ok":true,"ms":12}\n');assert.equal((await frame).ms,12);bridge.stop();
});
test('neural stop rejects in-flight work and late responses cannot restart it',async()=>{
  const {bridge,child}=fixture();const start=bridge.start('fictional-male');
  const rejected=assert.rejects(start,/stopped/);bridge.stop();await rejected;
  child.stdout.write('{"ok":true}\n');assert.equal(bridge.child,null);assert.equal(bridge.pending,null);
});
test('neural malformed and oversized responses fail without retaining media',async()=>{
  const {bridge,child}=fixture();const start=bridge.start('fictional-female');
  const malformed=assert.rejects(start,/Invalid neural response/);child.stdout.write('invalid\n');await malformed;
  const frame=bridge.request({op:'frame'});const rejected=assert.rejects(frame,/stopped/);
  child.stdout.write('x'.repeat(1_500_001));await rejected;assert.equal(bridge.child,null);
});
test('neural timeout terminates pending work',async()=>{
  const {bridge,child}=fixture();const start=bridge.start('fictional-female');child.stdout.write('{"ok":true}\n');await start;
  await assert.rejects(bridge.request({op:'frame'},10),/stopped|timed out/);assert.equal(bridge.child,null);
});
