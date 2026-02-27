import { Container, Graphics } from "pixi.js";

export class AceOfShadowsBoard extends Container {
  private readonly stackBasePositions: Array<{ x: number; y: number }> = [];
  private readonly stacks: Container[] = [];
  private moveInterval?: number;
  private currentTargetStack = 1;

  async init(): Promise<void> {
    this.createStackPlaceholders();
  }

  get stackPositions(): ReadonlyArray<{ x: number; y: number }> {
    return this.stackBasePositions;
  }

  resize(width: number, height: number): void {
    this.position.set(width / 2, height / 2);
  }

  private createStackPlaceholders(): void {
    this.stackBasePositions.length = 0;
    for (const stack of this.stacks) {
      this.removeChild(stack);
      stack.destroy({ children: true });
    }
    this.stacks.length = 0;

    const cardWidth = 140;
    const cardHeight = 200;
    const spacingX = 180;
    const spacingY = 250;
    const columns = 3;
    const rows = 2;

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

    this.populateFirstStack();
  }

  private populateFirstStack(): void {
    if (this.stacks.length === 0) {
      return;
    }

    const cardWidth = 140;
    const cardHeight = 200;
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

    // Re-layout first stack
    let cardIndex = 0;
    for (let i = 1; i < firstStack.children.length; i++) {
      const card = firstStack.children[i];
      const visibleIndex = Math.max(0, cardIndex - 129);
      card.x = visibleIndex * 2;
      card.y = visibleIndex * 2;
      cardIndex++;
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

    // Calculate target position
    const targetStackCardCount = toStack.children.length - 1;
    const visibleCardCount = Math.max(0, targetStackCardCount - 129);
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

        // Re-layout target stack
        const cardIndex = toStack.children.length - 2;
        const visibleCardIndex = Math.max(0, cardIndex - 129);
        card.x = visibleCardIndex * 2;
        card.y = visibleCardIndex * 2;
      }
    };

    requestAnimationFrame(animate);
  }

  destroy(options?: any): void {
    this.stopAnimation();
    super.destroy(options);
  }
}
