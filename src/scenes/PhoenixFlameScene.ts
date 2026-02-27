import { Text, TextStyle } from "pixi.js";
import { BaseScene } from "../core/BaseScene";

export class PhoenixFlameScene extends BaseScene {
  private readonly title = new Text({
    text: "Phoenix Flame",
    style: new TextStyle({
      fontFamily: "Arial",
      fontSize: 48,
      fill: 0xffffff,
    }),
  });

  private readonly subtitle = new Text({
    text: "Mini game scene",
    style: new TextStyle({
      fontFamily: "Arial",
      fontSize: 24,
      fill: 0xffffff,
    }),
  });

  onEnter(): void {
    this.title.anchor.set(0.5);
    this.subtitle.anchor.set(0.5);

    if (!this.title.parent) {
      this.addChild(this.title);
    }
    if (!this.subtitle.parent) {
      this.addChild(this.subtitle);
    }
  }

  resize(width: number, height: number): void {
    this.title.position.set(width / 2, height / 2 - 24);
    this.subtitle.position.set(width / 2, height / 2 + 28);
  }
}
