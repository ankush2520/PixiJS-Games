import { BaseScene } from "../core/BaseScene";
import { HomeButton } from "../ui/HomeButton";
import { FireEffect } from "../tasks/phoenix-flame/FireEffect";
import { Graphics } from "pixi.js";

/**
 * Phoenix Flame Scene
 *
 * Displays a realistic fire particle effect with:
 * - Dynamic flame and smoke particles
 * - Physics-based motion (buoyancy, turbulence, drift)
 * - Procedurally generated textures
 * - Breathing/pulsing intensity variation
 *
 * The fire effect runs continuously with a dark background.
 */
export class PhoenixFlameScene extends BaseScene {
  /** Dark background for contrast with flames */
  private readonly background: Graphics;

  /** Button to return to menu */
  private readonly homeButton: HomeButton;

  /** Fire particle system */
  private readonly board: FireEffect;

  /** Flag to ensure fire effect is only initialized once */
  private boardInitialized = false;

  /**
   * Constructs the Phoenix Flame scene
   * @param onHomeSelected - Callback when home button is clicked
   */
  constructor(private readonly onHomeSelected: () => void) {
    super();
    this.background = new Graphics();
    this.homeButton = new HomeButton(() => {
      this.onHomeSelected();
    });
    this.board = new FireEffect();
  }

  /**
   * Called when scene becomes active
   * Adds all visual elements to the scene
   */
  onEnter(): void {
    // Add elements in z-order: background, fire effect, home button
    if (!this.background.parent) {
      this.addChild(this.background);
    }
    if (!this.board.parent) {
      this.addChild(this.board);
    }
    if (!this.homeButton.parent) {
      this.addChild(this.homeButton);
    }
  }

  /**
   * Handles window resize
   * Updates background size, initializes fire effect, and positions UI
   *
   * @param width - New viewport width
   * @param height - New viewport height
   */
  resize(width: number, height: number): void {
    // Draw dark background for contrast with bright flames
    this.background.clear();
    this.background.rect(0, 0, width, height).fill({ color: 0x06080d });

    // Initialize fire effect on first resize (after scene is ready)
    if (!this.boardInitialized) {
      this.board.init();
      this.boardInitialized = true;
    }
    // Update fire spawn position based on viewport size
    this.board.resize(width, height);

    // Position home button in top-right corner
    this.homeButton.position.set(width - 45 - 16, 16);
  }

  /**
   * Update loop - called every frame
   * Updates fire particle system
   *
   * @param dt - Delta time multiplier (1.0 at 60fps)
   */
  update(dt: number): void {
    this.board.update(dt);
  }
}
