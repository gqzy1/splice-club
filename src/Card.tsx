import type {Work} from './types';
import {shortAddress} from './domain';
const palettes=[['#DFFF63','#285BFF'],['#FF653D','#27241F'],['#285BFF','#F6F1E7'],['#EEC9F8','#285BFF']];
export function Glyph({seed=0}:{seed?:number}){
 const petals=5+(seed%4),a=seed%3;
 return <svg className="glyph" viewBox="0 0 240 200" aria-hidden="true"><g transform="translate(120 100)">{Array.from({length:petals},(_,i)=><ellipse key={i} cx="0" cy="-40" rx={22+a*8} ry="55" transform={`rotate(${i*360/petals+seed*17})`} fill="currentColor"/>)}<circle r="28" fill="var(--card-bg, #F6F1E7)"/><path d="M-12 -2h4m16 0h4M-10 10q10 12 20 0" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/></g></svg>;
}
export function Card({work,selected,onSelect,onDetails}:{work:Work;selected?:boolean;onSelect?:()=>void;onDetails:()=>void}){
 const colors=palettes[(work.id+work.name.length)%4];
 return <article className={`creation-card ${selected?'selected':''}`} style={{'--card-bg':colors[0],'--card-ink':colors[1]} as React.CSSProperties} draggable={work.kind==='seed'} onDragStart={e=>{e.dataTransfer.setData('text/plain',String(work.id));e.dataTransfer.effectAllowed='copy';}}>
 <div className="card-top"><span>{work.kind==='seed'?'SEED':'FUSED'} / {String(work.id).padStart(4,'0')}</span><span>{work.category} ↗</span></div><button className="art-button" onClick={onDetails} aria-label={`View ${work.name}`}><Glyph seed={work.id+work.name.length}/></button><h3>{work.name}</h3><p>{work.description}</p><div className="chips">{work.features.map(f=><span key={f}>{f}</span>)}</div><footer><span title={work.creator}>{shortAddress(work.creator)}</span>{work.kind==='seed'?<button onClick={onSelect} aria-pressed={!!selected}>{selected?'Selected ✓':'Splice me +'} </button>:<button onClick={onDetails}>See lineage ↗</button>}</footer></article>;
}
