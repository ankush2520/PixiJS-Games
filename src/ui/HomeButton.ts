import { Container, Graphics } from "pixi.js";

/**
 * Home Button Component
 *
 * A reusable button that displays a house icon for returning to the menu.
 * Features:
 * - 45×45 pixel button with rounded corners
 * - Gray background with white border
 * - White house icon (roof triangle + base rectangle + door cutout)
 * - Interactive with pointer cursor on hover
 *
 * Visual design:
 * - Overall: 45×45px rounded square (8px corner radius)
 * - House roof: White triangle (centered)
 * - House base: White rectangle
 * - Door: Gray rectangle (cutout effect using same bg color)
 */
export class HomeButton extends Container {
  /** Graphics object for rendering button and icon */
  private readonly background = new Graphics();

  /**
   * Constructs a home button
   *
   * @param onTap - Callback function when button is clicked
   */
  constructor(private readonly onTap: () => void) {
    super();

    this.draw(); // Render button graphics

    // Enable interactivity
    this.eventMode = "static"; // Enable event handling
    this.cursor = "pointer"; // Show pointer cursor on hover

    // Register click handler (remove old listener first to prevent duplicates)
    this.off("pointertap", this.handleTap, this);
    this.on("pointertap", this.handleTap, this);

    this.addChild(this.background);
  }

  /**
   * Draws the home button icon
   *
   * Rendering order:
   * 1. Background: Gray rounded rectangle
   * 2. Roof: White triangle
   * 3. Base: White rectangle
   * 4. Door: Gray rectangle (creates cutout effect)
   */
  private draw(): void {
    this.background.clear();

    // Layer 1: Button background (gray rounded square)
    this.background.roundRect(0, 0, 45, 45, 8); // 45×45px, 8px corner radius
    this.background.fill({ color: 0x334155 }); // Dark gray fill
    this.background.stroke({ color: 0xffffff, width: 2 }); // White border

    // Layer 2: House roof (white triangle)
    this.background.poly([
      22.5,
      12, // Top point (apex)
      14,
      20, // Bottom left corner
      31,
      20, // Bottom right corner
      22.5,
      12, // Back to top (closes path)
    ]);
    this.background.fill({ color: 0xffffff }); // White fill

    // Layer 3: House base (white rectangle)
    this.background.rect(16, 20, 13, 11); // Below roof
    this.background.fill({ color: 0xffffff });

    // Layer 4: Door cutout (gray rectangle creates door effect)
    this.background.rect(20, 25, 5, 6); // Centered in base
    this.background.fill({ color: 0x334155 }); // Same as background color  // Same as background color
  }

  /**
   * Handles button click event
   * Invokes the callback provided in constructor
   */
  private handleTap(): void {
    this.onTap();
  }
}
