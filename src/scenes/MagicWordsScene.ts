import { BaseScene } from "../core/BaseScene";
import { HomeButton } from "../ui/HomeButton";
import { MagicWordsBoard } from "../tasks/magic-words/MagicWordsBoard";
import { Text, TextStyle } from "pixi.js";

export class MagicWordsScene extends BaseScene {
  private readonly homeButton: HomeButton;
  private readonly board: MagicWordsBoard;
  private readonly loader: Text;
  private loading = true;
  private screenWidth = 0;
  private screenHeight = 0;

  constructor(private readonly onHomeSelected: () => void) {
    super();
    this.homeButton = new HomeButton(() => {
      this.onHomeSelected();
    });
    this.board = new MagicWordsBoard();

    this.loader = new Text({
      text: "Loading...",
      style: new TextStyle({
        fontFamily: "Arial",
        fontSize: 28,
        fill: 0xffffff,
      }),
    });
    this.loader.anchor.set(0.5);

    void this.loadBoard();
  }

  private async loadBoard(): Promise<void> {
    await this.board.init();
    this.loading = false;
    this.loader.visible = false;
    if (!this.board.parent) {
      this.addChildAt(this.board, 0);
    }
    if (this.screenWidth > 0) {
      this.resize(this.screenWidth, this.screenHeight);
    }
  }

  onEnter(): void {
    if (this.loading) {
      if (!this.loader.parent) {
        this.addChild(this.loader);
      }
    } else if (!this.board.parent) {
      this.addChild(this.board);
    }
    if (!this.homeButton.parent) {
      this.addChild(this.homeButton);
    }
  }

  resize(width: number, height: number): void {
    this.screenWidth = width;
    this.screenHeight = height;

    this.homeButton.position.set(width - 45 - 16, 16);
    this.loader.position.set(width / 2, height / 2);

    const homeButtonHeight = this.homeButton.height;
    const verticalGap = homeButtonHeight;
    const topPadding = this.homeButton.y + homeButtonHeight + verticalGap;
    const bottomPadding = verticalGap;
    const availableHeight = Math.max(1, height - topPadding - bottomPadding);

    this.board.position.set(width / 2, topPadding + availableHeight / 2);
    this.board.resize(width, height, topPadding, bottomPadding);
  }
}
