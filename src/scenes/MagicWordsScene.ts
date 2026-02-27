import { Text, TextStyle } from "pixi.js";
import { BaseScene } from "../core/BaseScene";
import { HomeButton } from "../ui/HomeButton";

export class MagicWordsScene extends BaseScene {
  private readonly title = new Text({
    text: "Magic Words",
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
  private readonly homeButton: HomeButton;

  constructor(private readonly onHomeSelected: () => void) {
    super();
    this.homeButton = new HomeButton(() => {
      this.onHomeSelected();
    });
  }

  onEnter(): void {
    this.title.anchor.set(0.5);
    this.subtitle.anchor.set(0.5);

    if (!this.title.parent) {
      this.addChild(this.title);
    }
    if (!this.subtitle.parent) {
      this.addChild(this.subtitle);
    }
    if (!this.homeButton.parent) {
      this.addChild(this.homeButton);
    }
  }

  resize(width: number, height: number): void {
    this.title.position.set(width / 2, height / 2 - 24);
    this.subtitle.position.set(width / 2, height / 2 + 28);
    this.homeButton.position.set(16, 16);
  }
}
