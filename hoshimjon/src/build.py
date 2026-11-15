import json, sys
img={}
t=open('template.html').read()
t=t.replace('__IMG_JSON__',json.dumps(img)).replace('__DATA_JS__',open('data.js').read()).replace('__GAME_JS__',open('game.js').read().replace('/*__LIVE__*/',open('live.js').read()))
out=sys.argv[1]
open(out,'w').write(t); print(out,len(t))
