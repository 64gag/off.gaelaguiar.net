(() => {
  const els = {
    targetHzInput: document.getElementById("targetHzInput"),
    noteSelect: document.getElementById("noteSelect"),
    selectedNoteLabel: document.getElementById("selectedNoteLabel"),
    targetDisplay: document.getElementById("targetDisplay"),
    startToneBtn: document.getElementById("startToneBtn"),
    stopToneBtn: document.getElementById("stopToneBtn"),
    gainInput: document.getElementById("gainInput"),
    startMicBtn: document.getElementById("startMicBtn"),
    stopMicBtn: document.getElementById("stopMicBtn"),
    tuneWindowInput: document.getElementById("tuneWindowInput"),
    minHzInput: document.getElementById("minHzInput"),
    maxHzInput: document.getElementById("maxHzInput"),
    confidenceInput: document.getElementById("confidenceInput"),
    detectedHz: document.getElementById("detectedHz"),
    errorHz: document.getElementById("errorHz"),
    errorCents: document.getElementById("errorCents"),
    direction: document.getElementById("direction"),
    centsBar: document.getElementById("centsBar"),
    wideScaleMinInput: document.getElementById("wideScaleMinInput"),
    wideScaleMaxInput: document.getElementById("wideScaleMaxInput"),
    fineScaleRange: document.getElementById("fineScaleRange"),
    wideScaleRange: document.getElementById("wideScaleRange"),
    wideCentsBar: document.getElementById("wideCentsBar"),
    permState: document.getElementById("permState"),
    secureState: document.getElementById("secureState"),
    mediaDevicesState: document.getElementById("mediaDevicesState"),
    ctxState: document.getElementById("ctxState"),
    sampleRate: document.getElementById("sampleRate"),
    streamState: document.getElementById("streamState"),
    rmsValue: document.getElementById("rmsValue"),
    confidenceValue: document.getElementById("confidenceValue"),
    analysisPeriod: document.getElementById("analysisPeriod"),
    framesProcessed: document.getElementById("framesProcessed"),
    framesRejected: document.getElementById("framesRejected"),
    lastError: document.getElementById("lastError"),
    eventLog: document.getElementById("eventLog"),
  };

  const NATURAL_NOTES = [
    { letter: "C", solfege: "Do", semitone: 0 },
    { letter: "D", solfege: "Re", semitone: 2 },
    { letter: "E", solfege: "Mi", semitone: 4 },
    { letter: "F", solfege: "Fa", semitone: 5 },
    { letter: "G", solfege: "Sol", semitone: 7 },
    { letter: "A", solfege: "La", semitone: 9 },
    { letter: "B", solfege: "Si", semitone: 11 },
  ];

  const CHROMATIC_LETTERS = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
  ];
  const CHROMATIC_SOLFEGE = [
    "Do",
    "Do#",
    "Re",
    "Re#",
    "Mi",
    "Fa",
    "Fa#",
    "Sol",
    "Sol#",
    "La",
    "La#",
    "Si",
  ];
  const FINE_SCALE_MIN_CENTS = -100;
  const FINE_SCALE_MAX_CENTS = 100;

  const state = {
    targetHz: 440,
    rmsGate: 0.01,
    audioCtx: null,
    oscillator: null,
    toneGain: null,
    micStream: null,
    sourceNode: null,
    highpassNode: null,
    lowpassNode: null,
    analyserNode: null,
    frameBuffer: null,
    analysisTimer: null,
    permissionStatus: null,
    framesProcessed: 0,
    framesRejected: 0,
    recentPitches: [],
    smoothedPitch: null,
    currentErrorCents: null,
    lastAnalysisTs: null,
    lastError: "none",
  };

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  function freqToMidi(freq) {
    return 69 + 12 * Math.log2(freq / 440);
  }

  function nearestChromatic(freq) {
    const rawMidi = Math.round(freqToMidi(freq));
    const midi = clamp(rawMidi, 24, 108);
    const pitchClass = ((midi % 12) + 12) % 12;
    const octave = Math.floor(midi / 12) - 1;
    return {
      midi,
      octave,
      letter: CHROMATIC_LETTERS[pitchClass],
      solfege: CHROMATIC_SOLFEGE[pitchClass],
      refHz: midiToFreq(midi),
    };
  }

  function addLog(line) {
    const timestamp = new Date().toISOString().slice(11, 19);
    const existing = els.eventLog.value ? els.eventLog.value.split("\n") : [];
    existing.push(`[${timestamp}] ${line}`);
    els.eventLog.value = existing.slice(-180).join("\n");
    els.eventLog.scrollTop = els.eventLog.scrollHeight;
  }

  function setLastError(message) {
    state.lastError = message;
    els.lastError.textContent = message;
    els.lastError.className = "value bad";
    addLog(`ERROR: ${message}`);
  }

  function clearLastError() {
    state.lastError = "none";
    els.lastError.textContent = "none";
    els.lastError.className = "value";
  }

  function formatSigned(value, decimals = 0) {
    const absolute = Math.abs(value).toFixed(decimals);
    return `${value >= 0 ? "+" : "-"}${absolute}`;
  }

  function normalizeWideScaleRange() {
    let min = Number(els.wideScaleMinInput.value);
    let max = Number(els.wideScaleMaxInput.value);

    if (!Number.isFinite(min)) {
      min = -300;
    }
    if (!Number.isFinite(max)) {
      max = 300;
    }

    min = clamp(min, -2400, 2399);
    max = clamp(max, -2399, 2400);

    if (min > max) {
      const nextMin = max;
      const nextMax = min;
      min = nextMin;
      max = nextMax;
    }

    if (min === max) {
      if (max < 2400) {
        max += 1;
      } else {
        min -= 1;
      }
    }

    if (min > 0) {
      min = 0;
    }
    if (max < 0) {
      max = 0;
    }

    els.wideScaleMinInput.value = String(min);
    els.wideScaleMaxInput.value = String(max);
    return { min, max };
  }

  function updateScaleLabels() {
    const wideRange = normalizeWideScaleRange();
    els.fineScaleRange.textContent = `Fine scale range: ${formatSigned(FINE_SCALE_MIN_CENTS)} to ${formatSigned(
      FINE_SCALE_MAX_CENTS,
    )} cents (fixed)`;
    els.wideScaleRange.textContent = `Wide scale range: ${formatSigned(wideRange.min)} to ${formatSigned(
      wideRange.max,
    )} cents`;
    return wideRange;
  }

  function updateMeterPosition(meterEl, errorCents, minCents, maxCents) {
    const clamped = clamp(errorCents, minCents, maxCents);
    const pct = ((clamped - minCents) / (maxCents - minCents)) * 100;
    meterEl.style.left = `${pct}%`;
  }

  function resetMeterPositions() {
    const wideRange = updateScaleLabels();
    updateMeterPosition(
      els.centsBar,
      0,
      FINE_SCALE_MIN_CENTS,
      FINE_SCALE_MAX_CENTS,
    );
    updateMeterPosition(els.wideCentsBar, 0, wideRange.min, wideRange.max);
  }

  function updateEnvironmentDiagnostics() {
    els.secureState.textContent = window.isSecureContext ? "yes" : "no";
    els.mediaDevicesState.textContent = navigator.mediaDevices
      ? "available"
      : "missing";
  }

  async function setupPermissionMonitoring() {
    if (!navigator.permissions || !navigator.permissions.query) {
      els.permState.textContent = "unknown";
      addLog("Permissions API unavailable; microphone state not queryable.");
      return;
    }

    try {
      const status = await navigator.permissions.query({ name: "microphone" });
      state.permissionStatus = status;
      els.permState.textContent = status.state;
      status.onchange = () => {
        els.permState.textContent = status.state;
        addLog(`Microphone permission changed: ${status.state}`);
      };
      addLog(`Microphone permission state: ${status.state}`);
    } catch (err) {
      els.permState.textContent = "unknown";
      addLog(`Permissions query failed: ${String(err)}`);
    }
  }

  async function ensureAudioContext() {
    if (!state.audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) {
        throw new Error("Web Audio API is not supported in this browser.");
      }
      state.audioCtx = new Ctx();
      state.audioCtx.onstatechange = () => {
        els.ctxState.textContent = state.audioCtx.state;
      };
      els.sampleRate.textContent = `${state.audioCtx.sampleRate} Hz`;
      addLog(`AudioContext created (${state.audioCtx.sampleRate} Hz)`);
    }

    if (state.audioCtx.state !== "running") {
      await state.audioCtx.resume();
      addLog(`AudioContext resumed: ${state.audioCtx.state}`);
    }

    els.ctxState.textContent = state.audioCtx.state;
    els.sampleRate.textContent = `${state.audioCtx.sampleRate} Hz`;
    return state.audioCtx;
  }

  function buildNoteOptions() {
    const options = [];
    for (let octave = 1; octave <= 7; octave += 1) {
      for (const note of NATURAL_NOTES) {
        const midi = (octave + 1) * 12 + note.semitone;
        const hz = midiToFreq(midi);
        const option = document.createElement("option");
        option.value = hz.toString();
        option.dataset.letter = note.letter;
        option.dataset.solfege = note.solfege;
        option.dataset.octave = String(octave);
        option.textContent = `${note.solfege}${octave} / ${note.letter}${octave} (${hz.toFixed(2)} Hz)`;
        options.push(option);
      }
    }

    els.noteSelect.replaceChildren(...options);
  }

  function syncNoteSelectionToTarget() {
    let nearestIdx = 0;
    let nearestDiff = Number.POSITIVE_INFINITY;

    for (let i = 0; i < els.noteSelect.options.length; i += 1) {
      const candidate = Number(els.noteSelect.options[i].value);
      const diff = Math.abs(candidate - state.targetHz);
      if (diff < nearestDiff) {
        nearestDiff = diff;
        nearestIdx = i;
      }
    }

    els.noteSelect.selectedIndex = nearestIdx;
  }

  function updateTargetReadouts() {
    els.targetDisplay.textContent = `${state.targetHz.toFixed(2)} Hz`;

    const nearest = nearestChromatic(state.targetHz);
    const noteText = `${nearest.solfege}${nearest.octave} / ${nearest.letter}${nearest.octave}`;
    const offsetCents = 1200 * Math.log2(state.targetHz / nearest.refHz);
    els.selectedNoteLabel.textContent = `${noteText} (offset ${offsetCents >= 0 ? "+" : ""}${offsetCents.toFixed(2)} c)`;

    if (state.oscillator && state.audioCtx) {
      state.oscillator.frequency.setTargetAtTime(
        state.targetHz,
        state.audioCtx.currentTime,
        0.015,
      );
    }
  }

  function setTargetHz(nextHz, source) {
    const parsed = Number(nextHz);
    if (!Number.isFinite(parsed)) {
      return;
    }

    state.targetHz = clamp(parsed, 20, 5000);
    els.targetHzInput.value = state.targetHz.toFixed(2);

    if (source !== "note") {
      syncNoteSelectionToTarget();
    }

    updateTargetReadouts();
  }

  function resetFeedback() {
    els.detectedHz.textContent = "--";
    els.errorHz.textContent = "--";
    els.errorCents.textContent = "--";
    els.direction.textContent = "--";
    els.detectedHz.className = "value";
    els.errorHz.className = "value";
    els.errorCents.className = "value";
    els.direction.className = "value";
    state.currentErrorCents = null;
    resetMeterPositions();
    state.recentPitches = [];
    state.smoothedPitch = null;
  }

  function computeRms(buffer) {
    let sumSq = 0;
    for (let i = 0; i < buffer.length; i += 1) {
      sumSq += buffer[i] * buffer[i];
    }
    return Math.sqrt(sumSq / buffer.length);
  }

  function parabolicInterpolate(values, tau) {
    if (tau <= 1 || tau >= values.length - 1) {
      return tau;
    }

    const a = values[tau - 1];
    const b = values[tau];
    const c = values[tau + 1];
    const denominator = a + c - 2 * b;
    if (denominator === 0) {
      return tau;
    }

    return tau + (a - c) / (2 * denominator);
  }

  function yinPitch(buffer, sampleRate, minHz, maxHz) {
    const len = buffer.length;
    const tauMin = Math.max(2, Math.floor(sampleRate / maxHz));
    const tauMax = Math.min(len - 2, Math.floor(sampleRate / minHz));

    if (tauMax <= tauMin) {
      return null;
    }

    const difference = new Float32Array(tauMax + 1);
    for (let tau = 1; tau <= tauMax; tau += 1) {
      let sum = 0;
      for (let i = 0; i < len - tau; i += 1) {
        const delta = buffer[i] - buffer[i + tau];
        sum += delta * delta;
      }
      difference[tau] = sum;
    }

    const cmnd = new Float32Array(tauMax + 1);
    cmnd[0] = 1;
    let runningSum = 0;
    for (let tau = 1; tau <= tauMax; tau += 1) {
      runningSum += difference[tau];
      cmnd[tau] = runningSum > 0 ? (difference[tau] * tau) / runningSum : 1;
    }

    const absoluteThreshold = 0.1;
    let tauEstimate = -1;
    let bestValue = 1;

    for (let tau = tauMin; tau <= tauMax; tau += 1) {
      const current = cmnd[tau];

      if (current < absoluteThreshold) {
        let localMin = current;
        while (tau + 1 <= tauMax && cmnd[tau + 1] < localMin) {
          tau += 1;
          localMin = cmnd[tau];
        }
        tauEstimate = tau;
        bestValue = localMin;
        break;
      }

      if (current < bestValue) {
        bestValue = current;
        tauEstimate = tau;
      }
    }

    if (tauEstimate === -1) {
      return null;
    }

    const refinedTau = parabolicInterpolate(cmnd, tauEstimate);
    if (!Number.isFinite(refinedTau) || refinedTau <= 0) {
      return null;
    }

    const frequency = sampleRate / refinedTau;
    if (!Number.isFinite(frequency) || frequency <= 0) {
      return null;
    }

    const confidence = clamp(1 - bestValue, 0, 1);
    return { frequency, confidence };
  }

  function median(values) {
    if (!values.length) {
      return null;
    }
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  function updateFeedback(freqHz, confidence) {
    const targetHz = state.targetHz;
    const errorHz = freqHz - targetHz;
    const errorCents = 1200 * Math.log2(freqHz / targetHz);
    const tuneWindow = clamp(Number(els.tuneWindowInput.value) || 5, 1, 100);

    let direction = "Hold pitch: you are in tune.";
    let directionClass = "good";
    if (errorCents > tuneWindow) {
      direction = `You are sharp: sing flatter (lower your pitch).`;
      directionClass = "bad";
    } else if (errorCents < -tuneWindow) {
      direction = `You are flat: sing sharper (raise your pitch).`;
      directionClass = "bad";
    }

    state.currentErrorCents = errorCents;
    els.detectedHz.textContent = `${freqHz.toFixed(2)} Hz`;
    els.errorHz.textContent = `${errorHz >= 0 ? "+" : ""}${errorHz.toFixed(2)} Hz`;
    els.errorCents.textContent = `${errorCents >= 0 ? "+" : ""}${errorCents.toFixed(2)} c`;
    els.direction.textContent = direction;

    els.detectedHz.className = "value";
    els.errorHz.className = `value ${Math.abs(errorCents) <= tuneWindow ? "good" : "warn"}`;
    els.errorCents.className = `value ${Math.abs(errorCents) <= tuneWindow ? "good" : "warn"}`;
    els.direction.className = `value ${directionClass}`;

    const wideRange = updateScaleLabels();
    updateMeterPosition(
      els.centsBar,
      errorCents,
      FINE_SCALE_MIN_CENTS,
      FINE_SCALE_MAX_CENTS,
    );
    updateMeterPosition(
      els.wideCentsBar,
      errorCents,
      wideRange.min,
      wideRange.max,
    );

    els.confidenceValue.textContent = confidence.toFixed(3);
  }

  function processAudioFrame() {
    if (!state.analyserNode || !state.frameBuffer || !state.audioCtx) {
      return;
    }

    state.analyserNode.getFloatTimeDomainData(state.frameBuffer);

    const now = performance.now();
    const period = state.lastAnalysisTs ? now - state.lastAnalysisTs : 0;
    state.lastAnalysisTs = now;

    const rms = computeRms(state.frameBuffer);
    els.rmsValue.textContent = rms.toFixed(5);
    if (period > 0) {
      els.analysisPeriod.textContent = `${period.toFixed(1)} ms`;
    }

    state.framesProcessed += 1;
    els.framesProcessed.textContent = String(state.framesProcessed);

    if (rms < state.rmsGate) {
      state.framesRejected += 1;
      els.framesRejected.textContent = String(state.framesRejected);
      return;
    }

    const minHz = clamp(Number(els.minHzInput.value) || 80, 40, 500);
    const maxHz = clamp(Number(els.maxHzInput.value) || 1200, 200, 2000);
    const confidenceThreshold = clamp(
      Number(els.confidenceInput.value) || 0.85,
      0,
      1,
    );

    const result = yinPitch(
      state.frameBuffer,
      state.audioCtx.sampleRate,
      minHz,
      maxHz,
    );
    if (
      !result ||
      result.frequency < minHz ||
      result.frequency > maxHz ||
      result.confidence < confidenceThreshold
    ) {
      state.framesRejected += 1;
      els.framesRejected.textContent = String(state.framesRejected);
      els.confidenceValue.textContent = result
        ? result.confidence.toFixed(3)
        : "0.000";
      return;
    }

    state.recentPitches.push(result.frequency);
    if (state.recentPitches.length > 7) {
      state.recentPitches.shift();
    }

    const medianPitch = median(state.recentPitches);
    if (medianPitch === null) {
      return;
    }

    const alpha = 0.35;
    state.smoothedPitch =
      state.smoothedPitch === null
        ? medianPitch
        : alpha * medianPitch + (1 - alpha) * state.smoothedPitch;

    updateFeedback(state.smoothedPitch, result.confidence);
  }

  async function startTone() {
    try {
      clearLastError();
      const ctx = await ensureAudioContext();

      if (state.oscillator) {
        stopTone();
      }

      const oscillator = ctx.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(state.targetHz, ctx.currentTime);

      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(
        clamp(Number(els.gainInput.value) || 0.12, 0, 1),
        ctx.currentTime,
      );

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.start();

      state.oscillator = oscillator;
      state.toneGain = gainNode;

      els.startToneBtn.disabled = true;
      els.stopToneBtn.disabled = false;
      addLog(`Tone playback started at ${state.targetHz.toFixed(2)} Hz`);
    } catch (err) {
      setLastError(`Tone start failed: ${String(err)}`);
    }
  }

  function stopTone() {
    if (!state.oscillator) {
      return;
    }

    try {
      state.oscillator.stop();
    } catch (_err) {
      // Oscillator may already be stopped.
    }

    state.oscillator.disconnect();
    if (state.toneGain) {
      state.toneGain.disconnect();
    }

    state.oscillator = null;
    state.toneGain = null;

    els.startToneBtn.disabled = false;
    els.stopToneBtn.disabled = true;
    addLog("Tone playback stopped");
  }

  async function startMic() {
    try {
      clearLastError();
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("getUserMedia is unavailable.");
      }

      const ctx = await ensureAudioContext();

      if (state.micStream) {
        stopMic();
      }

      const constraints = {
        audio: {
          channelCount: 1,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const source = ctx.createMediaStreamSource(stream);

      const highpass = ctx.createBiquadFilter();
      highpass.type = "highpass";
      highpass.frequency.value = 70;
      highpass.Q.value = 0.707;

      const lowpass = ctx.createBiquadFilter();
      lowpass.type = "lowpass";
      lowpass.frequency.value = 1400;
      lowpass.Q.value = 0.707;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0;

      source.connect(highpass);
      highpass.connect(lowpass);
      lowpass.connect(analyser);

      state.micStream = stream;
      state.sourceNode = source;
      state.highpassNode = highpass;
      state.lowpassNode = lowpass;
      state.analyserNode = analyser;
      state.frameBuffer = new Float32Array(analyser.fftSize);
      state.framesProcessed = 0;
      state.framesRejected = 0;
      state.lastAnalysisTs = null;
      resetFeedback();

      els.framesProcessed.textContent = "0";
      els.framesRejected.textContent = "0";
      els.streamState.textContent = "active";

      state.analysisTimer = window.setInterval(processAudioFrame, 50);

      els.startMicBtn.disabled = true;
      els.stopMicBtn.disabled = false;
      addLog("Microphone analysis started (50 ms interval, YIN detector)");
    } catch (err) {
      setLastError(`Mic start failed: ${String(err)}`);
      els.streamState.textContent = "inactive";
    }
  }

  function stopMic() {
    if (state.analysisTimer) {
      clearInterval(state.analysisTimer);
      state.analysisTimer = null;
    }

    if (state.micStream) {
      for (const track of state.micStream.getTracks()) {
        track.stop();
      }
    }

    for (const nodeKey of [
      "sourceNode",
      "highpassNode",
      "lowpassNode",
      "analyserNode",
    ]) {
      if (state[nodeKey]) {
        state[nodeKey].disconnect();
      }
      state[nodeKey] = null;
    }

    state.micStream = null;
    state.frameBuffer = null;
    state.lastAnalysisTs = null;

    els.startMicBtn.disabled = false;
    els.stopMicBtn.disabled = true;
    els.streamState.textContent = "inactive";
    els.rmsValue.textContent = "--";
    els.confidenceValue.textContent = "--";
    els.analysisPeriod.textContent = "--";
    resetFeedback();
    addLog("Microphone analysis stopped");
  }

  function bindEvents() {
    els.targetHzInput.addEventListener("change", (event) => {
      setTargetHz(event.target.value, "hz");
    });

    els.noteSelect.addEventListener("change", (event) => {
      setTargetHz(event.target.value, "note");
    });

    els.gainInput.addEventListener("input", () => {
      if (state.toneGain && state.audioCtx) {
        const gain = clamp(Number(els.gainInput.value) || 0, 0, 1);
        state.toneGain.gain.setTargetAtTime(
          gain,
          state.audioCtx.currentTime,
          0.01,
        );
      }
    });

    els.startToneBtn.addEventListener("click", startTone);
    els.stopToneBtn.addEventListener("click", stopTone);
    els.startMicBtn.addEventListener("click", startMic);
    els.stopMicBtn.addEventListener("click", stopMic);
    els.wideScaleMinInput.addEventListener("change", () => {
      const wideRange = updateScaleLabels();
      const referenceError =
        state.currentErrorCents === null ? 0 : state.currentErrorCents;
      updateMeterPosition(
        els.wideCentsBar,
        referenceError,
        wideRange.min,
        wideRange.max,
      );
    });
    els.wideScaleMaxInput.addEventListener("change", () => {
      const wideRange = updateScaleLabels();
      const referenceError =
        state.currentErrorCents === null ? 0 : state.currentErrorCents;
      updateMeterPosition(
        els.wideCentsBar,
        referenceError,
        wideRange.min,
        wideRange.max,
      );
    });

    window.addEventListener("beforeunload", () => {
      stopTone();
      stopMic();
      if (state.audioCtx) {
        state.audioCtx.close();
      }
    });
  }

  function init() {
    updateEnvironmentDiagnostics();
    buildNoteOptions();
    bindEvents();
    setTargetHz(440, "hz");
    setupPermissionMonitoring();
    els.ctxState.textContent = "not initialized";
    els.sampleRate.textContent = "--";
    els.streamState.textContent = "inactive";
    els.rmsValue.textContent = "--";
    els.confidenceValue.textContent = "--";
    els.analysisPeriod.textContent = "--";
    resetMeterPositions();
    addLog(
      "Application initialized. Click Start Tone or Start Microphone to begin audio session.",
    );
  }

  init();
})();
