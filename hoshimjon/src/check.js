const fs=require('fs');
const src=fs.readFileSync('data.js','utf8')+';module.exports={LEX,CHAPTERS,NPCS,collectKeys,TOPICS};';
const m={exports:{}}; new Function('module',src)(m);
const {LEX,CHAPTERS,NPCS,collectKeys,TOPICS}=m.exports;
let bad=0;
for(const [k,e] of Object.entries(LEX)){ if(!e.ex.toLowerCase().includes(k.toLowerCase())){console.log('EX MISSING KEY',k,'|',e.ex);bad++;} }
const used=new Set();
for(const n of NPCS){
  const nodes=Object.entries(n.tree);
  for(const [id,nd] of nodes){
    (nd.say.match(/\{([^}]+)\}/g)||[]).forEach(x=>{const k=x.slice(1,-1);used.add(k); if(!LEX[k]){console.log('NO LEX',n.id,id,k);bad++;}});
    if(!nd.choices.some(c=>c.ok)){console.log('no ok choice',n.id,id);bad++;}
    nd.choices.forEach(c=>{ if(c.ok && c.next!=='END' && !n.tree[c.next]){console.log('bad next',n.id,id,c.next);bad++;} if(!c.ok&&!c.why){console.log('no why',n.id,id);bad++;} if(c.t.includes('{')){console.log('brace in choice');bad++;} });
  }
  if(n.idle){ (n.idle.say.match(/\{([^}]+)\}/g)||[]).forEach(x=>{const k=x.slice(1,-1);used.add(k); if(!LEX[k]){console.log('NO LEX idle',k);bad++;}}); }
}
for(const [nid,list] of Object.entries(TOPICS)){
  if(!NPCS.find(n=>n.id===nid)){console.log('topic npc missing',nid);bad++;}
  for(const tp of list){ for(const [id,nd] of Object.entries(tp.tree)){
    (nd.say.match(/\{([^}]+)\}/g)||[]).forEach(x=>{const k=x.slice(1,-1);used.add(k); if(!LEX[k]){console.log('NO LEX topic',tp.id,k);bad++;}});
    if(!nd.choices.some(c=>c.ok)){console.log('no ok choice',tp.id,id);bad++;}
    nd.choices.forEach(c=>{ if(c.ok && c.next!=='END' && !tp.tree[c.next]){console.log('bad next',tp.id,c.next);bad++;} if(!c.ok&&!c.why){console.log('no why',tp.id);bad++;} if(c.t.includes('{')){console.log('brace',tp.id);bad++;} });
  } if(!tp.tree.n1){console.log('topic without n1',tp.id);bad++;} }
}
for(const k of Object.keys(LEX)) if(!used.has(k)) console.log('unused lex',k);
for(const c of CHAPTERS){ if(!NPCS.find(n=>n.id===c.npc)){console.log('chapter npc missing',c.n);bad++;} }
console.log('bad:',bad, 'keys ch1:',collectKeys(NPCS[0]).length,'words total',Object.keys(LEX).length);
