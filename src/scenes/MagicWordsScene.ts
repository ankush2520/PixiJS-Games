import { BaseScene } from "../core/BaseScene";
import { HomeButton } from "../ui/HomeButton";
import { MagicWordsBoard } from "../tasks/magic-words/MagicWordsBoard";
import { Text, TextStyle } from "pixi.js";

/**
 * Magic Words Scene
 *
 * Displays a scrollable message feed with rich text and emoji support.
 * Features:
 * - Async loading of message data and emoji assets
 * - Rich text rendering with inline emoji images
 * - Custom scrollbar with touch/mouse/wheel support
 * - Word-based text wrapping
 * - Loading indicator during initialization
 *
 * Loading flow:
 * 1. Display "Loading..." text
 * 2. Fetch messages from API (backend service)
 * 3. Load emoji image URLs
 * 4. Render messages with emoji and show scrollable board
 */
export class MagicWordsScene extends BaseScene {
  /** Button to return to menu */
  private readonly homeButton: HomeButton;

  /** Scrollable message board with rich text rendering */
  private readonly board: MagicWordsBoard;

  /** Loading text displayed during async initialization */
  private readonly loader: Text;

  /** Flag indicating data is still loading */
  private loading = true;

  /** Cached viewport dimensions for resizing during loading */
  private screenWidth = 0;
  private screenHeight = 0;

  /**
   * Constructs the Magic Words scene
   * Begins async loading of board data immediately
   *
   * @param onHomeSelected - Callback when home button is clicked
   */
  constructor(private readonly onHomeSelected: () => void) {
    super();
    this.homeButton = new HomeButton(() => {
      this.onHomeSelected();
    });
    this.board = new MagicWordsBoard();

    // Create loading indicator text
    this.loader = new Text({
      text: "Loading...",
      style: new TextStyle({
        fontFamily: "Arial",
        fontSize: 28,
        fill: 0xffffff,
      }),
    });
    this.loader.anchor.set(0.5); // Center anchor

    // Start async loading (don't await here, handle completion in loadBoard)
    void this.loadBoard();
  }

  /**
   * Async loading of message board data
   *
   * Process:
   * 1. Fetch messages from backend API
   * 2. Load emoji URLs
   * 3. Initialize rich text rendering
   * 4. Hide loader and show board
   * 5. Trigger resize if dimensions are already known
   */
  private async loadBoard(): Promise<void> {
    await this.board.init(); // Fetches data and prepares rendering
    this.loading = false;
    this.loader.visible = false;

    // Add board to scene once loaded
    if (!this.board.parent) {
      this.addChildAt(this.board, 0); // Add at bottom of z-order
    }

    // Apply cached dimensions if resize was called during loading
    if (this.screenWidth > 0) {
      this.resize(this.screenWidth, this.screenHeight);
    }
  }

  /**
   * Called when scene becomes active
   * Shows loader or board depending on loading state
   */
  onEnter(): void {
    // Show loading text if still loading
    if (this.loading) {
      if (!this.loader.parent) {
        this.addChild(this.loader);
      }
    } else if (!this.board.parent) {
      // Show board if loading complete
      this.addChild(this.board);
    }

    // Always add home button on top
    if (!this.homeButton.parent) {
      this.addChild(this.homeButton);
    }
  }

  /**
   * Handles window resize
   * Positions home button, loader, and adjusts board size
   *
   * Layout:
   * - Home button: Top-right corner
   * - Loader: Centered (during loading)
   * - Board: Centered with padding around home button
   *
   * @param width - New viewport width
   * @param height - New viewport height
   */
  resize(width: number, height: number): void {
    // Cache dimensions for use after async loading completes
    this.screenWidth = width;
    this.screenHeight = height;

    // Position home button in top-right corner
    this.homeButton.position.set(width - 45 - 16, 16);

    // Center loading text
    this.loader.position.set(width / 2, height / 2);

    // Calculate available space for board (accounting for home button)
    const homeButtonHeight = this.homeButton.height;
    const verticalGap = homeButtonHeight; // Space below home button
    const topPadding = this.homeButton.y + homeButtonHeight + verticalGap;
    const bottomPadding = verticalGap;
    const availableHeight = Math.max(1, height - topPadding - bottomPadding);

    // Center board in available space
    this.board.position.set(width / 2, topPadding + availableHeight / 2);
    this.board.resize(width, height, topPadding, bottomPadding);
  }
}
