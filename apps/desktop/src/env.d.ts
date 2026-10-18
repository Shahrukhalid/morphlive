/// <reference types="vite/client" />

interface Window { morphPreferences?: { load(): string; save(serialized: string): Promise<boolean> } }
type NeuralReference = {id:string;name:string;kind:string;pitch:number;formant:number;installed:boolean;attribution?:{credit:string;license:string;licenseUrl:string;source:string}};
type NeuralResponse = {ok?:boolean;references?:NeuralReference[];device?:string;jpeg?:string;ms?:number;tracked?:boolean;virtual?:boolean;restorationAvailable?:boolean};
interface Window { morphNeural?: { command(request:{op:string;reference?:string;jpeg?:string;enabled?:boolean;backend?:string;enhance?:boolean}):Promise<NeuralResponse> } }

type RenderStatus={state:string;frames:number;total:number;untracked?:number;error?:string};
interface Window { morphRender?: {command(request:{op:string;reference?:string;restore?:boolean}):Promise<RenderStatus>} }
