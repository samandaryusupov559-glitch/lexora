"""Original, fully synthesized backing tracks + sound effects for Lexora reels (numpy/scipy only).
No samples and no third-party music are used, so there is nothing to license."""
import numpy as np
from scipy.signal import butter, sosfilt
SR = 44100

def _f(m): return 440.0 * 2 ** ((m - 69) / 12)
def _n(sec): return int(sec * SR)
def _filt(x, kind, fc, order=2):
    return sosfilt(butter(order, fc, kind, fs=SR, output="sos"), x)
def _add(buf, x, at, gain=1.0, pan=0.0):
    i = int(at * SR)
    if i >= len(buf) or i < 0: return
    x = x[: len(buf) - i]
    buf[i:i + len(x), 0] += x * gain * (1 - max(0, pan)); buf[i:i + len(x), 1] += x * gain * (1 + min(0, pan))

def kick():
    t = np.arange(_n(0.32)) / SR; f = 46 + 110 * np.exp(-t / 0.028)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.11)
    return s + 0.25 * np.exp(-t / 0.002) * np.sin(2 * np.pi * 1800 * t)
def clap(rng):
    n = _n(0.22); x = _filt(rng.standard_normal(n), "bandpass", [900, 3800]); t = np.arange(n) / SR
    env = sum(np.where(t >= d, np.exp(-(t - d) / 0.012), 0) for d in (0, 0.011, 0.022)) * 0.5 + np.where(t >= 0.03, np.exp(-(t - 0.03) / 0.07), 0)
    return x * env
def hat(rng, tau=0.02):
    n = _n(0.12); t = np.arange(n) / SR
    return _filt(rng.standard_normal(n), "highpass", 7500) * np.exp(-t / tau)
def pluck(freq, dur=0.5, bright=8):
    t = np.arange(_n(dur)) / SR; s = np.zeros_like(t)
    for k in range(1, bright + 1):
        if freq * k > 9000: break
        s += np.sin(2 * np.pi * freq * k * t) / k * np.exp(-t * (3.0 + 2.2 * k))
    a = np.minimum(1, t / 0.004)
    return s * a
def bass(freq, dur=0.3):
    t = np.arange(_n(dur)) / SR
    s = np.sin(2 * np.pi * freq * t) + 0.35 * np.sin(4 * np.pi * freq * t) + 0.12 * np.sin(6 * np.pi * freq * t)
    return s * np.minimum(1, t / 0.006) * np.exp(-t / (dur * 0.6)) * np.minimum(1, (dur - t) / 0.02)
def pad(freqs, dur):
    t = np.arange(_n(dur)) / SR; s = np.zeros_like(t)
    for f in freqs:
        for det in (-0.004, 0.004):
            s += np.sin(2 * np.pi * f * (1 + det) * t) + 0.3 * np.sin(4 * np.pi * f * (1 + det) * t)
    env = np.minimum(1, t / 0.08) * np.minimum(1, (dur - t) / 0.15)
    return _filt(s, "lowpass", 1800) * env / (2 * len(freqs))
def bell(freq, dur=0.6):
    t = np.arange(_n(dur)) / SR
    return (np.sin(2 * np.pi * freq * t) * np.exp(-t / 0.18) + 0.35 * np.sin(2 * np.pi * freq * 2.0 * t) * np.exp(-t / 0.07)
            + 0.15 * np.sin(2 * np.pi * freq * 3.01 * t) * np.exp(-t / 0.04)) * np.minimum(1, t / 0.003)

# chord = (root midi, [intervals])
STYLES = {
    # bright pop, four-on-the-floor
    "pop": dict(bpm=120, prog=[(60, [0, 4, 7]), (55, [0, 4, 7]), (57, [0, 3, 7]), (53, [0, 4, 7])],
                kick=[0, 4, 8, 12], clap=[4, 12], bass=[0, 3, 6, 8, 11, 14], stab=[0, 3, 6, 10, 12], mel=[0, 2, 4, 7, 8, 10, 12, 14], swing=0.0),
    # relaxed lo-fi groove
    "lofi": dict(bpm=100, prog=[(65, [0, 4, 7, 11]), (64, [0, 3, 7, 10]), (62, [0, 3, 7, 10]), (60, [0, 4, 7, 11])],
                 kick=[0, 7, 8], clap=[4, 12], bass=[0, 7, 8, 14], stab=[0, 6, 10], mel=[0, 3, 6, 8, 11, 14], swing=0.12),
    # driving minor
    "drive": dict(bpm=120, prog=[(57, [0, 3, 7]), (53, [0, 4, 7]), (60, [0, 4, 7]), (55, [0, 4, 7])],
                  kick=[0, 4, 8, 11, 12], clap=[4, 12], bass=[0, 2, 4, 6, 8, 10, 12, 14], stab=[0, 3, 6, 8, 11, 14], mel=[0, 4, 6, 8, 12, 14], swing=0.0),
    # light and playful (quiz)
    "play": dict(bpm=110, prog=[(62, [0, 4, 7]), (59, [0, 3, 7]), (55, [0, 4, 7]), (57, [0, 4, 7])],
                 kick=[0, 6, 8], clap=[4, 12], bass=[0, 6, 8, 11], stab=[2, 6, 10, 14], mel=[0, 2, 3, 6, 8, 10, 11, 14], swing=0.08),
}

