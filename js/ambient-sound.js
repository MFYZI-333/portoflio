/* MFYZI - Cosmic ambient atmosphere: deep drone, evolving pad, space wind, crystal pings, thunder on lightning */
(function () {
  'use strict';
  const btn = document.getElementById('ambient-sound-toggle');
  if (!btn) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  let ac, master, duck, verb, on = false, built = false, pingTimer = null;
  const R = (a, b) => a + Math.random() * (b - a);

  function reverbIR(sec) {
    const len = ac.sampleRate * sec, b = ac.createBuffer(2, len, ac.sampleRate);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
    return b;
  }
  function noiseBuf(sec) { // brown noise
    const len = ac.sampleRate * sec, b = ac.createBuffer(1, len, ac.sampleRate), d = b.getChannelData(0); let l = 0;
    for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; l = (l + 0.02 * w) / 1.02; d[i] = l * 3.5; }
    return b;
  }
  function lfo(freq, depth, target) {
    const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = freq; g.gain.value = depth;
    o.connect(g).connect(target); o.start(); return o;
  }

  function build() {
    built = true; ac = new AC();
    master = ac.createGain(); master.gain.value = 0;
    duck = ac.createGain(); duck.gain.value = 1;
    master.connect(duck).connect(ac.destination);
    verb = ac.createConvolver(); verb.buffer = reverbIR(5);
    const wet = ac.createGain(); wet.gain.value = 0.7; verb.connect(wet).connect(master);

    // deep sub drone
    const dg = ac.createGain(); dg.gain.value = 0.22;
    const dlp = ac.createBiquadFilter(); dlp.type = 'lowpass'; dlp.frequency.value = 180;
    [43.65, 65.41, 87.31].forEach((f, i) => { const o = ac.createOscillator(); o.type = i ? 'triangle' : 'sine'; o.frequency.value = f; o.detune.value = R(-6, 6); o.connect(dlp); o.start(); lfo(R(.03, .08), 1.5, o.detune); });
    dlp.connect(dg); dg.connect(master); lfo(0.05, 0.07, dg.gain);

    // evolving pad (Fmaj9-ish)
    const pg = ac.createGain(); pg.gain.value = 0.05;
    const plp = ac.createBiquadFilter(); plp.type = 'lowpass'; plp.frequency.value = 700; plp.Q.value = 2;
    [174.61, 220, 261.63, 329.63, 392].forEach(f => { for (let k = 0; k < 2; k++) { const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = R(-12, 12); o.connect(plp); o.start(); lfo(R(.04, .12), 6, o.detune); } });
    plp.connect(pg); pg.connect(master); pg.connect(verb);
    lfo(0.045, 380, plp.frequency); lfo(0.03, 0.02, pg.gain);

    // space wind
    const ns = ac.createBufferSource(); ns.buffer = noiseBuf(6); ns.loop = true;
    const nbp = ac.createBiquadFilter(); nbp.type = 'bandpass'; nbp.frequency.value = 420; nbp.Q.value = 0.7;
    const ng = ac.createGain(); ng.gain.value = 0.10;
    ns.connect(nbp).connect(ng); ng.connect(master); ng.connect(verb); ns.start();
    lfo(0.06, 260, nbp.frequency); lfo(0.04, 0.05, ng.gain);
  }

  const scale = [880, 987.77, 1174.66, 1318.51, 1567.98, 1760];
  function ping() {
    if (!on) return;
    const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime;
    o.type = 'sine'; o.frequency.value = scale[(Math.random() * scale.length) | 0] * (Math.random() < .3 ? .5 : 1);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(R(.015, .035), t + .05); g.gain.exponentialRampToValueAtTime(.0001, t + R(3, 5));
    o.connect(g); g.connect(verb); g.connect(master); o.start(t); o.stop(t + 5.5);
    pingTimer = setTimeout(ping, R(5000, 13000));
  }

  function thunder() {
    if (!on) return;
    const t = ac.currentTime + R(.25, 1.4), src = ac.createBufferSource(); src.buffer = noiseBuf(4);
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(520, t); lp.frequency.exponentialRampToValueAtTime(70, t + 3.2);
    const g = ac.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.9, t + .12); g.gain.setTargetAtTime(0, t + .3, 1.0);
    src.connect(lp).connect(g); g.connect(master); g.connect(verb); src.start(t); src.stop(t + 4);
  }
  addEventListener('mfyzi:lightning', thunder);

  function setUI() {
    btn.classList.toggle('active', on); btn.classList.toggle('is-on', on);
    btn.setAttribute('aria-pressed', on);
    btn.style.opacity = on ? '1' : '.6';
    btn.style.boxShadow = on ? '0 0 18px rgba(0,230,255,.55)' : '';
    btn.style.color = on ? '#7fe9ff' : '';
  }
  function set(v) {
    if (!built) build();
    if (ac.state === 'suspended') ac.resume();
    on = v; const t = ac.currentTime;
    master.gain.cancelScheduledValues(t); master.gain.setTargetAtTime(on ? 0.55 : 0, t, on ? 1.6 : 0.4);
    clearTimeout(pingTimer); if (on) pingTimer = setTimeout(ping, 2500);
    setUI();
  }
  // capture so older handlers can't double-toggle
  btn.addEventListener('click', e => { e.stopImmediatePropagation(); set(!on); }, true);

  // lower the ambience while the music player is playing
  const pod = document.getElementById('music-player-pod');
  if (pod) new MutationObserver(() => { if (!built) return; duck.gain.setTargetAtTime(pod.classList.contains('is-playing') ? 0.25 : 1, ac.currentTime, 0.6); }).observe(pod, { attributes: true, attributeFilter: ['class'] });

  window.ambientSound = { toggle: () => set(!on), on: () => set(true), off: () => set(false) };
  setUI();
})();
