import { Container } from "pixi.js";

/**
 * Base Scene Class
 *
 * Abstract base class for all game scenes providing lifecycle hooks.
 * Scenes extend Container for PixiJS display hierarchy.
 *
 * Lifecycle methods (all optional to override):
 * - onEnter(): Called when scene becomes active
 * - onExit(): Called when scene is being removed
 * - resize(): Called when viewport dimensions change
 * - update(): Called every frame for animations/logic
 */
export class BaseScene extends Container {
  /**
   * Called when scene becomes active
   * Override to initialize scene-specific setup
   */
  onEnter(): void {
    // Optional hook for setup when scene becomes active.
  }

  /**
   * Called when scene is being removed
   * Override to clean up resources, timers, listeners
   */
  onExit(): void {
    // Optional hook for cleanup when scene is removed.
  }

  /**
   * Called when viewport dimensions change
   * Override to reposition/resize scene elements
   *
   * @param width - New viewport width in pixels
   * @param height - New viewport height in pixels
   */
  resize(width: number, height: number): void {
    // Optional hook for resize handling.
    // Parameters intentionally unused in base implementation
    void width;
    void height;
  }

  /**
   * Called every frame for animations and logic updates
   * Override to implement per-frame game logic
   *
   * @param dt - Delta time multiplier (1.0 at 60fps)
   */
  update(dt: number): void {
    // Optional hook for per-frame updates.
    // Parameter intentionally unused in base implementation
    void dt;
  }
}
