import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {spawn} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const web=path.join(root,'dist'),url='http://127.0.0.1:4180';
const nodeVersion=process.versions.node.split('.').map(Number);
if(nodeVersion[0]<22||(nodeVersion[0]===22&&nodeVersion[1]<12)){console.error('Node.js 22.12+ is required. Install current LTS from https://nodejs.org/ then restart.');process.exit(1);}
await import('./verify-source.mjs');
if(!existsSync(path.join(web,'index.html'))){console.error('Missing dist. Run npm run build in this directory, then restart.');process.exit(1);}
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json'};
const server=createServer(async(req,res)=>{
 if(req.headers.host!=='127.0.0.1:4180'||!['GET','HEAD'].includes(req.method)||req.headers.origin&&req.headers.origin!==url){res.writeHead(403);res.end('LOCAL ACCESS ONLY');return;}
 try{
  const pathname=decodeURIComponent(new URL(req.url,url).pathname);const file=path.resolve(web,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(web+path.sep)||!(await stat(file)).isFile()){res.writeHead(404);res.end();return;}
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Cross-Origin-Resource-Policy':'same-origin','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self' https://studio.genlayer.com; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'"});
  if(req.method==='HEAD')res.end();else res.end(await readFile(file));
 }catch{res.writeHead(404);res.end();}
});
server.on('error',error=>{console.error('STOP: port 4180 is already in use or unavailable. Close the other operator first. Do not use another port.',error.message);process.exitCode=1;});
server.listen(4180,'127.0.0.1',()=>{
 console.log('\nAUTHORIZED V2 LOCAL OPERATOR: '+url+'\nKeep this window open. No transactions start automatically.\n');
 if(process.platform==='win32'){
  const candidates=[process.env.PROGRAMFILES,process.env['PROGRAMFILES(X86)'],process.env.LOCALAPPDATA].filter(Boolean).map(p=>path.join(p,'Google','Chrome','Application','chrome.exe'));
  const chrome=candidates.find(existsSync);
  if(chrome){const child=spawn(chrome,[url],{detached:true,stdio:'ignore'});child.on('error',()=>console.log('Open Chrome manually: '+url));child.unref();}
  else console.log('Chrome not found. Open Chrome manually: '+url);
 }
});
