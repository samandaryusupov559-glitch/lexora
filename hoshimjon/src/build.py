import json, sys
img={}
t=open('template.html').read()
t=t.replace('__IMG_JSON__',json.dumps(img)).replace('__DATA_JS__',open('data.js').read()).replace('__GAME_JS__',open('game.js').read().replace('/*__LIVE__*/',open('live.js').read()).replace('/*__WORLD1__*/',open('world1.js').read()).replace('/*__WORLD__*/',open('world.js').read()).replace('/*__PACKS__*/',open('packs.js').read()))
out=sys.argv[1]
open(out,'w').write(t); print(out,len(t))
