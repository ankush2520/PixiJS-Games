import { BaseScene } from "../core/BaseScene";
import { HomeButton } from "../ui/HomeButton";
import { MagicWordsBoard } from "../tasks/magic-words/MagicWordsBoard";

export class MagicWordsScene extends BaseScene {
  private readonly homeButton: HomeButton;
  private readonly board: MagicWordsBoard;

  constructor(private readonly onHomeSelected: () => void) {
    super();
    this.homeButton = new HomeButton(() => {
      this.onHomeSelected();
    });
    this.board = new MagicWordsBoard();
    this.board.init();
  }

  onEnter(): void {
    if (!this.board.parent) {
      this.addChild(this.board);
    }
    if (!this.homeButton.parent) {
      this.addChild(this.homeButton);
    }
  }

  resize(width: number, height: number): void {
    this.homeButton.position.set(16, 16);

    const homeButtonHeight = this.homeButton.height;
    const verticalGap = homeButtonHeight;
    const topPadding = this.homeButton.y + homeButtonHeight + verticalGap;
    const bottomPadding = verticalGap;
    const availableHeight = Math.max(1, height - topPadding - bottomPadding);

    this.board.position.set(width / 2, topPadding + availableHeight / 2);
    this.board.resize(width, height, topPadding, bottomPadding);
  }
}
