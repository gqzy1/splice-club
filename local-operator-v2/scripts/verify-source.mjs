import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const hash=p=>createHash('sha256').update(readFileSync(path.join(root,p))).digest('hex');
const expected='4a92361b30f2b504ec02e699a816bab78cac47504dafafa9a2ca158c947f07b1';
if(hash('contracts/creative_fusion.py')!==expected)throw new Error('STOP: canonical source SHA256 mismatch');
if(existsSync(path.join(root,'INTEGRITY.json'))){
 const files=JSON.parse(readFileSync(path.join(root,'INTEGRITY.json'),'utf8'));
 for(const [file,sha] of Object.entries(files)){if(path.isAbsolute(file)||file.includes('..')||hash(file)!==sha)throw new Error('STOP: file integrity failed: '+file);}
 console.log('PACKAGE INTEGRITY PASS: '+Object.keys(files).length+' files');
}
console.log('CANONICAL SOURCE PASS: '+expected);
