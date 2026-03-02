import { BaseScene } from "../core/BaseScene";
import { HomeButton } from "../ui/HomeButton";
import { AceOfShadowsBoard } from "../tasks/ace-of-shadows/AceOfShadowsBoard";
import { AceOfShadowUIManager } from "../tasks/ace-of-shadows/AceOfShadowUIManager";

/**
 * Ace of Shadows Scene
 *
 * Card distribution game where 144 cards are distributed from one stack to five target stacks.
 * Features:
 * - Round-robin card distribution with smooth animations
 * - 3D stacking visual effect (cards appear layered with visible edges)
 * - Play/Reset controls with card counter display
 * - Responsive layout (3×2 grid on desktop, 2×3 on portrait)
 *
 * Game mechanics:
 * - 6 total stacks: 1 source (first) + 5 targets
 * - Cards animate from source to targets with cubic easing
 * - Visual 3D depth created by micro-offsets (0.32px per card)
 */
export class AceOfShadowsScene extends BaseScene {
  /** Button to return to menu */
  private readonly homeButton: HomeButton;

  /** Main game board managing card stacks and animations */
  private readonly board: AceOfShadowsBoard;

  /** UI manager for play/reset buttons and counter display */
  private readonly uiManager: AceOfShadowUIManager;

  /**
   * Constructs the Ace of Shadows scene
   * Sets up board and UI with callback handlers
   *
   * @param onHomeSelected - Callback when home button is clicked
   */
  constructor(private readonly onHomeSelected: () => void) {
    super();
    this.homeButton = new HomeButton(() => {
      this.onHomeSelected();
    });
    this.board = new AceOfShadowsBoard();
    this.uiManager = new AceOfShadowUIManager(
      () => this.handleStartClick(), // Play button callback
      () => this.handleResetClick(), // Reset button callback
    );
  }

  /**
   * Handles play button click - starts card distribution animation
   */
  private handleStartClick(): void {
    this.board.startAnimation();
  }

  /**
   * Handles reset button click - returns all cards to first stack
   */
  private handleResetClick(): void {
    this.board.resetCards();
  }

  /**
   * Called when scene becomes active
   * Adds all visual elements to the scene
   */
  onEnter(): void {
    if (!this.homeButton.parent) {
      this.addChild(this.homeButton);
    }

    if (!this.board.parent) {
      this.addChild(this.board);
    }

    if (!this.uiManager.parent) {
      this.addChild(this.uiManager);
    }
  }

  /**
   * Updates the UI counter display
   * Syncs card count from board to UI manager
   */
  private updateUI(): void {
    this.uiManager.updateCounter(this.board.cardsMovedCount);
  }

  /**
   * Handles window resize
   * Updates positions for home button, UI controls, and card board
   *
   * @param _width - New viewport width
   * @param _height - New viewport height
   */
  resize(_width: number, _height: number): void {
    // Position home button in top-right corner
    this.homeButton.position.set(_width - 45 - 16, 16);

    // Resize UI controls (buttons and counter)
    this.uiManager.resize(_width, _height);

    // Resize and reposition card board (handles responsive layout)
    this.board.resize(_width, _height);
  }

  /**
   * Update loop - called every frame
   * Updates the UI counter to reflect current animation state
   *
   * @param dt - Delta time (unused, UI updates are state-based)
   */
  update(dt: number): void {
    void dt; // Unused parameter
    this.updateUI();
  }
}
