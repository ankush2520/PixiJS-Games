import { Container, Graphics, Sprite, Texture } from "pixi.js";

export class AceOfShadowsBoard extends Container {
  private readonly stackBasePositions: Array<{ x: number; y: number }> = [];
  private readonly stacks: Container[] = [];
  private moveInterval?: number;
  private currentTargetStack = 1;
  private movedCards = 0;
  private lastWidth = 0;
  private lastHeight = 0;
  private animationFrameIds: Set<number> = new Set();
  private isAnimating = false;
  private readonly cardTextures: Texture[] = [];
  private static readonly CARD_WIDTH = 100;
  private static readonly CARD_HEIGHT = 140;
  private static readonly CARD_COLORS = [
    0xff6b6b, 0x4ecdc4, 0xffe66d, 0x95e1d3, 0xf38181,
  ];

  get cardsMovedCount(): number {
    return this.movedCards;
  }

  get stackPositions(): ReadonlyArray<{ x: number; y: number }> {
    return this.stackBasePositions;
  }

  private ensureCardTextures(): void {
    if (this.cardTextures.length > 0) return;

    for (const color of AceOfShadowsBoard.CARD_COLORS) {
      const canvas = document.createElement("canvas");
      canvas.width = AceOfShadowsBoard.CARD_WIDTH;
      canvas.height = AceOfShadowsBoard.CARD_HEIGHT;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        this.cardTextures.push(Texture.WHITE);
        continue;
      }

      const r = (color >> 16) & 0xff;
      const g = (color >> 8) & 0xff;
      const b = color & 0xff;

      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const dr = Math.max(0, r - 40);
      const dg = Math.max(0, g - 40);
      const db = Math.max(0, b - 40);
      ctx.strokeStyle = `rgb(${dr},${dg},${db})`;
      ctx.lineWidth = 1;
      ctx.strokeRect(0.5, 0.5, canvas.width - 1, canvas.height - 1);

      this.cardTextures.push(Texture.from(canvas));
    }
  }

  resize(width: number, height: number): void {
    const topPadding = 60;
    const bottomPadding = 90;
    const availableHeight = height - topPadding - bottomPadding;
    const boardCenterY = topPadding + availableHeight / 2;

    this.position.set(width / 2, boardCenterY);

    const isPortrait = width < height;
    const wasPortrait = this.lastWidth < this.lastHeight;

    if (isPortrait !== wasPortrait || this.lastWidth === 0) {
      this.createStackPlaceholders(isPortrait);
    }

    this.lastWidth = width;
    this.lastHeight = height;
  }

  private createStackPlaceholders(isPortrait: boolean = false): void {
    const savedCards: Array<Container> = [];
    for (const stack of this.stacks) {
      for (let i = 1; i < stack.children.length; i++) {
        savedCards.push(stack.children[i]);
      }
    }

    const animatedCards: Array<Container> = [];
    for (const child of this.children) {
      if (
        child instanceof Sprite &&
        !this.stacks.includes(child as Container)
      ) {
        animatedCards.push(child);
      }
    }

    this.stackBasePositions.length = 0;
    for (const stack of this.stacks) {
      this.removeChild(stack);
      while (stack.children.length > 0) {
        stack.removeChildAt(0);
      }
      stack.destroy({ children: false });
    }
    this.stacks.length = 0;

    const spacingX = isPortrait ? 145 : 170;
    const spacingY = 180;
    const columns = isPortrait ? 2 : 3;
    const rows = isPortrait ? 3 : 2;

    for (let row = 0; row < rows; row++) {
      const y = (row - (rows - 1) / 2) * spacingY;

      for (let col = 0; col < columns; col++) {
        const x = (col - (columns - 1) / 2) * spacingX;
        this.stackBasePositions.push({ x, y });

        const stackContainer = new Container();
        stackContainer.position.set(x, y);

        const stackBase = new Graphics();
        stackBase.rect(
          -AceOfShadowsBoard.CARD_WIDTH / 2,
          -AceOfShadowsBoard.CARD_HEIGHT / 2,
          AceOfShadowsBoard.CARD_WIDTH,
          AceOfShadowsBoard.CARD_HEIGHT,
        );
        stackBase.stroke({ width: 2, color: 0xffffff, alpha: 0.4 });

        stackContainer.addChild(stackBase);
        this.stacks.push(stackContainer);
        this.addChild(stackContainer);
      }
    }

    if (savedCards.length > 0) {
      const firstStack = this.stacks[0];
      for (const card of savedCards) {
        firstStack.addChild(card);
      }
      this.relayoutStack(firstStack);
    } else {
      this.populateFirstStack();
    }

    for (const card of animatedCards) {
      this.addChild(card);
    }
  }

  private populateFirstStack(): void {
    if (this.stacks.length === 0) {
      return;
    }

    this.ensureCardTextures();
    const firstStack = this.stacks[0];

    const offsetPerCard = 0.3;
    for (let i = 0; i < 144; i++) {
      const card = new Sprite(this.cardTextures[i % this.cardTextures.length]);
      card.anchor.set(0.5);

      card.x = i * offsetPerCard;
      card.y = i * offsetPerCard;

      firstStack.addChild(card);
    }
  }

  private relayoutStack(stack: Container): void {
    const offsetPerCard = 0.3;
    let cardIndex = 0;
    for (let i = 1; i < stack.children.length; i++) {
      const card = stack.children[i];
      card.x = cardIndex * offsetPerCard;
      card.y = cardIndex * offsetPerCard;
      cardIndex++;
    }
  }

  startAnimation(): void {
    if (this.moveInterval) {
      return;
    }
    this.isAnimating = true;
    this.moveInterval = setInterval(() => {
      this.moveCardWithAnimation();
    }, 1000) as unknown as number;
  }

  stopAnimation(): void {
    this.isAnimating = false;

    if (this.moveInterval) {
      clearInterval(this.moveInterval);
      this.moveInterval = undefined;
    }

    this.animationFrameIds.forEach((id) => cancelAnimationFrame(id));
    this.animationFrameIds.clear();
  }

  resetCards(): void {
    this.stopAnimation();

    this.currentTargetStack = 1;
    this.movedCards = 0;

    const firstStack = this.stacks[0];

    const animatingCards: Sprite[] = [];
    for (let i = this.children.length - 1; i >= 0; i--) {
      const child = this.children[i];
      if (
        child instanceof Sprite &&
        !this.stacks.includes(child as Container)
      ) {
        animatingCards.push(child);
      }
    }

    for (const card of animatingCards) {
      this.removeChild(card);
      firstStack.addChild(card);
    }

    for (let i = 1; i < this.stacks.length; i++) {
      const stack = this.stacks[i];
      while (stack.children.length > 1) {
        const card = stack.children[stack.children.length - 1];
        stack.removeChild(card);
        firstStack.addChild(card);
      }
    }

    for (const stack of this.stacks) {
      this.relayoutStack(stack);
    }
  }

  moveCardWithAnimation(): void {
    const fromIndex = 0;
    const toIndex = this.currentTargetStack;

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

    if (fromStack.children.length <= 1) {
      return;
    }

    const card = fromStack.children[fromStack.children.length - 1];

    const globalPos = card.getGlobalPosition();

    fromStack.removeChild(card);
    this.addChild(card);
    this.movedCards++;

    const localPos = this.toLocal(globalPos);
    card.position.set(localPos.x, localPos.y);

    const targetStackCardCount = toStack.children.length - 1;
    const targetX = toStack.x + targetStackCardCount * 0.3;
    const targetY = toStack.y + targetStackCardCount * 0.3;

    const startX = card.x;
    const startY = card.y;
    const startTime = Date.now();
    const duration = 2000;

    this.isAnimating = true;
    let frameId: number;

    const animate = () => {
      if (!this.isAnimating) {
        this.animationFrameIds.delete(frameId);
        return;
      }

      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easeProgress = 1 - Math.pow(1 - progress, 3);

      card.x = startX + (targetX - startX) * easeProgress;
      card.y = startY + (targetY - startY) * easeProgress;

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
        this.animationFrameIds.add(frameId);
      } else {
        this.animationFrameIds.delete(frameId);
        this.removeChild(card);
        toStack.addChild(card);
        this.relayoutStack(toStack);
      }
    };

    frameId = requestAnimationFrame(animate);
    this.animationFrameIds.add(frameId);
  }

  destroy(options?: boolean): void {
    this.stopAnimation();
    super.destroy(options);
  }
}
