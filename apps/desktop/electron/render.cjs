const {spawn}=require('node:child_process');
const path=require('node:path');
const fs=require('node:fs');
const activeStates=new Set(['loading','rendering','encoding','cancelling']);
class ClipRenderer {
  constructor(root,script,dependencies={}){this.root=root;this.script=script;this.spawn=dependencies.spawn||spawn;this.state={state:'idle',frames:0,total:0};this.child=null;this.output=null;}
  get busy(){return !!this.child||activeStates.has(this.state.state);}
  start(config){
    if(this.busy)throw new Error('A clip is already rendering.');
    const python=path.join(this.root,'.venv',process.platform==='win32'?'Scripts/python.exe':'bin/python');
    this.output=null;this.state={state:'loading',frames:0,total:0};
    const child=this.spawn(python,[this.script],{cwd:this.root,env:{...process.env,MORPHLIVE_RUNTIME_ROOT:this.root,PYTHONUNBUFFERED:'1'},stdio:['pipe','pipe','pipe'],windowsHide:true});
    this.child=child;let buffer='';let completed=false;
    child.stderr.on('data',()=>{});child.stdin.on('error',()=>{});child.stdout.setEncoding('utf8');
    child.stdout.on('data',chunk=>{
      if(this.child!==child||this.state.state==='cancelling')return;
      buffer+=chunk;if(buffer.length>16384){this.cancel();return;}
      let index;
      while((index=buffer.indexOf('\n'))>=0){
        const line=buffer.slice(0,index);buffer=buffer.slice(index+1);
        try{const value=JSON.parse(line);
          if(!['loading','rendering','encoding','completed','failed','cancelled'].includes(value.state))continue;
          this.state={state:value.state,frames:Number.isSafeInteger(value.frames)&&value.frames>=0?value.frames:0,total:Number.isSafeInteger(value.total)&&value.total>=0?value.total:0,untracked:Number.isSafeInteger(value.untracked)?value.untracked:0};
          if(value.state==='failed')this.state.error='Clip rendering failed. Check FFmpeg, the local runtime, and the video format.';
          completed=value.state==='completed';if(completed)this.state.state='encoding';
        }catch{}
      }
    });
    child.on('error',()=>{if(this.child===child){this.child=null;this.state={state:'failed',frames:0,total:0,error:'Could not start the installed local runtime.'};}});
    child.on('close',code=>{if(this.child!==child)return;this.child=null;
      if(this.state.state==='cancelling'){this.state={...this.state,state:'cancelled'};}
      else if(completed&&code===0&&fs.existsSync(config.output)){this.output=config.output;this.state={...this.state,state:'completed'};}
      else this.state={...this.state,state:'failed',error:'Clip rendering failed. Check FFmpeg, the local runtime, and the video format.'};
    });
    child.stdin.end(JSON.stringify(config)+'\n');return this.state;
  }
  cancel(){const child=this.child;if(!child)return this.state;this.state={...this.state,state:'cancelling'};child.kill('SIGTERM');const timer=setTimeout(()=>child.kill('SIGKILL'),10000);timer.unref();child.once('close',()=>clearTimeout(timer));return this.state;}
}
module.exports={ClipRenderer};
