const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');const {execFileSync}=require('node:child_process');const {chromium}=require('../node_modules/playwright');
const root=process.cwd(),state=fs.mkdtempSync(path.join(require('node:os').tmpdir(),'netflix-fallback-test-'));
const backendName='netflix-fallback-backend-'+process.pid, proxyName='netflix-fallback-proxy-'+process.pid, networkName='netflix-fallback-test-'+process.pid;
const docker=(...args)=>execFileSync('docker',args,{stdio:['ignore','pipe','pipe'],encoding:'utf8'});
async function main(){let browser;const checks=[];
try{
 docker('network','create',networkName);
 fs.writeFileSync(path.join(state,'mode'),'healthy');
 docker('run','-d','--name',backendName,'--network',networkName,'--network-alias','app','-v',state+':/test','--entrypoint','node','netflix-clone-local:latest','-e',`require('http').createServer((q,s)=>{const bad=require('fs').readFileSync('/test/mode','utf8')==='bad';s.statusCode=bad?500:200;if(q.url==='/api/health'){s.setHeader('Content-Type','application/json');s.end(JSON.stringify({status:bad?'error':'ok'}))}else{s.end(bad?'FAILED':'APP_OK')}}).listen(3000,'0.0.0.0')`);
 docker('run','-d','--name',proxyName,'--network',networkName,'-p','127.0.0.1:18085:80','-e','LAN_HOST=localhost','-v',path.join(root,'Caddyfile')+':/etc/caddy/Caddyfile:ro','-v',path.join(root,'ops/fallback')+':/srv/fallback:ro','-v',state+':/srv/maintenance:ro','caddy:2.10.2-alpine');
 const base='http://localhost:18085';let response;for(let i=0;i<30;i++){try{response=await fetch(base);if(response.ok)break}catch{}await new Promise(r=>setTimeout(r,300))}
 assert.equal(await response.text(),'APP_OK');checks.push('healthy upstream passes through');
 fs.writeFileSync(path.join(state,'announcement.json'),'{"mode":"announce"}');
 assert.equal((await (await fetch(base+'/__maintenance')).json()).mode,'announce');
 assert.equal(await (await fetch(base+'/movies',{headers:{Accept:'text/html'}})).text(),'APP_OK');checks.push('level one announces without blocking application');
 fs.writeFileSync(path.join(state,'updating.json'),'{"mode":"update"}');
 assert.equal((await fetch(base+'/movies',{headers:{Accept:'text/html'}})).status,503);
 assert.equal((await fetch(base+'/api/example',{method:'POST'})).status,503);
 assert.equal((await fetch(base+'/api/health')).status,200);
 assert.equal((await fetch(base+'/__availability')).status,503);
 assert.equal((await (await fetch(base+'/__maintenance')).json()).mode,'update');checks.push('level two blocks pages and writes while allowing deployment health checks');
 fs.unlinkSync(path.join(state,'updating.json'));fs.unlinkSync(path.join(state,'announcement.json'));
 fs.writeFileSync(path.join(state,'mode'),'bad');
 response=await fetch(base+'/movies?test=1',{headers:{Accept:'text/html'}});assert.equal(response.status,503);assert.equal(response.headers.get('cache-control'),'no-store');assert.match(await response.text(),/Wir sind gleich wieder da/);checks.push('upstream HTTP 500 becomes static HTML 503');
 response=await fetch(base+'/api/example');assert.equal(response.status,503);assert.equal((await response.json()).error,'temporarily_unavailable');checks.push('API failures remain JSON');
 docker('stop',backendName);response=await fetch(base+'/movies',{headers:{Accept:'text/html'}});assert.equal(response.status,503);assert.match(await response.text(),/Wir sind gleich wieder da/);checks.push('connection failure serves independent page');
 fs.writeFileSync(path.join(state,'updating.json'),'{"mode":"update"}');
 browser=await chromium.launch({channel:'chrome',headless:true,args:['--disable-extensions']});const page=await browser.newPage();await page.goto(base+'/movies?test=1');await page.getByRole('heading',{name:'Ein Update. Gleich geht’s weiter.'}).waitFor();checks.push('planned update text appears');
 fs.unlinkSync(path.join(state,'updating.json'));await page.getByRole('heading',{name:'Wir sind gleich wieder da.'}).waitFor({timeout:10000});checks.push('unplanned outage text appears');
 fs.writeFileSync(path.join(state,'mode'),'healthy');docker('start',backendName);await page.getByText('APP_OK',{exact:true}).waitFor({timeout:20000});assert.equal(page.url(),base+'/movies?test=1');checks.push('automatic recovery preserves path and query');
 console.log(JSON.stringify({passed:checks},null,2));
}finally{if(browser)await browser.close();for(const name of [proxyName,backendName])try{docker('rm','-f',name)}catch{}try{docker('network','rm',networkName)}catch{}if(path.dirname(path.resolve(state))===path.resolve(require('node:os').tmpdir())&&path.basename(state).startsWith('netflix-fallback-test-'))fs.rmSync(state,{recursive:true,force:true});}
}main().catch(e=>{console.error(e.message);process.exitCode=1});
