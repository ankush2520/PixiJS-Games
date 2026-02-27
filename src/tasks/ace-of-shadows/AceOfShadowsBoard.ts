import { Container, Graphics } from "pixi.js";

export class AceOfShadowsBoard extends Container {
  private readonly stackBasePositions: Array<{ x: number; y: number }> = [];
  private readonly stacks: Container[] = [];
  private moveInterval?: number;
  private currentTargetStack = 1;
  private movedCards = 0;
  private lastWidth = 0;
  private lastHeight = 0;

  get cardsMovedCount(): number {
    return this.movedCards;
  }

  async init(): Promise<void> {
    // Layout will be created on first resize call
  }

  get stackPositions(): ReadonlyArray<{ x: number; y: number }> {
    return this.stackBasePositions;
  }

  resize(width: number, height: number): void {
    this.position.set(width / 2, height / 2);

    // Detect orientation change and rebuild layout
    const isPortrait = width < height;
    const wasPortrait = this.lastWidth < this.lastHeight;

    if (isPortrait !== wasPortrait || this.lastWidth === 0) {
      this.createStackPlaceholders(isPortrait);
    }

    this.lastWidth = width;
    this.lastHeight = height;
  }

  private createStackPlaceholders(isPortrait: boolean = false): void {
    // Save cards from all stacks before destroying
    const savedCards: Array<any> = [];
    for (const stack of this.stacks) {
      // Skip placeholder at index 0, save actual cards
      for (let i = 1; i < stack.children.length; i++) {
        savedCards.push(stack.children[i]);
      }
    }

    // Also save any cards that are being animated on the board
    const animatedCards: Array<any> = [];
    for (const child of this.children) {
      if (
        child !== this.stacks[0] &&
        child !== this.stacks[1] &&
        child !== this.stacks[2] &&
        child !== this.stacks[3] &&
        child !== this.stacks[4] &&
        child !== this.stacks[5]
      ) {
        // This is likely a card being animated
        if (child instanceof Graphics) {
          animatedCards.push(child);
        }
      }
    }

    this.stackBasePositions.length = 0;
    for (const stack of this.stacks) {
      this.removeChild(stack);
      // Remove children but don't destroy them (we saved them)
      while (stack.children.length > 0) {
        stack.removeChildAt(0);
      }
      stack.destroy({ children: false });
    }
    this.stacks.length = 0;

    const cardWidth = 100;
    const cardHeight = 140;
    const spacingX = isPortrait ? 145 : 170;
    const spacingY = 180;

    // Portrait mode: 2 columns, 3 rows
    // Landscape mode: 3 columns, 2 rows
    const columns = isPortrait ? 2 : 3;
    const rows = isPortrait ? 3 : 2;

    for (let row = 0; row < rows; row++) {
      const y = (row - (rows - 1) / 2) * spacingY;

      for (let col = 0; col < columns; col++) {
        const x = (col - (columns - 1) / 2) * spacingX;
        this.stackBasePositions.push({ x, y });

        const stackContainer = new Container();
        stackContainer.position.set(x, y);

        // Create placeholder using Graphics - outline only
        const stackBase = new Graphics();
        stackBase.rect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight);
        stackBase.stroke({ width: 2, color: 0xffffff, alpha: 0.4 });

        stackContainer.addChild(stackBase);
        this.stacks.push(stackContainer);
        this.addChild(stackContainer);
      }
    }

    // If we have saved cards, restore them to first stack
    if (savedCards.length > 0) {
      const firstStack = this.stacks[0];
      for (const card of savedCards) {
        firstStack.addChild(card);
      }
      this.relayoutStack(firstStack);
    } else {
      // First time, populate with initial cards
      this.populateFirstStack();
    }

