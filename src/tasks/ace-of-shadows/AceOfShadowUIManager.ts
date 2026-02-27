import { Container, Text, TextStyle, Graphics } from "pixi.js";
import { AceOfShadowsBoard } from "./AceOfShadowsBoard";

export class AceOfShadowUIManager extends Container {
  private readonly startButton: Container;
  private readonly resetButton: Container;
  private readonly counterDisplay: Text;
  private readonly titleDisplay: Text;
  private board: AceOfShadowsBoard | null = null;

  constructor(
    private onStartClick: () => void,
    private onResetClick: () => void,
  ) {
    super();
    this.startButton = this.createIconButton("play", 0x22c55e);
    this.resetButton = this.createIconButton("reset", 0xef4444);
    this.counterDisplay = this.createCounterDisplay();
    this.titleDisplay = this.createTitleDisplay();

    this.addChild(this.startButton);
    this.addChild(this.resetButton);
    this.addChild(this.counterDisplay);
    this.addChild(this.titleDisplay);

    this.setupEventListeners();
  }

  setBoard(board: AceOfShadowsBoard): void {
    this.board = board;
  }

  private createIconButton(
    iconType: "play" | "reset",
    color: number,
  ): Container {
    const button = new Container();

    const bg = new Graphics();

    // Background with rounded corners
    bg.roundRect(0, 0, 45, 45, 8);
    bg.fill(color);
    bg.stroke({ width: 2, color: 0xffffff });
    button.addChild(bg);

    // Draw icon
    const icon = new Graphics();

    if (iconType === "play") {
      // Play triangle icon (pointing right)
      icon.poly([
        18,
        14, // Top left
        18,
        31, // Bottom left
        30,
        22.5, // Right point
        18,
        14, // Back to top
      ]);
      icon.fill({ color: 0xffffff });
    } else if (iconType === "reset") {
      // Reset circular arrow icon
      icon.arc(22.5, 22.5, 8, 0.5, Math.PI * 2 - 0.5);
      icon.stroke({ width: 2.5, color: 0xffffff });

      // Arrow head pointing right at the top
      icon.poly([
        30.5,
        18, // Arrow point
        28,
        15, // Top
        28,
        21, // Bottom
        30.5,
        18, // Back to point
      ]);
      icon.fill({ color: 0xffffff });
    }

    button.addChild(icon);
    button.eventMode = "static";
    button.cursor = "pointer";

    return button;
  }

  private createCounterDisplay(): Text {
    return new Text({
      text: "Cards Moved: 0",
      style: new TextStyle({
        fontFamily: "Arial",
        fontSize: 18,
        fill: 0xffffff,
      }),
    });
  }

  private createTitleDisplay(): Text {
    return new Text({
      text: "Ace of Shadows",
      style: new TextStyle({
        fontFamily: "Arial",
        fontSize: 24,
        fill: 0xffffff,
      }),
    });
  }

  private setupEventListeners(): void {
    this.startButton.on("pointerdown", () => {
      this.onStartClick();
    });

    this.resetButton.on("pointerdown", () => {
      this.onResetClick();
    });
  }

  updateCounter(count: number): void {
    this.counterDisplay.text = `Cards Moved: ${count}`;
  }

  resize(width: number, height: number): void {
    const isMobile = width < 600;

    // Title
    this.titleDisplay.anchor.set(0.5);
    this.titleDisplay.style.fontSize = isMobile ? 20 : 24;
    this.titleDisplay.position.set(width / 2, isMobile ? 20 : 30);

    // Buttons - centered below title with proper spacing
    const buttonSize = 45;
    const buttonSpacing = isMobile ? 15 : 20;
    const totalWidth = buttonSize * 2 + buttonSpacing;
    const buttonsStartX = (width - totalWidth) / 2;
    const buttonsY = isMobile ? 50 : 70;

    this.startButton.position.set(buttonsStartX, buttonsY);
    this.resetButton.position.set(
      buttonsStartX + buttonSize + buttonSpacing,
      buttonsY,
    );

    // Counter at bottom
    this.counterDisplay.anchor.set(0.5);
    this.counterDisplay.style.fontSize = isMobile ? 14 : 18;
    this.counterDisplay.position.set(width / 2, height - (isMobile ? 20 : 30));
  }
}