def track(style, dur, seed=1):
    st = STYLES[style]; rng = np.random.default_rng(seed)
    beat = 60.0 / st["bpm"]; step = beat / 4; bar = beat * 4
    n = _n(dur + 0.6); drums = np.zeros((n, 2)); mus = np.zeros((n, 2)); duck = np.ones(n)
    K, C = kick(), clap(rng)
    nbars = int(np.ceil(dur / bar))
    for b in range(nbars):
        root, iv = st["prog"][b % len(st["prog"])]; t0 = b * bar
        tm = lambda s: t0 + s * step + (st["swing"] * step if s % 2 else 0)
        fill = (b % 4 == 3)
        for s in st["kick"]:
            _add(drums, K, tm(s), 0.95); i = int(tm(s) * SR)
            if i < n:
                e = _n(0.18); seg = np.linspace(0.35, 1, e)[: n - i]; duck[i:i + len(seg)] = np.minimum(duck[i:i + len(seg)], seg)
        for s in st["clap"]: _add(drums, C, tm(s), 0.42)
        for s in range(0, 16, 2): _add(drums, hat(rng, 0.018 if s % 4 == 0 else 0.03), tm(s), 0.10 if s % 4 == 0 else 0.16, pan=0.3 if s % 4 else -0.2)
        if fill:
            for s in (13, 14, 15): _add(drums, hat(rng, 0.012), tm(s), 0.14)
            _add(drums, C, tm(14), 0.25)
        for s in st["bass"]: _add(mus, bass(_f(root - 24), step * 1.8), tm(s), 0.42)
        chord = [root + i for i in iv]
        _add(mus, pad([_f(m) for m in chord], bar), t0, 0.16)
        for s in st["stab"]:
            for j, m in enumerate(chord): _add(mus, pluck(_f(m), 0.45), tm(s), 0.085, pan=(-0.4, 0.0, 0.4, 0.2)[j % 4])
        tones = [root + 12 + i for i in iv] + [root + 24]
        for k, s in enumerate(st["mel"]):
            m = tones[(k * (2 if b % 2 else 1) + b) % len(tones)]
            x = bell(_f(m), 0.5)
            _add(mus, x, tm(s), 0.10, pan=-0.35); _add(mus, x, tm(s) + step * 1.5, 0.035, pan=0.45)
    mus *= duck[:, None]
    return drums + mus, beat

def sfx(kind, rng):
    if kind == "word":
        t = np.arange(_n(0.03)) / SR; f = 700 + 500 * t / 0.03
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.008) * 0.10
    if kind == "pop":
        t = np.arange(_n(0.09)) / SR; f = 380 + 700 * np.exp(-t / 0.02)
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.025) * 0.30
    if kind == "whoosh":
        n = _n(0.26); x = _filt(rng.standard_normal(n), "bandpass", [1200, 6000])
        return x * np.hanning(n) ** 2 * 0.16
    if kind == "tick":
        t = np.arange(_n(0.07)) / SR
        return np.sin(2 * np.pi * 880 * t) * np.exp(-t / 0.02) * 0.32
    if kind == "ding":
        return (bell(_f(88), 0.9) + bell(_f(93), 0.9) * 0.8) * 0.26
    if kind == "buzz":
        t = np.arange(_n(0.2)) / SR
        return _filt(np.sign(np.sin(2 * np.pi * 140 * t)), "lowpass", 900) * np.minimum(1, (0.2 - t) / 0.03) * 0.16
    if kind == "type":
        n = _n(0.015); return _filt(rng.standard_normal(n), "highpass", 3000) * np.exp(-np.arange(n) / SR / 0.004) * 0.07
    raise KeyError(kind)

def mix(style, dur, events, out_wav, seed=1, music_gain=0.62):
    """events: list of (time, kind). Returns beat length."""
    from scipy.io import wavfile
    rng = np.random.default_rng(seed + 100)
    m, beat = track(style, dur, seed); buf = m * music_gain
    cache = {}
    for t, k in events:
        if k not in cache or k in ("whoosh", "type"): cache[k] = sfx(k, rng)
        _add(buf, cache[k], max(0, t - (0.2 if k == "whoosh" else 0)), 1.0)
    N = _n(dur); buf = buf[:N]
    fade = _n(0.35); buf[-fade:] *= np.linspace(1, 0, fade)[:, None]
    buf[: _n(0.01)] *= np.linspace(0, 1, _n(0.01))[:, None]
    buf = np.tanh(buf * 1.5) / np.tanh(1.5) * 0.9
    wavfile.write(out_wav, SR, (buf * 32767).astype(np.int16))
    return beat
