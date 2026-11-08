import subprocess, sys
sys.path.insert(0, "/tmp/scripts")
from brand import *
from functools import lru_cache
W, H, FPS = 1080, 1920, 30
BASE = bg(W, H)
GREEN = (120, 232, 160)
@lru_cache(None)
def fnt(w, s): return font(w, s)
_m = Image.new("RGB", (4, 4)); _md = ImageDraw.Draw(_m)

def parse(text):
    out, hl = [], False
    for tok in text.split(" "):
        if tok.startswith("*"): hl, tok = True, tok[1:]
        end = "*" in tok; tok = tok.replace("*", "")
        out.append((tok, hl))
        if end: hl = False
    return out

def lerp(a, b, t): return tuple(int(a[i] * (1 - t) + b[i] * t) for i in range(3))

class TextScene:
    def __init__(self, blocks, pace=0.22, hold=0.8, label=None):
        self.label, self.words, ycur = label, [], 0
        cursor, n = 0.2, 0
        laid = []
        for b in blocks:
            f = fnt(b.get("w", "ExtraBold"), b.get("s", 80)); lh = int(b.get("s", 80) * 1.18)
            toks = parse(b["t"]); lines, cur, curw = [], [], 0
            for tok, hl in toks:
                tw = _md.textlength(tok + " ", font=f)
                if curw + tw > 920 and cur: lines.append(cur); cur, curw = [], 0
                cur.append((tok, hl, tw)); curw += tw
            if cur: lines.append(cur)
            laid.append((b, f, lh, lines))
        total_h = sum(len(l) * lh + b.get("gap", 40) for b, f, lh, l in laid) - laid[-1][0].get("gap", 40)
        y = 880 - total_h // 2
        for b, f, lh, lines in laid:
            cursor += b.get("delay", 0)
            for line in lines:
                x = 80
                if b.get("center"): x = 540 - int(sum(w for _, _, w in line) / 2)
                for tok, hl, tw in line:
                    col = b.get("c", WHITE); col = b.get("hc", YELLOW) if hl else col
                    self.words.append((tok, f, x, y, col, cursor))
                    x += tw; cursor += pace if b.get("s", 80) >= 60 else pace * 0.8
                y += lh
            y += b.get("gap", 40)
        nw = len(self.words)
        self.dur = max(cursor + hold, nw / 2.5 + 0.5)
    def draw(self, img, d, t):
        for tok, f, x, y, col, t0 in self.words:
            a = max(0.0, min(1.0, (t - t0) / 0.25))
            if a <= 0: continue
            e = 1 - (1 - a) ** 3
            bgc = BASE.getpixel((min(W - 1, x + 20), min(H - 1, y + 20)))
            d.text((x, y + int(26 * (1 - e))), tok, font=f, fill=lerp(bgc, col, e))

class CountScene:
    def __init__(self, line1, line2, secs=3.0):
        self.l1, self.l2, self.secs = line1, line2, secs; self.dur = secs + 0.6
        self.f1, self.f2 = fnt("Black", 92), fnt("ExtraBold", 60)
    def draw(self, img, d, t):
        d.text((540, 520), self.l1, font=self.f1, fill=WHITE, anchor="mm")
        d.text((540, 640), self.l2, font=self.f2, fill=SOFT, anchor="mm")
        d.rounded_rectangle([80, 760, W - 80, 960], radius=40, fill=(38, 66, 175), outline=(120, 150, 240), width=4)
        d.text((540, 860), self.l2b if hasattr(self, "l2b") else "", font=fnt("ExtraBold", 66), fill=WHITE, anchor="mm")
        cx, cy, r = 540, 1240, 150
        d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(60, 90, 190), width=22)
        k = min(t, self.secs); left = max(0, int(self.secs - k) + (1 if k < self.secs else 0))
        d.arc([cx - r, cy - r, cx + r, cy + r], -90, -90 + 360 * (k / self.secs), fill=CORAL, width=22)
        d.text((cx, cy), str(left) if left else "!", font=fnt("Black", 150), fill=WHITE, anchor="mm")

class FixScene:
    def __init__(self, wrong, right, note, wrong_hl):
        self.wrong, self.right, self.note, self.hl = wrong, right, note, wrong_hl
        self.dur = 6.0
        self.fw, self.fr, self.fn = fnt("ExtraBold", 70), fnt("Black", 84), fnt("Bold", 54)
    def draw(self, img, d, t):
        d.text((80, 470), self.wrong, font=self.fw, fill=CORAL)
        wl = d.textlength(self.wrong, font=self.fw)
        k = max(0, min(1, (t - 0.5) / 0.5))
        if k > 0: d.line([80, 515, 80 + wl * k, 515], fill=WHITE, width=9)
        if t > 1.4:
            words = self.right.split(" "); n = min(len(words), int((t - 1.4) / 0.28) + 1)
            d.text((80, 640), " ".join(words[:n]), font=self.fr, fill=GREEN)
        if t > 3.0:
            y = 860
            for i, ln in enumerate(self.note):
                a = max(0, min(1, (t - 3.0 - i * 0.7) / 0.3))
                if a > 0:
                    bgc = BASE.getpixel((100, y + 10)); d.text((80, y + int(20 * (1 - a))), ln, font=self.fn, fill=lerp(bgc, SOFT if i else WHITE, a))
                y += 80

def render(scenes, out, handle="lexora_markazi", counters=None):
    total = sum(s.dur for s in scenes)
    cmd = ["ffmpeg", "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
           "-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo", "-shortest", "-c:v", "libx264", "-preset", "veryfast", "-crf", "21",
           "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "32k", "-movflags", "+faststart", out + ".tmp.mp4"]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    g = 0.0; cf = fnt("ExtraBold", 40); hf = fnt("SemiBold", 34)
    for si, s in enumerate(scenes):
        nf = int(s.dur * FPS)
        for i in range(nf):
            t = i / FPS
            img = BASE.copy(); d = ImageDraw.Draw(img)
            s.draw(img, d, t)
            lab = getattr(s, "label", None)
            if lab: chip(d, (80, 270), lab, cf, YELLOW, (20, 30, 90))
            frac = min(1, (g + t) / total)
            d.rounded_rectangle([80, 1470, W - 80, 1480], radius=5, fill=(60, 90, 190))
            if frac > 0: d.rounded_rectangle([80, 1470, 80 + int((W - 160) * frac), 1480], radius=5, fill=CORAL)
            d.text((80, 1510), "L.", font=fnt("Black", 44), fill=WHITE); d.text((150, 1516), handle, font=hf, fill=SOFT)
            p.stdin.write(img.tobytes())
        g += s.dur
    p.stdin.close(); p.wait()
    import os; os.replace(out + ".tmp.mp4", out)
    print(out, round(total, 1), "s")
