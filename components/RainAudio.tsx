"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CloudRain, Volume2, VolumeX } from "lucide-react";

type AudioSession = {
  context: AudioContext;
  source: AudioBufferSourceNode;
  gain: GainNode;
};

/** Quiet, locally synthesized ambience. Audio only begins after an explicit click. */
export default function RainAudio() {
  const [enabled, setEnabled] = useState(false);
  const [starting, setStarting] = useState(false);
  const [volume, setVolume] = useState(25);
  const [error, setError] = useState("");
  const session = useRef<AudioSession | null>(null);
  const mounted = useRef(true);
  const generation = useRef(0);

  const dispose = useCallback(() => {
    generation.current += 1;
    const current = session.current;
    session.current = null;
    if (current) {
      try {
        current.source.stop();
      } catch {
        /* Already stopped. */
      }
      current.source.disconnect();
      current.gain.disconnect();
      void current.context.close().catch(() => {});
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    const stopPlayback = () => {
      dispose();
      setEnabled(false);
      setStarting(false);
    };
    const silence = () => {
      if (document.visibilityState !== "visible") stopPlayback();
    };
    document.addEventListener("visibilitychange", silence);
    window.addEventListener("pagehide", stopPlayback);
    return () => {
      mounted.current = false;
      document.removeEventListener("visibilitychange", silence);
      window.removeEventListener("pagehide", stopPlayback);
      dispose();
    };
  }, [dispose]);

  useEffect(() => {
    const current = session.current;
    if (current)
      current.gain.gain.setTargetAtTime(
        (volume / 100) * 0.2,
        current.context.currentTime,
        0.08,
      );
  }, [volume]);

  async function toggle() {
    if (enabled) {
      dispose();
      setEnabled(false);
      return;
    }
    setError("");
    setStarting(true);
    const attempt = ++generation.current;
    let pendingContext: AudioContext | null = null;
    try {
      const AudioConstructor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioConstructor) throw new Error("unsupported");
      const context = new AudioConstructor();
      pendingContext = context;
      const source = context.createBufferSource();
      const buffer = context.createBuffer(
        2,
        context.sampleRate * 3,
        context.sampleRate,
      );
      for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
        const samples = buffer.getChannelData(channel);
        let previous = 0;
        for (let i = 0; i < samples.length; i += 1) {
          const white = Math.random() * 2 - 1;
          previous = (previous + white * 0.06) / 1.06;
          samples[i] = previous * 2.8 + white * 0.13;
        }
      }
      const lowPass = context.createBiquadFilter();
      lowPass.type = "lowpass";
      lowPass.frequency.value = 4200;
      const highPass = context.createBiquadFilter();
      highPass.type = "highpass";
      highPass.frequency.value = 180;
      const gain = context.createGain();
      gain.gain.value = 0;
      source.buffer = buffer;
      source.loop = true;
      source
        .connect(lowPass)
        .connect(highPass)
        .connect(gain)
        .connect(context.destination);
      session.current = { context, source, gain };
      await context.resume();
      if (
        !mounted.current ||
        generation.current !== attempt ||
        document.visibilityState !== "visible"
      ) {
        if (context.state !== "closed") await context.close();
        return;
      }
      if (context.state !== "running") throw new Error("blocked");
      source.start();
      gain.gain.setTargetAtTime((volume / 100) * 0.2, context.currentTime, 0.2);
      setEnabled(true);
    } catch {
      const currentAttempt = generation.current === attempt;
      if (currentAttempt) dispose();
      if (pendingContext && pendingContext.state !== "closed")
        void pendingContext.close().catch(() => {});
      if (mounted.current && currentAttempt) {
        setError("Não foi possível iniciar o áudio neste navegador.");
        setStarting(false);
      }
    } finally {
      if (mounted.current && generation.current === attempt) setStarting(false);
    }
  }

  return (
    <div className={`rain-audio ${enabled ? "is-playing" : ""}`}>
      <button
        className="rain-audio-button"
        type="button"
        onClick={toggle}
        aria-pressed={enabled}
        disabled={starting}
        aria-label={enabled ? "Desligar som de chuva" : "Ligar som de chuva"}
        title="Som ambiente de chuva — não é um aviso meteorológico"
      >
        {enabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
        <span>
          {starting ? "Iniciando…" : enabled ? "Chuva ligada" : "Som de chuva"}
        </span>
        <CloudRain size={13} className="rain-audio-cloud" />
      </button>
      {enabled && (
        <label className="rain-audio-volume">
          <span>Volume</span>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={volume}
            aria-label="Volume do som de chuva"
            onChange={(event) => setVolume(Number(event.target.value))}
          />
          <output>{volume}%</output>
        </label>
      )}
      {error && (
        <p className="rain-audio-error" role="status">
          {error}
        </p>
      )}
    </div>
  );
}
