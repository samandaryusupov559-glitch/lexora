import json, sys
names=['main','happy','surprised','thinking','confident','excited','focused']
img={n:'img/%s.jpg'%n for n in names}
t=open('template.html').read()
t=t.replace('__IMG_JSON__',json.dumps(img)).replace('__DATA_JS__',open('data.js').read()).replace('__GAME_JS__',open('game.js').read())
out=sys.argv[1]
open(out,'w').write(t); print(out,len(t))
