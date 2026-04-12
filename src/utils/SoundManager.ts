type SoundName = "move" | "check" | "game_time" | "low_time";

const SOUND_URLS: Record<SoundName, string> = {
  move: "/sounds/move.mp3",
  check: "/sounds/check.mp3",
  game_time: "/sounds/game_time.mp3",
  low_time: "/sounds/low_time.mp3",
};

class SoundManagerClass {
  private ctx: AudioContext | null = null;
  private buffers = new Map<SoundName, AudioBuffer>();
  private unlocked = false;
  private preloaded = false;
  private rawData = new Map<SoundName, ArrayBuffer>();
  private activeSources = new Map<SoundName, { source: AudioBufferSourceNode; gain: GainNode }>();

  private getContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      // "ambient" mixes with background audio (music, podcasts) instead of interrupting it
      if ("audioSession" in navigator) {
        (navigator as any).audioSession.type = "ambient";
      }
    }
    return this.ctx;
  }

  /** Fetch raw audio data (does not require AudioContext to be unlocked). */
  async fetchAll() {
    const entries = Object.entries(SOUND_URLS) as [SoundName, string][];
    await Promise.all(
      entries.map(async ([name, url]) => {
        try {
          const res = await fetch(url);
          this.rawData.set(name, await res.arrayBuffer());
        } catch {
          // Non-critical — sound will be unavailable
        }
      })
    );
  }

  /** Decode all fetched audio data into playable buffers. Requires an unlocked AudioContext. */
  private async decodeAll() {
    if (this.preloaded) return;
    this.preloaded = true;
    const ctx = this.getContext();
    await Promise.all(
      Array.from(this.rawData.entries()).map(async ([name, data]) => {
        try {
          // decodeAudioData detaches the ArrayBuffer, so clone it
          const audioBuf = await ctx.decodeAudioData(data.slice(0));
          this.buffers.set(name, audioBuf);
        } catch {
          // Non-critical
        }
      })
    );
  }

  /** Call on first user gesture (click/touch) to unlock audio on mobile browsers. */
  unlock() {
    if (this.unlocked) return;
    this.unlocked = true;
    const ctx = this.getContext();
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    // Play a silent buffer to fully unlock audio playback
    const buf = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start(0);
    // Now that context is unlocked, decode the pre-fetched audio data
    this.decodeAll();
  }

  /** Play a preloaded sound with near-zero latency. */
  play(name: SoundName, volume = 0.5) {
    const ctx = this.ctx;
    const buffer = this.buffers.get(name);
    if (!ctx || !buffer) return;

    // Stop any currently playing instance of this sound
    this.stop(name);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.value = volume;
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start(0);

    this.activeSources.set(name, { source, gain });
    source.onended = () => {
      if (this.activeSources.get(name)?.source === source) {
        this.activeSources.delete(name);
      }
    };
  }

  /** Fade out a playing sound over the given duration (seconds), then stop it. */
  fadeOutAndStop(name: SoundName, duration: number) {
    const active = this.activeSources.get(name);
    if (!active || !this.ctx) return;
    const { gain, source } = active;
    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(0, now + duration);
    source.stop(now + duration);
  }

  /** Stop a sound immediately. */
  stop(name: SoundName) {
    const active = this.activeSources.get(name);
    if (active) {
      try { active.source.stop(); } catch { /* already stopped */ }
      this.activeSources.delete(name);
    }
  }
}

export const SoundManager = new SoundManagerClass();
