import {readdirSync,readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
function walk(dir=''){
 return readdirSync(path.join(root,dir),{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name,'en')).flatMap(e=>{
  const p=path.posix.join(dir,e.name);
  if(['node_modules','.git'].includes(e.name)||p==='INTEGRITY.json'||p.endsWith('.log'))return [];
  if(e.isSymbolicLink())throw new Error('STOP: symlink not allowed: '+p);
  return e.isDirectory()?walk(p):[p];
 });
}
const files=Object.fromEntries(walk().map(p=>[p,createHash('sha256').update(readFileSync(path.join(root,p))).digest('hex')]));
if(!files['dist/index.html'])throw new Error('Build fresh dist before generating release integrity');
writeFileSync(path.join(root,'INTEGRITY.json'),JSON.stringify(files,null,2)+'\n');
console.log('INTEGRITY GENERATED',Object.keys(files).length);
