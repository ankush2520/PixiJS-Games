import { BaseScene } from "../core/BaseScene";
import { HomeButton } from "../ui/HomeButton";
import { AceOfShadowsBoard } from "../tasks/ace-of-shadows/AceOfShadowsBoard";
import { AceOfShadowUIManager } from "../tasks/ace-of-shadows/AceOfShadowUIManager";

export class AceOfShadowsScene extends BaseScene {
  private readonly homeButton: HomeButton;
  private readonly board: AceOfShadowsBoard;
  private readonly uiManager: AceOfShadowUIManager;

  constructor(private readonly onHomeSelected: () => void) {
    super();
    this.homeButton = new HomeButton(() => {
      this.onHomeSelected();
    });
    this.board = new AceOfShadowsBoard();
    this.uiManager = new AceOfShadowUIManager(
      () => this.handleStartClick(),
      () => this.handleResetClick(),
    );
  }

  private handleStartClick(): void {
    this.board.startAnimation();
  }

  private handleResetClick(): void {
    this.board.resetCards();
  }

  onEnter(): void {
    if (!this.homeButton.parent) {
      this.addChild(this.homeButton);
    }

    if (!this.board.parent) {
      this.addChild(this.board);
      this.board.init();
      this.uiManager.setBoard(this.board);
    }

    if (!this.uiManager.parent) {
      this.addChild(this.uiManager);
    }
  }

  private updateUI(): void {
    this.uiManager.updateCounter(this.board.cardsMovedCount);
  }

  resize(_width: number, _height: number): void {
    // Home button at top-left for both mobile and desktop
    this.homeButton.position.set(16, 16);

    this.uiManager.resize(_width, _height);
    this.board.resize(_width, _height);
  }

  update(_dt: number): void {
    this.updateUI();
  }
}
