// Midnight Vault — tiny synthesised sounds, no audio files. Everything is
// a WebAudio oscillator blip so the game ships with zero assets: a chime
// for loot, a low sting when a guard spots you, a beep as the alarm climbs,
// and a short fanfare for the getaway.

export function createAudio() {
  return { ctx: null, muted: false, lastAlarmBeep: 0 };
}

function ensure(audio) {
  if (!audio.ctx) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      audio.ctx = new AC();
    } catch {
      audio.ctx = null;
    }
  }
  if (audio.ctx && audio.ctx.state === 'suspended') audio.ctx.resume();
  return audio.ctx;
}

function tone(audio, freq, seconds, type, gain, when = 0) {
  const ctx = ensure(audio);
  if (!ctx || audio.muted) return;
  const t0 = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + seconds + 0.05);
}

export const sfx = {
  unlock(audio) { ensure(audio); },
  pickup(audio) { tone(audio, 880, 0.12, 'sine', 0.12); tone(audio, 1318, 0.18, 'sine', 0.1, 0.07); },
  spotted(audio) { tone(audio, 196, 0.3, 'sawtooth', 0.1); tone(audio, 147, 0.35, 'sawtooth', 0.1, 0.12); },
  alarmBeep(audio) { tone(audio, 1046, 0.09, 'square', 0.05); },
  lockpick(audio) { tone(audio, 523, 0.06, 'triangle', 0.07); },
  vaultOpen(audio) { tone(audio, 392, 0.15, 'triangle', 0.1); tone(audio, 587, 0.25, 'triangle', 0.1, 0.1); },
  win(audio) {
    [523, 659, 784, 1046].forEach((f, i) => tone(audio, f, 0.22, 'triangle', 0.11, i * 0.12));
  },
  caught(audio) { tone(audio, 220, 0.4, 'sawtooth', 0.1); tone(audio, 110, 0.6, 'sawtooth', 0.1, 0.2); },
};
