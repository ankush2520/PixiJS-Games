import { BaseScene } from "../core/BaseScene";
import { HomeButton } from "../ui/HomeButton";
import { PhoenixFlameBoard } from "../tasks/phoenix-flame/PhoenixFlameBoard";

export class PhoenixFlameScene extends BaseScene {
  private readonly homeButton: HomeButton;
  private readonly board: PhoenixFlameBoard;
  private boardInitialized = false;

  constructor(private readonly onHomeSelected: () => void) {
    super();
    this.homeButton = new HomeButton(() => {
      this.onHomeSelected();
    });
    this.board = new PhoenixFlameBoard();
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
    this.board.resize(width, height);
    if (!this.boardInitialized) {
      this.board.init();
      this.boardInitialized = true;
      this.board.resize(width, height);
    }
    this.homeButton.position.set(16, 16);
  }

  update(dt: number): void {
    this.board.update(dt);
  }
}
