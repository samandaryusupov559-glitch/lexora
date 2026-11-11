"""Lexora reel engine v2: animated background, word pops, quiz timers, A/B choices, typed-entry demo,
icon CTA, beat-synced scenes and an original synthesized music + sound-effects track (music.py).
Safe zones: nothing above y=250 or below y=1580."""
import subprocess, sys, os, math
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from brand import *
import music
from functools import lru_cache
W, H, FPS = 1080, 1920, 30
BASE = bg(W, H)
GREEN = (120, 232, 160); DARK = (20, 30, 90); CARD = (38, 66, 175); EDGE = (120, 150, 240); PAPER = (244, 246, 255)
@lru_cache(None)
def fnt(w, s): return font(w, int(s))
_m = Image.new("RGB", (4, 4)); _md = ImageDraw.Draw(_m)
def tw(text, f): return _md.textlength(text, font=f)
def fit(text, w, size, maxw=920, minsize=40):
    while size > minsize and tw(text, fnt(w, size)) > maxw: size -= 2
    return size
def clamp(x, a=0.0, b=1.0): return max(a, min(b, x))
def lerp(a, b, t): return tuple(int(a[i] * (1 - t) + b[i] * t) for i in range(3))
def back(a):  # ease-out-back
    c1, c3 = 1.70158, 2.70158; a = clamp(a) - 1
    return 1 + c3 * a ** 3 + c1 * a ** 2
def bgc(x, y): return BASE.getpixel((int(clamp(x, 0, W - 1)), int(clamp(y, 0, H - 1))))

def parse(text):
    out, hl = [], False
    for tok in text.split(" "):
        if tok.startswith("*"): hl, tok = True, tok[1:]
        end = "*" in tok; tok = tok.replace("*", "")
        out.append((tok, hl))
        if end: hl = False
    return out

def pop_text(d, cx, cy, text, w, size, col, a, anchor="mm"):
    """Draw text popping in (a: 0..1)."""
    if a <= 0: return
    e = clamp(a); sc = 0.72 + 0.28 * back(a)
    d.text((cx, cy), text, font=fnt(w, max(8, int(size * sc / 2) * 2)), fill=lerp(bgc(cx, cy), col, min(1, e * 1.6)), anchor=anchor)

class Scene:
    label = None
    def events(self): return []

