from PIL import Image, ImageDraw, ImageFont, ImageFilter
F = "/usr/share/fonts/opentype/inter/"
def font(w, s): return ImageFont.truetype(F + f"Inter-{w}.otf", s)
BLUE1, BLUE2 = (30, 58, 158), (16, 30, 100)
CORAL, YELLOW, WHITE, SOFT = (242, 86, 107), (248, 224, 138), (255, 255, 255), (170, 190, 245)
def bg(w, h):
    img = Image.new("RGB", (w, h)); px = img.load()
    for y in range(h):
        t = y / (h - 1)
        c = tuple(int(BLUE1[i] * (1 - t) + BLUE2[i] * t) for i in range(3))
        for x in range(w): px[x, y] = c
    glow = Image.new("RGB", (w, h), (0, 0, 0)); d = ImageDraw.Draw(glow)
    d.ellipse([w * 0.55, h * 0.72, w * 1.25, h * 1.15], fill=(120, 40, 90))
    glow = glow.filter(ImageFilter.GaussianBlur(160))
    return Image.blend(img, Image.composite(glow, img, glow.convert("L")), 0.55)
def wrap(d, text, f, maxw):
    lines, cur = [], ""
    for wd in text.split():
        t = (cur + " " + wd).strip()
        if d.textlength(t, font=f) <= maxw: cur = t
        else: lines.append(cur); cur = wd
    if cur: lines.append(cur)
    return lines
def chip(d, xy, text, f, fill, fg):
    w = d.textlength(text, font=f); x, y = xy
    d.rounded_rectangle([x, y, x + w + 56, y + f.size + 28], radius=(f.size + 28) // 2, fill=fill)
    d.text((x + 28, y + 12), text, font=f, fill=fg)
    return w + 56
def footer(d, W, H, handle="lexora_markazi"):
    f = font("SemiBold", 34); d.text((70, H - 90), "L.", font=font("Black", 44), fill=WHITE)
    d.text((150, H - 84), handle, font=f, fill=SOFT)
