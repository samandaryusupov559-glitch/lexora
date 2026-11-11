"""Render a Lexora HTML reel (reel.html + spec_<name>.js) with Playwright + ffmpeg.
Method adapted from howseen-ai/claude-motion-design (MIT): seek(t) per frame, subframe motion blur (tmix), contact sheet first.
usage: render_html.py <name> probe|full [out.mp4]"""
import sys, os, re, json, math, subprocess, tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright
HERE = Path(__file__).parent; sys.path.insert(0, str(HERE)); sys.path.insert(0, str(HERE.parent)); sys.path.insert(0, str(HERE.parent / "scripts"))
import music
FPS, SUB, SHUTTER = 30, 3, 0.5
name, mode = sys.argv[1], sys.argv[2]
spec_src = (HERE / f"spec_{name}.js").read_text()
page_file = HERE / f"_page_{name}.html"; page_file.write_text((HERE / "reel.html").read_text().replace("SPECFILE", f"spec_{name}.js"))

def events(spec):
    beat = 60 / spec["bpm"]; ev, t = [], 0.0
    for i, s in enumerate(spec["scenes"]):
        if i: ev.append((t, "whoosh"))
        k = s["type"]
        if k == "hook": ev.append((t, "pop"))
        elif k == "fix": ev += [(t + 0.05, "pop"), (t + 0.95, "buzz"), (t + 1.38, "ding")] + [(t + 2.05 + j * 0.05, "word") for j in range(0, len(s["note"].split()), 2)]
        elif k == "beat": ev += [(t + 0.02 + j * 0.07, "word") for j in range(len(s["big"].split()))]
        elif k == "cta": ev += [(t + 0.05 + j * 0.06, "word") for j in range(len(s["big"].split()))] + [(t + 0.75 + j * 0.16, "pop") for j in range(len(s["icons"]))]
        t += s["beats"] * beat
    return ev, t

with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={"width": 1080, "height": 1920}, device_scale_factor=1)
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e))); pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.goto(page_file.as_uri()); pg.wait_for_function("window.ready === true", timeout=60000)
    spec = pg.evaluate("window.SPEC"); T = pg.evaluate("window.T")
    def shot(t, path=None):
        pg.evaluate(f"window.seek({t}); new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))")
        return pg.screenshot(path=path, type="jpeg", quality=93)
    if mode == "probe":
        from PIL import Image, ImageDraw
        import io
        ts = []; acc = 0
        for s in spec["scenes"]:
            d = s["beats"] * 60 / spec["bpm"]; ts += [acc, acc + 0.12, acc + d * 0.35, acc + d * 0.6, acc + d - 0.25]; acc += d
        cols = 10; sh = Image.new("RGB", (cols * 274, math.ceil(len(ts) / cols) * 484))
        for k, t in enumerate(ts):
            im = Image.open(io.BytesIO(shot(t))).resize((270, 480)); dd = ImageDraw.Draw(im); dd.line([0, 62, 270, 62], fill=(255, 0, 0)); dd.line([0, 395, 270, 395], fill=(255, 0, 0))
            sh.paste(im, ((k % cols) * 274 + 2, (k // cols) * 484 + 2))
        out = HERE / f"probe_{name}.jpg"; sh.save(out, quality=86); print("probe ->", out, "T =", round(T, 2), "errors:", errs[:5])
    elif mode == "chunk":
        k, nchunks, out = int(sys.argv[3]), int(sys.argv[4]), sys.argv[5]
        n = int(round(T * FPS)); a, e = n * k // nchunks, n * (k + 1) // nchunks
        offs = [(j - (SUB - 1) / 2) * SHUTTER / (FPS * SUB) for j in range(SUB)]
        cuts = []; acc = 0
        for s in spec["scenes"]: acc += s["beats"] * 60 / spec["bpm"]; cuts.append(acc)
        ff = subprocess.Popen(["ffmpeg", "-loglevel", "error", "-y", "-f", "image2pipe", "-c:v", "mjpeg", "-framerate", str(FPS * SUB), "-i", "-",
            "-vf", f"tmix=frames={SUB},select='eq(mod(n\\,{SUB})\\,{SUB - 1})',setpts=N/{FPS}/TB,scale=out_color_matrix=bt709,format=yuv420p", "-r", str(FPS),
            "-c:v", "libx264", "-crf", "17", "-preset", "medium", "-colorspace", "bt709", out], stdin=subprocess.PIPE)
        for i in range(a, e):
            for o in offs:
                t = min(T - 1e-3, max(0.0, i / FPS + o))
                for c in cuts:
                    if (t < c) != (i / FPS < c): t = c if i / FPS >= c else c - 1e-4
                ff.stdin.write(shot(t))
        ff.stdin.close(); ff.wait(); print("chunk", k, a, e, errs[:3])
    else:
        out = sys.argv[3]; NC = 2; ev, total = events(spec); wav = out + ".wav"
        music.mix(spec.get("style", "pop"), total, ev, wav, seed=int(re.sub(r"\D", "", name) or 1), music_gain=0.55)
        parts = [f"{out}.part{k}.mp4" for k in range(NC)]
        ps = [subprocess.Popen([sys.executable, __file__, name, "chunk", str(k), str(NC), parts[k]]) for k in range(NC)]
        assert all(q.wait() == 0 for q in ps)
        lst = out + ".txt"; open(lst, "w").write("".join(f"file '{q}'\n" for q in parts))
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst, "-i", wav, "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
                        "-af", "loudnorm=I=-14:TP=-1:LRA=11", "-ar", "44100", "-shortest", "-movflags", "+faststart", out], check=True)
        for q in parts + [lst, wav]: os.remove(q)
        print("video ->", out, round(T, 2), "s")
    b.close()
