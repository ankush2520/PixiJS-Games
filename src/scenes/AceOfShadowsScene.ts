import { Text, TextStyle, Graphics, Container } from "pixi.js";
import { BaseScene } from "../core/BaseScene";
import { HomeButton } from "../ui/HomeButton";
import { AceOfShadowsBoard } from "../tasks/ace-of-shadows/AceOfShadowsBoard";

export class AceOfShadowsScene extends BaseScene {
  private readonly title = new Text({
    text: "Ace of Shadows",
    style: new TextStyle({
      fontFamily: "Arial",
      fontSize: 24,
      fill: 0xffffff,
    }),
  });

  private readonly homeButton: HomeButton;
  private readonly board: AceOfShadowsBoard;
  private readonly startButton: Container;
  private readonly resetButton: Container;

  constructor(private readonly onHomeSelected: () => void) {
    super();
    this.homeButton = new HomeButton(() => {
      this.onHomeSelected();
    });
    this.board = new AceOfShadowsBoard();
    this.startButton = this.createButton("Start", 0x4ecdc4);
    this.resetButton = this.createButton("Reset", 0xff6b6b);
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

  onEnter(): void {
    this.title.anchor.set(0.5);

    if (!this.title.parent) {
      this.addChild(this.title);
    }

    if (!this.homeButton.parent) {
      this.addChild(this.homeButton);
    }

    if (!this.board.parent) {
      this.addChild(this.board);
      this.board.init();
    }

    if (!this.startButton.parent) {
      this.addChild(this.startButton);
      this.startButton.on("pointerdown", () => {
        this.board.startAnimation();
      });
    }

    if (!this.resetButton.parent) {
      this.addChild(this.resetButton);
      this.resetButton.on("pointerdown", () => {
        this.board.resetCards();
      });
    }

    this.homeButton.position.set(16, 16);
  }

  resize(_width: number, _height: number): void {
    this.title.position.set(_width / 2, 30);
    this.homeButton.position.set(16, 16);
    this.startButton.position.set(_width / 2 - 140, _height - 60);
    this.resetButton.position.set(_width / 2 + 20, _height - 60);
    this.board.resize(_width, _height);
  }
}
