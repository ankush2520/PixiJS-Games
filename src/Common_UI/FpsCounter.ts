import { Application, Container, Text, TextStyle } from "pixi.js";

/**
 * FPS Counter Display
 *
 * Shows current frames per second with:
 * - Smoothed averaging over recent frames for stable display
 * - Color coding: green outline for good performance
 * - Responsive sizing (smaller on mobile)
 * - Top-left corner positioning
 */
export class FpsCounter extends Container {
  private readonly app: Application;
  public readonly fpsText: Text;

  /** Circular buffer for FPS samples (for averaging) */
  private readonly fpsSamples: number[] = [];
  private readonly sampleSize = 30; // Average over ~0.5 seconds at 60fps
  private sampleIndex = 0;

  constructor(app: Application) {
    super();
    this.app = app;

    const style = new TextStyle({
      fontFamily: "monospace",
      fontSize: 24,
      fill: 0xffffff,
      stroke: { color: 0x008000, width: 3 }, // Green outline
    });

    this.fpsText = new Text({ text: "FPS: 60", style });
    this.fpsText.anchor.set(0, 0);
    this.addChild(this.fpsText);

    // Initialize samples array with 60 FPS
    for (let i = 0; i < this.sampleSize; i++) {
      this.fpsSamples.push(60);
    }

    this.resize();
    this.app.stage.addChild(this);

    this.app.ticker.add((ticker) => {
      this.update(ticker.deltaMS);
    });
  }

  resize(): void {
    const isMobile = this.app.screen.width < 600;
    const fontSize = isMobile ? 16 : 24;

    if (this.fpsText.style.fontSize !== fontSize) {
      this.fpsText.style.fontSize = fontSize;
    }

    this.position.set(8, 8);
  }

  /**
   * Updates FPS display based on frame delta time
   * Uses rolling average to smooth out fluctuations
   *
   * @param deltaMS - Time since last frame in milliseconds
   */
  update(deltaMS: number): void {
    // Calculate instantaneous FPS for this frame
    const instantFps = 1000 / Math.max(deltaMS, 0.0001);

    // Add to circular buffer
    this.fpsSamples[this.sampleIndex] = instantFps;
    this.sampleIndex = (this.sampleIndex + 1) % this.sampleSize;

    // Calculate average FPS from samples
    const sum = this.fpsSamples.reduce((acc, val) => acc + val, 0);
    const avgFps = Math.round(sum / this.sampleSize);

    this.fpsText.text = `FPS: ${avgFps}`;
  }
}
