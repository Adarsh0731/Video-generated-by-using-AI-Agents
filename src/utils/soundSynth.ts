/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export class PlantAudioSynth {
  private ctx: AudioContext | null = null;
  private droneOsc: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;
  private lfoOsc: OscillatorNode | null = null;
  private isDroneActive = false;

  private initCtx() {
    if (!this.ctx) {
      // Create audio context supporting browser policies (must resume on click)
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public enable(enabled: boolean) {
    if (enabled) {
      this.initCtx();
      this.startDrone();
    } else {
      this.stopDrone();
    }
  }

  private startDrone() {
    if (this.isDroneActive || !this.ctx) return;
    try {
      this.droneOsc = this.ctx.createOscillator();
      this.droneGain = this.ctx.createGain();
      this.lfoOsc = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();

      // Deep, soothing organic soil hum
      this.droneOsc.type = "triangle";
      this.droneOsc.frequency.setValueAtTime(82.41, this.ctx.currentTime); // E2 key

      // Dynamic organic volume swelling (LFO)
      this.lfoOsc.type = "sine";
      this.lfoOsc.frequency.setValueAtTime(0.25, this.ctx.currentTime); // 4 seconds swell cycle
      lfoGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

      this.droneGain.gain.setValueAtTime(0.06, this.ctx.currentTime);

      // Connect LFO to modulate gain slightly
      this.lfoOsc.connect(lfoGain);
      lfoGain.connect(this.droneGain.gain);

      this.droneOsc.connect(this.droneGain);
      this.droneGain.connect(this.ctx.destination);

      this.droneOsc.start();
      this.lfoOsc.start();
      this.isDroneActive = true;
    } catch (e) {
      console.warn("Drone Synth activation blocked. Require user interaction.", e);
    }
  }

  private stopDrone() {
    if (!this.isDroneActive) return;
    try {
      this.droneOsc?.stop();
      this.lfoOsc?.stop();
      this.droneOsc?.disconnect();
      this.lfoOsc?.disconnect();
      this.droneGain?.disconnect();
    } catch {}
    this.droneOsc = null;
    this.lfoOsc = null;
    this.droneGain = null;
    this.isDroneActive = false;
  }

  public triggerWaterDrop() {
    this.initCtx();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      // Fast sweeping pitch for drop sound (organic moisture)
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch {}
  }

  public triggerGrowthPulse() {
    this.initCtx();
    if (!this.ctx) return;
    try {
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Warm double sine wave chord (E3, G#3) for cellular development
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(164.81, this.ctx.currentTime); // E3
      osc1.frequency.exponentialRampToValueAtTime(196.00, this.ctx.currentTime + 0.3); // G3

      osc2.type = "sine";
      osc2.frequency.setValueAtTime(207.65, this.ctx.currentTime); // G#3
      osc2.frequency.exponentialRampToValueAtTime(246.94, this.ctx.currentTime + 0.3); // B3

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(this.ctx.currentTime + 0.4);
      osc2.stop(this.ctx.currentTime + 0.4);
    } catch {}
  }

  public triggerBloomSparkle() {
    this.initCtx();
    if (!this.ctx) return;
    try {
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.07, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.8);
      gain.connect(this.ctx.destination);

      // Crystalline pentatonic arpeggio sweep representing petal opening
      const notes = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50]; // C5, D5, E5, G5, A5, C6
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const o = this.ctx.createOscillator();
        o.type = "sine";
        o.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.08);
        
        const og = this.ctx.createGain();
        og.gain.setValueAtTime(0.04, this.ctx.currentTime + idx * 0.08);
        og.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + idx * 0.08 + 0.4);

        o.connect(og);
        og.connect(gain);
        o.start(this.ctx.currentTime + idx * 0.08);
        o.stop(this.ctx.currentTime + idx * 0.08 + 0.5);
      });
    } catch {}
  }

  public dispose() {
    this.stopDrone();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}

export const synth = new PlantAudioSynth();
