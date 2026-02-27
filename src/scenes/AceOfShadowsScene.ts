import { Text, TextStyle } from "pixi.js";
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

  constructor(private readonly onHomeSelected: () => void) {
    super();
    this.homeButton = new HomeButton(() => {
      this.onHomeSelected();
    });
    this.board = new AceOfShadowsBoard();
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

    this.homeButton.position.set(16, 16);
  }

  resize(_width: number, _height: number): void {
    this.title.position.set(_width / 2, 30);
    this.homeButton.position.set(16, 16);
    this.board.resize(_width, _height);
  }
}
