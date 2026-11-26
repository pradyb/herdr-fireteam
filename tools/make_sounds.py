"""Synthesise the HUD sounds into mods/fireteam/sounds/*.mp3 (original tones, no samples).
  uv venv /tmp/snd && uv pip install --python /tmp/snd/bin/python numpy lameenc && /tmp/snd/bin/python tools/make_sounds.py"""
import os, numpy as np, lameenc
SR = 44100
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "mods", "fireteam", "sounds")
os.makedirs(OUT, exist_ok=True)
t = lambda d: np.arange(int(SR * d)) / SR
env = lambda x, a=0.003, k=8: np.minimum(1, x / a) * np.exp(-k * x)
def tone(f, d, k=8, h=(1, 0.3, 0.1)):
    x = t(d); return sum(a * np.sin(2 * np.pi * f * (i + 1) * x) for i, a in enumerate(h)) * env(x, k=k)
def noise(d, k=40, seed=1):
    x = t(d); return np.random.default_rng(seed).uniform(-1, 1, x.size) * env(x, 0.001, k)
def cat(*parts): return np.concatenate(parts)
def pad(a, d): return np.pad(a, (0, max(0, int(SR * d) - a.size)))
sounds = {
  "hit":   cat(pad(pad(noise(0.03, 120), 0.05) * 0.6 + tone(2100, 0.05, 70, (1,)) * 0.5, 0.05), pad(tone(1500, 0.05, 80, (1,)) * 0.35, 0.05)),
  "kill":  cat(pad(tone(880, 0.12, 14), 0.1), tone(1318, 0.6, 5, (1, 0.5, 0.2, 0.1))),
  "dmg":   (np.sin(2 * np.pi * (140 * np.exp(-6 * t(0.35))) * t(0.35)) * env(t(0.35), 0.002, 7) + noise(0.35, 18, 2) * 0.35),
  "ready": cat(pad(tone(660, 0.1, 18), 0.09), pad(tone(880, 0.1, 18), 0.09), tone(1320, 0.35, 7)),
  "info":  tone(740, 0.09, 30, (1, 0.2)),
}
for name, a in sounds.items():
    a = a / max(1e-9, np.abs(a).max()) * 0.55
    e = lameenc.Encoder(); e.set_bit_rate(96); e.set_in_sample_rate(SR); e.set_channels(1); e.set_quality(2)
    open(os.path.join(OUT, name + ".mp3"), "wb").write(e.encode((a * 32767).astype(np.int16).tobytes()) + e.flush())
    print(name, f"{a.size / SR:.2f}s")
