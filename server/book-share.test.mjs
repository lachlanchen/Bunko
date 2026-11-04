import {test} from 'node:test';
import assert from 'node:assert/strict';
import {request} from 'node:http';
import {createService} from './service.mjs';
test('public book share uses only the canonical cached catalogue and safe metadata',async t=>{
 let calls=0;
 const server=createService({publicUrl:'https://llm.lazying.art/bunko',encryptionKey:Buffer.alloc(32).toString('base64'),bookMirror:{enabled:true}},{fetchImpl:async url=>{calls++;assert.equal(url,'https://raw.githubusercontent.com/lachlanchen/bunko-books/main/reader-index.json');return Response.json({books:[{id:'sanshiro',title:{en:'Sanshiro <script>bad</script>'},author:'Natsume & friends'}]})}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>{server.close(r);server.closeAllConnections()}));
 const send=(path,method='GET')=>new Promise((resolve,reject)=>{const req=request({host:'127.0.0.1',port:server.address().port,path,method,headers:{Host:'llm.lazying.art'}},res=>{let body='';res.on('data',x=>body+=x);res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,body}))});req.on('error',reject);req.end()});
 const r=await send('/bunko/share/book/sanshiro');assert.equal(r.status,200);assert.match(r.body,/&lt;script&gt;/);assert.doesNotMatch(r.body,/<script>/);assert.match(r.body,/art.lazying.bunko:\/\/book\/sanshiro/);assert.match(r.body,/6815137919/);assert.equal(r.headers['set-cookie'],undefined);
 assert.equal((await send('/bunko/share/book/missing')).status,404);assert.equal((await send('/bunko/share/book/sanshiro','HEAD')).body,'');assert.equal((await send('/bunko/share/book/sanshiro?title=forged')).status,404);assert.equal(calls,1);
});
