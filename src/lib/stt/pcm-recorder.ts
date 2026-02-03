/**
 * PCMRecorder - Captures raw PCM audio using AudioWorklet.
 * Provides a MediaRecorder-like interface for compatibility.
 * Outputs 16kHz mono Int16 PCM samples.
 */

export type PCMRecorderState = "inactive" | "recording";

export class PCMRecorder {
  private audioContext: AudioContext | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private stream: MediaStream;
  private onData: (samples: Int16Array) => void;
  private _state: PCMRecorderState = "inactive";
  private inputSampleRate: number = 48000;
  private outputSampleRate: number = 16000;
  private resampleBuffer: Float32Array = new Float32Array(0);

  constructor(stream: MediaStream, onData: (samples: Int16Array) => void) {
    this.stream = stream;
    this.onData = onData;
  }

  get state(): PCMRecorderState {
    return this._state;
  }

  async start(): Promise<void> {
    if (this._state === "recording") return;

    // Create AudioContext - use default sample rate, we'll resample
    this.audioContext = new AudioContext();
    this.inputSampleRate = this.audioContext.sampleRate;

    // Load the worklet processor
    await this.audioContext.audioWorklet.addModule(
      "/audio-worklet/pcm-processor.js"
    );

    // Create source from microphone stream
    this.sourceNode = this.audioContext.createMediaStreamSource(this.stream);

    // Create worklet node
    this.workletNode = new AudioWorkletNode(
      this.audioContext,
      "pcm-processor"
    );

    // Handle messages from worklet
    this.workletNode.port.onmessage = (event) => {
      if (event.data.type === "audio") {
        const inputSamples = event.data.samples as Float32Array;
        const resampledSamples = this.resample(inputSamples);
        const pcmSamples = this.convertToInt16(resampledSamples);
        this.onData(pcmSamples);
      }
    };

    // Connect: microphone -> worklet -> (nowhere, we just capture)
    this.sourceNode.connect(this.workletNode);
    // Don't connect to destination - we don't want to hear ourselves

    this._state = "recording";
  }

  stop(): void {
    if (this._state === "inactive") return;

    // Disconnect and cleanup
    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode.port.close();
      this.workletNode = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this._state = "inactive";
  }

  /**
   * Resample from input sample rate to 16kHz using linear interpolation.
   */
  private resample(inputSamples: Float32Array): Float32Array {
    const ratio = this.inputSampleRate / this.outputSampleRate;

    // Combine with leftover samples from previous chunk
    const combined = new Float32Array(
      this.resampleBuffer.length + inputSamples.length
    );
    combined.set(this.resampleBuffer);
    combined.set(inputSamples, this.resampleBuffer.length);

    // Calculate output length
    const outputLength = Math.floor(combined.length / ratio);
    const output = new Float32Array(outputLength);

    // Linear interpolation resampling
    for (let i = 0; i < outputLength; i++) {
      const srcIndex = i * ratio;
      const srcIndexFloor = Math.floor(srcIndex);
      const srcIndexCeil = Math.min(srcIndexFloor + 1, combined.length - 1);
      const fraction = srcIndex - srcIndexFloor;

      output[i] =
        combined[srcIndexFloor]! * (1 - fraction) +
        combined[srcIndexCeil]! * fraction;
    }

    // Save leftover samples for next chunk
    const samplesUsed = Math.floor(outputLength * ratio);
    this.resampleBuffer = combined.slice(samplesUsed);

    return output;
  }

  /**
   * Convert Float32 samples [-1, 1] to Int16 [-32768, 32767].
   */
  private convertToInt16(samples: Float32Array): Int16Array {
    const pcm = new Int16Array(samples.length);
    for (let i = 0; i < samples.length; i++) {
      const sample = samples[i]!;
      pcm[i] = Math.max(-32768, Math.min(32767, Math.round(sample * 32767)));
    }
    return pcm;
  }
}
