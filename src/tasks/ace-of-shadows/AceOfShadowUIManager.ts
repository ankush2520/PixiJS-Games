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
    this.startButton = this.createButton("Start", 0x4ecdc4);
    this.resetButton = this.createButton("Reset", 0xff6b6b);
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

  private createButton(label: string, color: number): Container {
    const button = new Container();

    const bg = new Graphics();
    bg.rect(0, 0, 120, 40);
    bg.fill(color);
    bg.stroke({ width: 2, color: 0xffffff });
    button.addChild(bg);

    const text = new Text({
      text: label,
      style: new TextStyle({
        fontFamily: "Arial",
        fontSize: 18,
        fill: 0xffffff,
      }),
    });
    text.anchor.set(0.5);
    text.position.set(60, 20);
    button.addChild(text);

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
    const buttonWidth = 120;
    const buttonSpacing = isMobile ? 15 : 20;
    const totalWidth = buttonWidth * 2 + buttonSpacing;
    const buttonsStartX = (width - totalWidth) / 2;
    const buttonsY = isMobile ? 50 : 70;

    this.startButton.position.set(buttonsStartX, buttonsY);
    this.resetButton.position.set(
      buttonsStartX + buttonWidth + buttonSpacing,
      buttonsY,
    );

    // Counter at bottom
    this.counterDisplay.anchor.set(0.5);
    this.counterDisplay.style.fontSize = isMobile ? 14 : 18;
    this.counterDisplay.position.set(width / 2, height - (isMobile ? 20 : 30));
  }
}