class TextScene(Scene):
    """Blocks of text revealed word by word. *word* = highlighted (yellow + coral underline)."""
    def __init__(self, blocks, pace=0.16, hold=0.7, label=None, instant=False, cy=860, maxw=920):
        self.label, self.words, self.instant = label, [], instant
        cursor, laid = (-2.0 if instant else 0.12), []
        for b in blocks:
            s = b.get("s", 80)
            while s > 48 and max(tw(tok, fnt(b.get("w", "ExtraBold"), s)) for tok, _ in parse(b["t"])) > maxw: s -= 4
            f = fnt(b.get("w", "ExtraBold"), s); lh = int(s * 1.2)
            lines, cur, curw = [], [], 0
            for tok, hl in parse(b["t"]):
                w_ = tw(tok + " ", f)
                if curw + w_ > maxw and cur: lines.append(cur); cur, curw = [], 0
                cur.append((tok, hl, w_)); curw += w_
            if cur: lines.append(cur)
            laid.append((b, s, f, lh, lines))
        total_h = sum(len(l) * lh + b.get("gap", 40) for b, s, f, lh, l in laid) - laid[-1][0].get("gap", 40)
        y = cy - total_h // 2
        for b, s, f, lh, lines in laid:
            cursor += 0 if instant else b.get("delay", 0)
            for line in lines:
                lw = sum(w_ for _, _, w_ in line) - tw(" ", f)
                x = (W - lw) / 2 if b.get("center", True) else 80
                for i, (tok, hl, w_) in enumerate(line):
                    ww = tw(tok, f); col = b.get("hc", YELLOW) if hl else b.get("c", WHITE)
                    nxt = i + 1 < len(line) and line[i + 1][1]
                    self.words.append(dict(t=tok, w=b.get("w", "ExtraBold"), s=s, cx=x + ww / 2, cy=y + lh / 2, x=x, ww=ww, uw=(w_ if (hl and nxt) else ww),
                                           col=col, hl=hl, t0=cursor, y=y, lh=lh, tick=s >= 56))
                    x += w_; cursor += 0.03 if instant else (pace if s >= 60 else pace * 0.7)
                y += lh
            y += b.get("gap", 40)
        self.dur = (len(self.words) / 3.6 + 0.5) if instant else max(cursor + hold, len(self.words) / 2.5 + 0.5)
    def events(self):
        if self.instant: return [(0.0, "pop")]
        return [(w["t0"], "word") for w in self.words if w["tick"]]
    def draw(self, img, d, t):
        for w in self.words:
            a = (t - w["t0"]) / 0.2
            if a <= 0: continue
            pop_text(d, w["cx"], w["cy"], w["t"], w["w"], w["s"], w["col"], a)
            if w["hl"] and w["s"] >= 60:
                k = clamp((t - w["t0"] - 0.12) / 0.22)
                if k > 0:
                    yy = w["y"] + w["lh"] * 0.97; th = max(6, w["s"] // 12)
                    d.rounded_rectangle([w["x"], yy, w["x"] + w["uw"] * k, yy + th], radius=th // 2, fill=CORAL)

def ring(d, cx, cy, r, frac, left, width=20):
    d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(60, 90, 190), width=width)
    if frac > 0: d.arc([cx - r, cy - r, cx + r, cy + r], -90, -90 + 360 * clamp(frac), fill=CORAL, width=width)
    d.text((cx, cy), str(left) if left else "!", font=fnt("Black", int(r * 0.95)), fill=WHITE, anchor="mm")

class CountScene(Scene):
    """'Find the mistake': title, sentence card, ring countdown."""
    def __init__(self, title, sub, sentence, secs=3.0, label=None):
        self.title, self.sub, self.sentence, self.secs, self.label = title, sub, sentence, secs, label
        self.dur = secs + 0.15; self.ss = fit(sentence, "ExtraBold", 72, 840)
    def events(self): return [(0.0, "pop")] + [(i, "tick") for i in range(int(self.secs))]
    def draw(self, img, d, t):
        pop_text(d, 540, 500, self.title, "Black", fit(self.title, "Black", 100), WHITE, t / 0.2)
        d.text((540, 610), self.sub, font=fnt("ExtraBold", 56), fill=SOFT, anchor="mm")
        d.rounded_rectangle([80, 720, W - 80, 930], radius=40, fill=CARD, outline=EDGE, width=4)
        pop_text(d, 540, 825, self.sentence, "ExtraBold", self.ss, WHITE, (t - 0.1) / 0.2)
        k = min(t, self.secs); left = max(0, math.ceil(self.secs - k))
        pulse = 1 + 0.06 * max(0, 1 - (k % 1) / 0.25)
        ring(d, 540, 1200, int(150 * pulse), k / self.secs, left, 22)

class FixScene(Scene):
    """Wrong phrase gets struck out, the right one pops in, then a one-line reason."""
    def __init__(self, wrong, right, note, label=None, tags=("НЕВЕРНО", "ВЕРНО"), hold=0.5):
        self.wrong, self.right, self.note, self.label, self.tags = wrong, right, note, label, tags
        self.sw = fit(wrong, "ExtraBold", 92); self.sr = fit(right, "Black", 116)
        self.nl = [(ln, fit(ln.replace("*", ""), "Bold", 60)) for ln in note]
        nwords = sum(len(l.split()) for l in note)
        self.dur = 1.9 + max(0.9, nwords / 3.0) + hold
    def events(self): return [(0.0, "pop"), (0.75, "buzz"), (1.15, "ding")] + [(1.9 + i * 0.45, "word") for i in range(len(self.note))]
    def draw(self, img, d, t):
        cf = fnt("ExtraBold", 34)
        chip(d, (80, 420), self.tags[0], cf, CORAL, WHITE)
        sh = int(14 * math.sin((t - 0.75) * 60) * max(0, 1 - (t - 0.75) / 0.3)) if t > 0.75 else 0
        fw = fnt("ExtraBold", self.sw)
        col = lerp(CORAL, (150, 110, 150), clamp((t - 1.1) / 0.4))
        if t / 0.2 < 1: pop_text(d, 80 + tw(self.wrong, fw) / 2, 560, self.wrong, "ExtraBold", self.sw, CORAL, t / 0.2)
        else: d.text((80 + sh, 560), self.wrong, font=fw, fill=col, anchor="lm")
        k = clamp((t - 0.75) / 0.3)
        if k > 0: d.line([70 + sh, 566, 70 + sh + (tw(self.wrong, fw) + 20) * k, 566], fill=WHITE, width=10)
        if t > 1.1:
            chip(d, (80, 700), self.tags[1], cf, GREEN, DARK)
            fr = fnt("Black", self.sr); x = 80
            for i, wd in enumerate(self.right.split(" ")):
                ww = tw(wd, fr); a = (t - 1.15 - i * 0.1) / 0.2
                pop_text(d, x + ww / 2, 850, wd, "Black", self.sr, GREEN, a); x += tw(wd + " ", fr)
        y = 1030
        for i, (ln, s) in enumerate(self.nl):
            a = clamp((t - 1.9 - i * 0.45) / 0.25)
            if a > 0:
                x = 80
                for tok, hl in parse(ln):
                    f = fnt("Bold", s); d.text((x, y + int(18 * (1 - a))), tok, font=f, fill=lerp(bgc(x, y), YELLOW if hl else (WHITE if i == 0 else SOFT), a)); x += tw(tok + " ", f)
            y += int(s * 1.4)

class ChoiceScene(Scene):
    """Question with two answer cards and a shrinking timer bar; the right card turns green."""
    def __init__(self, question, a, b, correct, secs=2.5, label=None, after=1.5, letters=("A", "B"), qs=84, hint="Выбери за 3 секунды"):
        self.q, self.opts, self.correct, self.secs, self.label, self.letters, self.hint = question, (a, b), correct, secs, label, letters, hint
        self.dur = secs + after
        f = fnt("Black", qs); self.qs = qs; self.ql = wrap(_md, question.replace("*", ""), f, 920)
        self.os = min(fit(a, "ExtraBold", 66, 700), fit(b, "ExtraBold", 66, 700))
    def events(self): return [(0.0, "pop"), (0.25, "pop"), (0.4, "pop")] + [(i, "tick") for i in range(1, int(self.secs) + 1) if i < self.secs] + [(self.secs, "ding")]
    def draw(self, img, d, t):
        y = 400
        for ln in self.ql:
            pop_text(d, 540, y + self.qs * 0.6, ln, "Black", self.qs, WHITE, t / 0.2); y += int(self.qs * 1.18)
        y += 30
        done = t >= self.secs
        k = clamp(1 - t / self.secs)
        d.rounded_rectangle([80, y, W - 80, y + 16], radius=8, fill=(60, 90, 190))
        if k > 0 and not done: d.rounded_rectangle([80, y, 80 + (W - 160) * k, y + 16], radius=8, fill=YELLOW)
        if not done: d.text((540, y + 62), self.hint, font=fnt("Bold", 42), fill=SOFT, anchor="mm")
        y += 120
        for i, txt in enumerate(self.opts):
            a = (t - 0.25 - i * 0.15) / 0.2
            if a <= 0: continue
            e = back(a); yy = y + i * 250 + int(40 * (1 - clamp(a)))
            ok = done and i == self.correct; bad = done and i != self.correct
            rk = clamp((t - self.secs) / 0.2)
            fill = lerp(CARD, GREEN, rk) if ok else (lerp(CARD, (30, 44, 120), rk) if bad else CARD)
            grow = int(10 * math.sin(clamp((t - self.secs) / 0.35) * math.pi)) if ok else 0
            d.rounded_rectangle([80 - grow, yy - grow, W - 80 + grow, yy + 210 + grow], radius=44, fill=fill, outline=GREEN if ok else EDGE, width=4)
            cc = DARK if ok else ((110, 125, 190) if bad else WHITE)
            d.ellipse([112, yy + 55, 212, yy + 155], fill=(YELLOW if i == 0 else CORAL) if not bad else (70, 85, 150))
            if ok:
                d.line([137, yy + 107, 156, yy + 128, 190, yy + 84], fill=DARK, width=12, joint="curve")
            else:
                d.text((162, yy + 105), self.letters[i], font=fnt("Black", 60), fill=DARK, anchor="mm")
            d.text((250, yy + 105), txt, font=fnt("ExtraBold", self.os), fill=cc, anchor="lm")
            if bad and rk > 0:
                d.line([250, yy + 108, 250 + tw(txt, fnt("ExtraBold", self.os)) * rk, yy + 108], fill=(110, 125, 190), width=7)

class TypeScene(Scene):
    """Journal-style demo: a sentence is typed, the viewer hunts the mistake, the teacher's correction appears."""
    def __init__(self, text, wrong, right, note, label=None, title="My day", cps=24, hunt=2.0, hunt_text="Найди ошибку раньше преподавателя", hold=2.6, who="Преподаватель"):
        self.text, self.wrong, self.right, self.note, self.label, self.title, self.cps, self.hunt, self.ht, self.who = text, wrong, right, note, label, title, cps, hunt, hunt_text, who
        self.f = fnt("SemiBold", 60); self.lh = 120
        self.lines = wrap(_md, text, self.f, 800)
        self.t_typed = 0.3 + len(text) / cps; self.t_rev = self.t_typed + 0.2 + hunt
        self.dur = self.t_rev + hold
        self.pos = []; n = 0
        for li, ln in enumerate(self.lines):
            x = 140
            for wd in ln.split(" "):
                self.pos.append((wd, x, 650 + li * self.lh, n)); x += tw(wd + " ", self.f); n += len(wd) + 1
        self.ns = fit(note.replace("*", ""), "Bold", 50, 800)
    def events(self):
        ev = [(0.3 + i / self.cps, "type") for i in range(0, len(self.text), 2)]
        ev += [(self.t_typed + 0.2 + i, "tick") for i in range(int(self.hunt))] + [(self.t_rev, "buzz"), (self.t_rev + 0.35, "ding"), (self.t_rev + 0.8, "pop")]
        return ev
    def draw(self, img, d, t):
        bot = 650 + len(self.lines) * self.lh + 30
        d.rounded_rectangle([80, 430, W - 80, bot], radius=44, fill=PAPER)
        d.text((140, 500), self.title, font=fnt("Black", 50), fill=(30, 58, 158), anchor="lm")
        d.line([140, 545, W - 140, 545], fill=(205, 212, 240), width=4)
        nchar = int(max(0, t - 0.3) * self.cps); rev = t >= self.t_rev; rk = clamp((t - self.t_rev) / 0.25)
        cx, cy = 140, 650
        for wd, x, y, n0 in self.pos:
            vis = wd[: max(0, nchar - n0)]
            if not vis: continue
            if wd.strip(".,") == self.wrong and rev:
                ww = tw(self.wrong, self.f)
                d.rounded_rectangle([x - 12, y - 6, x + ww + 12, y + 80], radius=16, fill=lerp(PAPER, (255, 214, 220), rk))
                d.text((x, y), vis, font=self.f, fill=(214, 60, 84))
                d.line([x - 6, y + 42, x - 6 + (ww + 12) * rk, y + 42], fill=(214, 60, 84), width=7)
                a = (t - self.t_rev - 0.35) / 0.2
                if a > 0:
                    fr = fnt("Black", 54); rw = tw(self.right, fr) + 44
                    yy = y - 78 + int(20 * (1 - clamp(a)))
                    d.rounded_rectangle([x + ww / 2 - rw / 2, yy, x + ww / 2 + rw / 2, yy + 74], radius=37, fill=(34, 160, 96))
                    d.text((x + ww / 2, yy + 36), self.right, font=fr, fill=WHITE, anchor="mm")
            else:
                d.text((x, y), vis, font=self.f, fill=(24, 32, 84))
            cx, cy = x + tw(vis, self.f), y
        if t < self.t_typed + 0.2 and int(t * 4) % 2 == 0: d.rectangle([cx + 6, cy + 4, cx + 12, cy + 72], fill=(30, 58, 158))
        y = bot + 50
        if self.t_typed + 0.2 <= t < self.t_rev:
            k = clamp(1 - (t - self.t_typed - 0.2) / self.hunt)
            d.rounded_rectangle([80, y, W - 80, y + 16], radius=8, fill=(60, 90, 190))
            d.rounded_rectangle([80, y, 80 + (W - 160) * k, y + 16], radius=8, fill=YELLOW)
            pop_text(d, 540, y + 90, self.ht, "ExtraBold", fit(self.ht, "ExtraBold", 54), WHITE, (t - self.t_typed - 0.2) / 0.2)
        a = (t - self.t_rev - 0.8) / 0.25
        if a > 0:
            yy = y + int(40 * (1 - clamp(a)))
            d.rounded_rectangle([80, yy, W - 80, yy + 230], radius=44, fill=CARD, outline=EDGE, width=4)
            d.ellipse([120, yy + 40, 190, yy + 110], fill=YELLOW); d.text((155, yy + 74), "L", font=fnt("Black", 44), fill=DARK, anchor="mm")
            d.text((215, yy + 75), self.who, font=fnt("ExtraBold", 44), fill=YELLOW, anchor="lm")
            x = 120
            for tok, hl in parse(self.note):
                f = fnt("Bold", self.ns); d.text((x, yy + 165), tok, font=f, fill=GREEN if hl else WHITE, anchor="lm"); x += tw(tok + " ", f)

def icon(d, kind, x, y, col):
    if kind == "save": d.polygon([(x - 32, y - 44), (x + 32, y - 44), (x + 32, y + 46), (x, y + 16), (x - 32, y + 46)], fill=col)
    elif kind == "send":
        d.polygon([(x - 50, y - 10), (x + 48, y - 44), (x + 8, y + 48), (x - 6, y + 10)], fill=col)
        d.line([(x - 6, y + 10), (x + 48, y - 44)], fill=DARK, width=6)
    elif kind == "comment":
        d.rounded_rectangle([x - 46, y - 42, x + 46, y + 22], radius=22, fill=col); d.polygon([(x - 24, y + 18), (x - 30, y + 50), (x + 6, y + 20)], fill=col)
    elif kind == "link":
        d.ellipse([x - 44, y - 44, x + 44, y + 44], outline=col, width=11)
        d.polygon([(x - 8, y - 24), (x + 26, y), (x - 8, y + 24)], fill=col)

class CTAScene(Scene):
    """Closing call to action: text + icon buttons (save / send / comment / link)."""
    def __init__(self, blocks, icons, hold=0.7, label=None):
        self.ts = TextScene(blocks, cy=720, hold=0.2); self.icons, self.label = icons, label
        self.dur = max(self.ts.dur, 1.6) + hold
    def events(self): return self.ts.events() + [(0.5 + i * 0.18, "pop") for i in range(len(self.icons))]
    def draw(self, img, d, t):
        self.ts.draw(img, d, t)
        n = len(self.icons); gap = 300 if n > 2 else 420; x0 = 540 - gap * (n - 1) / 2
        for i, (kind, lab, on) in enumerate(self.icons):
            a = (t - 0.5 - i * 0.18) / 0.22
            if a <= 0: continue
            x = x0 + i * gap; e = back(a)
            y = 1180 + int(60 * (1 - clamp(a))) - (int(16 * abs(math.sin((t - 0.9) * 4.2))) if on and t > 0.9 else 0)
            r = int(96 * (0.8 + 0.2 * e))
            d.ellipse([x - r, y - r, x + r, y + r], fill=YELLOW if on else CARD, outline=None if on else EDGE, width=4)
            icon(d, kind, x, y, DARK if on else WHITE)
            d.text((x, 1180 + 150), lab, font=fnt("ExtraBold", 40), fill=lerp(bgc(x, 1330), WHITE, clamp(a)), anchor="mm")

class StampScene(Scene):
    """A statement gets a verdict stamp (e.g. МИФ) after a short vote timer."""
    def __init__(self, tag, statement, stamp, secs=2.0, label=None, hint="Миф или правда?", after=1.3, ss=80, stamp_col=CORAL):
        self.tag, self.stamp, self.secs, self.label, self.hint, self.sc = tag, stamp, secs, label, hint, stamp_col
        self.ss = ss; self.ln = wrap(_md, statement, fnt("Black", ss), 860); self.dur = secs + after
    def events(self): return [(0.0, "pop")] + [(i, "tick") for i in range(1, int(self.secs))] + [(self.secs, "buzz"), (self.secs + 0.05, "pop")]
    def draw(self, img, d, t):
        h = len(self.ln) * int(self.ss * 1.2) + 120
        d.rounded_rectangle([80, 500, W - 80, 500 + h], radius=44, fill=CARD, outline=EDGE, width=4)
        y = 560
        for ln in self.ln:
            pop_text(d, 540, y + self.ss * 0.6, ln, "Black", self.ss, WHITE, 1); y += int(self.ss * 1.2)
        yb = 500 + h + 60
        if t < self.secs:
            k = clamp(1 - t / self.secs)
            d.rounded_rectangle([80, yb, W - 80, yb + 16], radius=8, fill=(60, 90, 190)); d.rounded_rectangle([80, yb, 80 + (W - 160) * k, yb + 16], radius=8, fill=YELLOW)
            pop_text(d, 540, yb + 100, self.hint, "Black", 76, YELLOW, (t - 0.15) / 0.2)
        else:
            a = (t - self.secs) / 0.18; sc = 1.9 - 0.9 * clamp(a)
            f = fnt("Black", int(170 * sc)); wd = tw(self.stamp, f)
            lay = Image.new("RGBA", (int(wd + 140), int(170 * sc + 110)), (0, 0, 0, 0)); ld = ImageDraw.Draw(lay)
            ld.rounded_rectangle([8, 8, lay.width - 8, lay.height - 8], radius=36, outline=self.sc + (255,), width=16, fill=(16, 30, 100, 235))
            ld.text((lay.width / 2, lay.height / 2), self.stamp, font=f, fill=self.sc + (255,), anchor="mm")
            lay = lay.rotate(-9, expand=True, resample=Image.BICUBIC)
            img.paste(lay, (int(540 - lay.width / 2), int(yb + 150 - lay.height / 2)), lay)


class SwapScene(Scene):
    """Guess the better word: a phrase with a vague verb, a short '?' beat, then the precise version."""
    def __init__(self, old, new, tr, label=None, wait=1.1, hold=1.25, tags=("ОБЫЧНО", "ТОЧНЕЕ")):
        self.old, self.new, self.tr, self.label, self.wait, self.tags = parse(old), parse(new), tr, label, wait, tags
        self.so = fit(old.replace("*", ""), "ExtraBold", 92); self.sn = fit(new.replace("*", ""), "Black", 104)
        self.dur = wait + hold
    def events(self): return [(0.0, "pop"), (self.wait - 0.05, "buzz"), (self.wait + 0.1, "ding")]
    def _line(self, d, toks, y, w, s, col, hcol, a, strike=0):
        f = fnt(w, s); x = 80
        for tok, hl in toks:
            ww = tw(tok, f); pop_text(d, x + ww / 2, y, tok, w, s, hcol if hl else col, a)
            if hl and strike > 0: d.line([x - 6, y + 4, x - 6 + (ww + 12) * strike, y + 4], fill=WHITE, width=9)
            x += tw(tok + " ", f)
    def draw(self, img, d, t):
        cf = fnt("ExtraBold", 34)
        chip(d, (80, 440), self.tags[0], cf, CORAL, WHITE)
        self._line(d, self.old, 590, "ExtraBold", self.so, WHITE, CORAL, t / 0.2, clamp((t - self.wait + 0.05) / 0.2))
        if t < self.wait:
            k = clamp(1 - t / self.wait); pulse = 1 + 0.12 * abs(math.sin(t * 7))
            d.text((540, 900), "?", font=fnt("Black", int(240 * pulse)), fill=YELLOW, anchor="mm")
            d.rounded_rectangle([340, 1080, 740, 1094], radius=7, fill=(60, 90, 190)); d.rounded_rectangle([340, 1080, 340 + 400 * k, 1094], radius=7, fill=YELLOW)
        else:
            chip(d, (80, 740), self.tags[1], cf, GREEN, DARK)
            self._line(d, self.new, 900, "Black", self.sn, WHITE, GREEN, (t - self.wait - 0.1) / 0.2)
            a = clamp((t - self.wait - 0.45) / 0.25)
            if a > 0: d.text((80, 1010 + int(18 * (1 - a))), self.tr, font=fnt("Bold", 54), fill=lerp(bgc(80, 1010), SOFT, a))

# ---------- animated background blobs ----------
def _blob(r, col, alpha):
    im = Image.new("RGBA", (r * 2, r * 2), (0, 0, 0, 0)); ImageDraw.Draw(im).ellipse([r * 0.3, r * 0.3, r * 1.7, r * 1.7], fill=col + (alpha,))
    return im.filter(ImageFilter.GaussianBlur(r * 0.22))
BLOBS = [(_blob(260, (90, 130, 255), 70), 200, 500, 150, 220, 0.23, 0.0), (_blob(220, (242, 86, 107), 60), 860, 1350, 160, 180, 0.19, 1.7),
         (_blob(180, (248, 224, 138), 34), 820, 420, 120, 160, 0.27, 3.1), (_blob(200, (120, 90, 220), 60), 220, 1300, 140, 150, 0.21, 4.4)]
def background(g):
    img = BASE.copy()
    for im, x, y, ax, ay, sp, ph in BLOBS:
        px = x + ax * math.sin(g * sp * 2 * math.pi + ph); py = y + ay * math.cos(g * sp * 2 * math.pi * 0.8 + ph)
        img.paste(im, (int(px - im.width / 2), int(py - im.height / 2)), im)
    return img

def render(scenes, out, style="pop", handle="lexora_markazi", seed=1, sheet=None, music_gain=0.55):
    beat = 60.0 / music.STYLES[style]["bpm"]; grid = beat / 2
    for s in scenes: s.dur = math.ceil(s.dur / grid - 1e-6) * grid
    total = sum(s.dur for s in scenes)
    ev, g = [], 0.0
    for i, s in enumerate(scenes):
        if i: ev.append((g, "whoosh"))
        ev += [(g + t, k) for t, k in s.events() if t < s.dur]; g += s.dur
    wav = out + ".wav"; music.mix(style, total, ev, wav, seed=seed, music_gain=music_gain)
    cmd = ["ffmpeg", "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-i", wav,
           "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-ar", "44100",
           "-shortest", "-movflags", "+faststart", out + ".tmp.mp4"]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    g = 0.0; cf = fnt("ExtraBold", 44); hf = fnt("SemiBold", 34); shots = []
    for si, s in enumerate(scenes):
        nf = int(round(s.dur * FPS))
        for i in range(nf):
            t = i / FPS
            img = background(g + t); d = ImageDraw.Draw(img)
            s.draw(img, d, t)
            if si and i < 5:   # quick slide-in between scenes
                dx = int(260 * (1 - (i + 1) / 6) ** 2); fr = background(g + t); fr.paste(img.crop((0, 0, W - dx, H)), (dx, 0)); img = fr; d = ImageDraw.Draw(img)
            if si == 0 and i < 7:   # punch-in on the hook
                z = 1 + 0.07 * (1 - i / 7) ** 2; big = img.resize((int(W * z), int(H * z)), Image.BILINEAR)
                ox, oy = (big.width - W) // 2, (big.height - H) // 2; img = big.crop((ox, oy, ox + W, oy + H)); d = ImageDraw.Draw(img)
            lab = getattr(s, "label", None)
            if lab: chip(d, (80, 275), lab, cf, YELLOW, DARK)
            frac = min(1, (g + t) / total)
            d.rounded_rectangle([80, 1470, W - 80, 1482], radius=6, fill=(60, 90, 190))
            if frac > 0: d.rounded_rectangle([80, 1470, 80 + int((W - 160) * frac), 1482], radius=6, fill=CORAL)
            d.text((80, 1510), "L.", font=fnt("Black", 44), fill=WHITE); d.text((150, 1516), handle, font=hf, fill=SOFT)
            if sheet is not None and i in (0, nf // 2, nf - 1): shots.append(img.resize((270, 480)))
            p.stdin.write(img.tobytes())
        g += s.dur
    p.stdin.close(); p.wait()
    os.replace(out + ".tmp.mp4", out); os.remove(wav)
    if sheet:
        cols = 9; rows = math.ceil(len(shots) / cols); sh = Image.new("RGB", (cols * 274, rows * 484), (0, 0, 0))
        for k, im in enumerate(shots):
            dd = ImageDraw.Draw(im); dd.line([0, 62, 270, 62], fill=(255, 0, 0)); dd.line([0, 395, 270, 395], fill=(255, 0, 0))
            sh.paste(im, ((k % cols) * 274 + 2, (k // cols) * 484 + 2))
        sh.save(sheet, quality=85)
    print(out, round(total, 1), "s", len(scenes), "scenes")
