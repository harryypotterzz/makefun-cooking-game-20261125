// Dapur Kilat — tiny synthesized sound effects.
// WebAudio oscillators only; no audio files, no network, nothing to load.
// Every call is guarded: if the browser has no audio, the game just stays
// quiet instead of throwing.

export function makeAudio(game) {
  let ctx = null;

  function ensure() {
    if (ctx) return ctx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    } catch {
      ctx = null;
    }
    return ctx;
  }

  function tone(freq, dur, type = 'sine', vol = 0.12, when = 0) {
    if (game.muted) return;
    const ac = ensure();
    if (!ac) return;
    try {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(vol, ac.currentTime + when);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + when + dur);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(ac.currentTime + when);
      osc.stop(ac.currentTime + when + dur + 0.02);
    } catch {
      // Silence is fine.
    }
  }

  return {
    resume() {
      const ac = ensure();
      if (ac && ac.state === 'suspended') ac.resume().catch(() => {});
    },
    play(name) {
      if (game.muted) return;
      if (name === 'add') tone(520, 0.09, 'triangle', 0.1);
      else if (name === 'pick') tone(660, 0.06, 'sine', 0.08);
      else if (name === 'bad') tone(140, 0.18, 'sawtooth', 0.07);
      else if (name === 'serve') {
        tone(523, 0.12, 'sine', 0.12);
        tone(659, 0.12, 'sine', 0.12, 0.09);
        tone(784, 0.2, 'sine', 0.12, 0.18);
      } else if (name === 'start') {
        tone(392, 0.1, 'triangle', 0.1);
        tone(523, 0.16, 'triangle', 0.1, 0.09);
      } else if (name === 'tick') tone(880, 0.05, 'square', 0.04);
      else if (name === 'expire') {
        tone(220, 0.25, 'sawtooth', 0.08);
        tone(165, 0.3, 'sawtooth', 0.08, 0.12);
      } else if (name === 'shiftend') {
        tone(523, 0.15, 'sine', 0.12);
        tone(392, 0.15, 'sine', 0.12, 0.14);
        tone(523, 0.3, 'sine', 0.12, 0.28);
      }
    },
  };
}
