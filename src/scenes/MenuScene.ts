import { BaseScene } from "../core/BaseScene";
import { Container, Graphics, Text, TextStyle } from "pixi.js";

/**
 * Menu Scene
 *
 * Main menu with navigation buttons for three games:
 * 1. Ace of Shadows - Card distribution game
 * 2. Magic Words - Scrollable message feed with emoji
 * 3. Phoenix Flame - Realistic fire particle effect
 *
 * Features:
 * - Centered vertical layout
 * - Color-coded buttons for each game
 * - Interactive hover states with pointer cursor
 * - Responsive positioning
 */
export class MenuScene extends BaseScene {
  /** Shared text style for all buttons */
  private readonly btnStyle = new TextStyle({ fill: "#ffffff", fontSize: 28 });

  /** Title text at top */
  private readonly menuText = new Text({
    text: "Menu Scene",
    style: new TextStyle({
      fontFamily: "Arial",
      fontSize: 48,
      fill: 0xffffff,
    }),
  });

  // Button text labels
  private readonly aceBtn = new Text({
    text: "Ace of Shadows",
    style: this.btnStyle,
  });
  private readonly magicWordsBtn = new Text({
    text: "Magic Words",
    style: this.btnStyle,
  });
  private readonly phoenixFlameBtn = new Text({
    text: "Phoenix Flame",
    style: this.btnStyle,
  });

  // Button backgrounds (colored rounded rectangles)
  private readonly aceButtonBg = new Graphics();
  private readonly magicWordsButtonBg = new Graphics();
  private readonly phoenixFlameButtonBg = new Graphics();

  // Complete button containers (background + text)
  private readonly aceButton = new Container();
  private readonly magicWordsButton = new Container();
  private readonly phoenixFlameButton = new Container();

  /**
   * Constructs the menu scene with navigation callbacks
   *
   * @param onAceSelected - Callback for Ace of Shadows button
   * @param onMagicWordsSelected - Callback for Magic Words button
   * @param onPhoenixFlameSelected - Callback for Phoenix Flame button
   */
  constructor(
    private readonly onAceSelected: () => void,
    private readonly onMagicWordsSelected: () => void,
    private readonly onPhoenixFlameSelected: () => void,
  ) {
    super();
  }

  /**
   * Called when scene becomes active
   * Creates and adds all menu elements
   */
  onEnter(): void {
    this.createMenuText();
    this.createAceButton();
    this.createMagicWordsButton();
    this.createPhoenixFlameButton();
  }

  /**
   * Handles window resize
   * Centers all menu elements vertically with consistent spacing
   *
   * Layout:
   * - Title: centerY - 150px
   * - Ace button: centerY - 45px
   * - Magic Words button: centerY + 45px
   * - Phoenix Flame button: centerY + 135px
   *
   * @param width - Viewport width
   * @param height - Viewport height
   */
  resize(width: number, height: number): void {
    const centerY = height * 0.55; // Slightly below vertical center
    this.menuText.position.set(width / 2, centerY - 150);
    this.aceButton.position.set(width / 2, centerY - 45);
    this.magicWordsButton.position.set(width / 2, centerY + 45);
    this.phoenixFlameButton.position.set(width / 2, centerY + 135);
  }

  /**
   * Creates and adds the menu title text
   */
  createMenuText(): void {
    this.menuText.anchor.set(0.5); // Center anchor
    if (!this.menuText.parent) {
      this.addChild(this.menuText);
    }
  }

  /**
   * Creates Ace of Shadows button (blue)
   */
  createAceButton(): void {
    this.setupTaskButton(
      this.aceButton,
      this.aceButtonBg,
      this.aceBtn,
      0x1d4ed8, // Blue fill
      this.onAceButtonTap,
    );
  }

  /**
   * Creates Magic Words button (teal)
   */
  createMagicWordsButton(): void {
    this.setupTaskButton(
      this.magicWordsButton,
      this.magicWordsButtonBg,
      this.magicWordsBtn,
      0x0f766e, // Teal fill
      this.onMagicWordsButtonTap,
    );
  }

  /**
   * Creates Phoenix Flame button (orange)
   */
  createPhoenixFlameButton(): void {
    this.setupTaskButton(
      this.phoenixFlameButton,
      this.phoenixFlameButtonBg,
      this.phoenixFlameBtn,
      0xb45309, // Orange fill
      this.onPhoenixFlameButtonTap,
    );
  }

  /**
   * Sets up a task button with background, label, and interactivity
   *
   * Button specifications:
   * - Size: 320×64 pixels
   * - Shape: Rounded rectangle (12px corner radius)
   * - Border: 2px white stroke
   * - Interactive: Pointer cursor on hover
   *
   * @param button - Container to hold button elements
   * @param buttonBg - Graphics object for button background
   * @param label - Text label for button
   * @param fillColor - Background fill color (RGB hex)
   * @param onTap - Callback when button is clicked
   */
  private setupTaskButton(
    button: Container,
    buttonBg: Graphics,
    label: Text,
    fillColor: number,
    onTap: () => void,
  ): void {
    // Draw button background with rounded corners
    buttonBg.clear();
    buttonBg
      .roundRect(-160, -32, 320, 64, 12) // Centered rect (320×64, radius 12)
      .fill({ color: fillColor })
      .stroke({ color: 0xffffff, width: 2 }); // White border

    // Center label text
    label.anchor.set(0.5);

    // Enable button interactivity
    button.eventMode = "static"; // Enable event handling
    button.cursor = "pointer"; // Show pointer cursor on hover

    // Register click handler (remove old listener first to prevent duplicates)
    button.off("pointertap", onTap, this);
    button.on("pointertap", onTap, this);

    // Add background and label to button container
    if (!button.children.length) {
      button.addChild(buttonBg, label);
    }

    // Add button to scene
    if (!button.parent) {
      this.addChild(button);
    }
  }

  /**
   * Handler for Ace of Shadows button click
   */
  private onAceButtonTap(): void {
    this.onAceSelected();
  }

  /**
   * Handler for Magic Words button click
   */
  private onMagicWordsButtonTap(): void {
    this.onMagicWordsSelected();
  }

  /**
   * Handler for Phoenix Flame button click
   */
  private onPhoenixFlameButtonTap(): void {
    this.onPhoenixFlameSelected();
  }
}
