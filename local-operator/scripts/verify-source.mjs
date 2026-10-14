import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const hash=p=>createHash('sha256').update(readFileSync(path.join(root,p))).digest('hex');
const expected='cf1a92bd0956baf2cad0f54a7d8a677c312156fa9f54188b51a5b240190ffe8e';
if(hash('contracts/creative_fusion.py')!==expected)throw new Error('STOP: canonical source SHA256 mismatch');
if(existsSync(path.join(root,'INTEGRITY.json'))){
 const files=JSON.parse(readFileSync(path.join(root,'INTEGRITY.json'),'utf8'));
 for(const [file,sha] of Object.entries(files)){if(path.isAbsolute(file)||file.includes('..')||hash(file)!==sha)throw new Error('STOP: file integrity failed: '+file);}
 console.log('PACKAGE INTEGRITY PASS: '+Object.keys(files).length+' files');
}
console.log('CANONICAL SOURCE PASS: '+expected);
