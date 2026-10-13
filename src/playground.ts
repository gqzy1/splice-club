// Local-only objects intentionally do not implement the onchain Work type.
export type DemoIdea = {key:string;name:string;description:string;features:string[];color:string;ink:string;art:number};
export const TUTORIAL_KEY='splice.club.tutorial.v1';
export function shouldShowTutorial(){try{return localStorage.getItem(TUTORIAL_KEY)!=='done';}catch{return true;}}
export function rememberTutorial(){try{localStorage.setItem(TUTORIAL_KEY,'done');}catch{/* Storage can be unavailable; play remains usable. */}}
export const DEMO_IDEAS:DemoIdea[]=[
 {key:'moon',name:'Moon Laundry',description:'A tiny laundromat that washes lost memories in moonlight.',features:['moonlight wash','memory pockets'],color:'#D9FF55',ink:'#17102B',art:0},
 {key:'jelly',name:'Jelly Radio',description:'A floating jellyfish broadcasting the feelings of a city.',features:['feeling frequencies','floating antenna'],color:'#FF43B4',ink:'#17102B',art:1},
 {key:'garden',name:'Pocket Planet',description:'A pocket-sized garden that grows new worlds from whispers.',features:['whisper seeds','portable worlds'],color:'#35E4EF',ink:'#17102B',art:2}
];
export function demoFusion(pair:DemoIdea[]):DemoIdea{
 if(pair.length!==2||pair[0].key===pair[1].key)throw new Error('Choose two different local ideas.');
 const keys=pair.map(p=>p.key).sort().join(':');
 const names:Record<string,string>={'jelly:moon':'Moonwave FM','garden:moon':'Memory Bloom','garden:jelly':'Whisperwave'};
 return {key:'local-fusion',name:names[keys],description:`A local imagined collision of ${pair[0].name} and ${pair[1].name}. ${pair[0].features[0]} becomes the fuel for ${pair[1].features[0]}.`,features:[pair[0].features[0],pair[1].features[0],'unexpected chemistry'],color:'#D9FF55',ink:'#17102B',art:3};
}
