/**
 * AudioWorklet processor for capturing raw PCM samples.
 * Collects samples and sends them to the main thread periodically.
 */
class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 2048; // ~128ms at 16kHz
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
  }

  process(inputs) {
    const input = inputs[0];
    if (input && input[0]) {
      const samples = input[0];
      for (let i = 0; i < samples.length; i++) {
        this.buffer[this.bufferIndex++] = samples[i];
        if (this.bufferIndex >= this.bufferSize) {
          // Buffer full, send to main thread
          this.port.postMessage({
            type: "audio",
            samples: this.buffer.slice(),
          });
          this.bufferIndex = 0;
        }
      }
    }
    return true; // Keep processor alive
  }
}

registerProcessor("pcm-processor", PCMProcessor);
