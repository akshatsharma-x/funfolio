// Minimal types for zzfx 1.x (the package ships none). Note: importing it creates an AudioContext immediately, so the
// sfx wrapper only imports it after a user gesture (Chrome autoplay policy — otherwise it logs a warning).
declare module "zzfx" {
  type Params = (number | undefined)[];
  export const ZZFX: {
    volume: number;
    sampleRate: number;
    audioContext: AudioContext;
    buildSamples(...parameters: Params): number[];
    playSamples(channels: number[][], volumeScale?: number, rate?: number, pan?: number, loop?: boolean): AudioBufferSourceNode;
    play(...parameters: Params): AudioBufferSourceNode;
  };
  export function zzfx(...parameters: Params): AudioBufferSourceNode;
}