    // Restore animated cards to board
    for (const card of animatedCards) {
      this.addChild(card);
    }
  }

  private populateFirstStack(): void {
    if (this.stacks.length === 0) {
      return;
    }

    const cardWidth = 100;
    const cardHeight = 140;
    const colors = [0xff6b6b, 0x4ecdc4, 0xffe66d, 0x95e1d3, 0xf38181];
    const firstStack = this.stacks[0];

    for (let i = 0; i < 144; i++) {
      const cardGraphics = new Graphics();
      cardGraphics.rect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight);
      cardGraphics.fill(colors[i % colors.length]);
      cardGraphics.stroke({ width: 1, color: 0xffffff });

      // Only show top 15 cards for visual effect
      const visibleIndex = Math.max(0, i - 129);
      cardGraphics.x = visibleIndex * 2;
      cardGraphics.y = visibleIndex * 2;

      firstStack.addChild(cardGraphics);
    }
  }

  private relayoutStack(stack: Container): void {
    // Apply stacking layout to any stack - show top 15 cards with 2px offset
    let cardIndex = 0;
    const totalCards = stack.children.length - 1; // exclude placeholder
    const hiddenCount = Math.max(0, totalCards - 15);
    for (let i = 1; i < stack.children.length; i++) {
      const card = stack.children[i];
      const visibleIndex = Math.max(0, cardIndex - hiddenCount);
      card.x = visibleIndex * 2;
      card.y = visibleIndex * 2;
      cardIndex++;
    }
  }

  startAnimation(): void {
    if (this.moveInterval) {
      return; // Already running
    }
    this.moveInterval = setInterval(() => {
      this.moveCardWithAnimation();
    }, 1000) as unknown as number;
  }

  stopAnimation(): void {
    if (this.moveInterval) {
      clearInterval(this.moveInterval);
      this.moveInterval = undefined;
    }
  }

  resetCards(): void {
    this.stopAnimation();
    this.currentTargetStack = 1;
    this.movedCards = 0;

    // Move all cards back to first stack
    const firstStack = this.stacks[0];
    for (let i = 1; i < this.stacks.length; i++) {
      const stack = this.stacks[i];
      // Get all cards (skip placeholder at index 0)
      while (stack.children.length > 1) {
        const card = stack.children[stack.children.length - 1];
        stack.removeChild(card);
        firstStack.addChild(card);
      }
    }

    // Re-layout all stacks with consistent stacking behavior
    for (const stack of this.stacks) {
      this.relayoutStack(stack);
    }
  }

  moveCardWithAnimation(): void {
    const fromIndex = 0;
    const toIndex = this.currentTargetStack;

    // Cycle through stacks 1-5
    this.currentTargetStack++;
    if (this.currentTargetStack >= this.stacks.length) {
      this.currentTargetStack = 1;
    }

    if (
      fromIndex < 0 ||
      fromIndex >= this.stacks.length ||
      toIndex < 0 ||
      toIndex >= this.stacks.length
    ) {
      return;
    }

    const fromStack = this.stacks[fromIndex];
    const toStack = this.stacks[toIndex];

    // Get top card (last child, excluding placeholder at index 0)
    if (fromStack.children.length <= 1) {
      return;
    }

    const card = fromStack.children[fromStack.children.length - 1];

    // Get global position
    const globalPos = card.getGlobalPosition();

    // Remove from stack and add to board for animation
    fromStack.removeChild(card);
    this.addChild(card);

    // Set card to its global position in board coordinates
    const localPos = this.toLocal(globalPos);
    card.position.set(localPos.x, localPos.y);

    // Calculate target position - show top 15 cards spread out
    const targetStackCardCount = toStack.children.length - 1; // exclude placeholder
    const hiddenCount = Math.max(0, targetStackCardCount - 15);
    const visibleCardCount = Math.max(0, targetStackCardCount - hiddenCount);
    const targetX = toStack.x + visibleCardCount * 2;
    const targetY = toStack.y + visibleCardCount * 2;

    // Animate
    const startX = card.x;
    const startY = card.y;
    const startTime = Date.now();
    const duration = 2000;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      card.x = startX + (targetX - startX) * easeProgress;
      card.y = startY + (targetY - startY) * easeProgress;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Animation complete
        this.removeChild(card);
        toStack.addChild(card);
        this.relayoutStack(toStack);
        this.movedCards++;
      }
    };

    requestAnimationFrame(animate);
  }

  destroy(options?: any): void {
    this.stopAnimation();
    super.destroy(options);
  }
}
