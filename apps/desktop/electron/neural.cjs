const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

// No listening port, shell, arbitrary command, or renderer-provided path.
class NeuralBridge {
  constructor(root, script, dependencies={}) { this.root=root; this.script=script; this.child=null; this.pending=null; this.spawn=dependencies.spawn||spawn;this.exists=dependencies.exists||fs.existsSync;this.activity=dependencies.activity||(()=>{}); }
  stop() {
    this.activity(false);
    const child=this.child; this.child=null;
    if(this.pending){clearTimeout(this.pending.timer);this.pending.reject(new Error('Neural engine stopped'));this.pending=null;}
    if(child){child.stdin.end(JSON.stringify({op:'stop'})+'\n');const timer=setTimeout(()=>child.kill('SIGKILL'),1000);timer.unref();child.once('exit',()=>clearTimeout(timer));}
  }
  async start(reference,backend='portrait',enhance=false) {
    this.stop();
    const python=path.join(this.root,'.venv',process.platform==='win32'?'Scripts/python.exe':'bin/python');
    if(!this.exists(python))throw new Error('Install the local neural runtime, then select its project folder.');
    this.activity(true);
    const child=this.spawn(python,[this.script],{cwd:this.root,env:{...process.env,MORPHLIVE_RUNTIME_ROOT:this.root,PYTHONUNBUFFERED:'1'},stdio:['pipe','pipe','pipe'],windowsHide:true});
    this.child=child;let buffer='';
    child.stderr.on('data',()=>{}); // Upstream diagnostics can contain local paths; never persist them.
    child.stdin.on('error',()=>{});
    child.stdout.setEncoding('utf8');
    child.stdout.on('data',chunk=>{
      buffer+=chunk;
      if(buffer.length>1_500_000){this.stop();return;}
      let index;
      while((index=buffer.indexOf('\n'))>=0){
        const line=buffer.slice(0,index);buffer=buffer.slice(index+1);
        if(child!==this.child||!this.pending)continue;
        const pending=this.pending;this.pending=null;clearTimeout(pending.timer);
        try{const response=JSON.parse(line);response.ok?pending.resolve(response):pending.reject(new Error(response.error||'Neural processing failed'));}
        catch{pending.reject(new Error('Invalid neural response'));}
      }
    });
    child.on('error',()=>{if(this.child===child)this.stop();});
    child.on('exit',()=>{if(this.child===child)this.stop();});
    return this.request({op:'start',reference,backend,enhance},60000);
  }
  request(value, timeout=10000) {
    if(!this.child||this.pending)return Promise.reject(new Error('Neural engine unavailable or busy'));
    return new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{this.stop();reject(new Error('Neural engine timed out; capture stopped.'));},timeout);
      this.pending={resolve,reject,timer};this.child.stdin.write(JSON.stringify(value)+'\n');
    });
  }
}
module.exports={NeuralBridge};
