import { BaseScene } from "../core/BaseScene";
import { HomeButton } from "../ui/HomeButton";
import { FireEffect } from "../tasks/phoenix-flame/FireEffect";
import { Graphics } from "pixi.js";

export class PhoenixFlameScene extends BaseScene {
  private readonly background: Graphics;
  private readonly homeButton: HomeButton;
  private readonly board: FireEffect;
  private boardInitialized = false;

  constructor(private readonly onHomeSelected: () => void) {
    super();
    this.background = new Graphics();
    this.homeButton = new HomeButton(() => {
      this.onHomeSelected();
    });
    this.board = new FireEffect();
  }

  onEnter(): void {
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

  resize(width: number, height: number): void {
    this.background.clear();
    this.background.rect(0, 0, width, height).fill({ color: 0x06080d });

    if (!this.boardInitialized) {
      this.board.init();
      this.boardInitialized = true;
    }
    this.board.resize(width, height);
    this.homeButton.position.set(width - 45 - 16, 16);
  }

  update(dt: number): void {
    this.board.update(dt);
  }
}
