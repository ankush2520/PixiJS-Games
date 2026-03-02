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
  private static readonly TOTAL_CARDS = 144;
  private static readonly FIRST_STACK_FACE_COLOR = 0xf56f76;
  private static readonly FIRST_STACK_OFFSET_X = -0.8;
  private static readonly FIRST_STACK_OFFSET_Y = -0.8;

  get cardsMovedCount(): number {
    return this.movedCards;
  }

  get stackPositions(): ReadonlyArray<{ x: number; y: number }> {
    return this.stackBasePositions;
  }

  private ensureCardTextures(): void {
    if (this.cardTextures.length > 0) return;

    for (
      let cardIndex = 0;
      cardIndex < AceOfShadowsBoard.TOTAL_CARDS;
      cardIndex++
    ) {
      const edgeColor = Math.floor(Math.random() * 0xffffff);
      const canvas = document.createElement("canvas");
      canvas.width = AceOfShadowsBoard.CARD_WIDTH;
      canvas.height = AceOfShadowsBoard.CARD_HEIGHT;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        this.cardTextures.push(Texture.WHITE);
        continue;
      }

      const faceColor = AceOfShadowsBoard.FIRST_STACK_FACE_COLOR;
      const faceR = (faceColor >> 16) & 0xff;
      const faceG = (faceColor >> 8) & 0xff;
      const faceB = faceColor & 0xff;

      const edgeR = (edgeColor >> 16) & 0xff;
      const edgeG = (edgeColor >> 8) & 0xff;
      const edgeB = edgeColor & 0xff;

      ctx.fillStyle = `rgb(${faceR},${faceG},${faceB})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = `rgb(${edgeR},${edgeG},${edgeB})`;
      ctx.fillRect(0, 0, canvas.width, 2);
      ctx.fillRect(0, 0, 2, canvas.height);

      ctx.strokeStyle = "rgba(0, 0, 0, 0.25)";
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
    const spacingY = isPortrait ? 180 : 210;
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

    for (let i = 0; i < AceOfShadowsBoard.TOTAL_CARDS; i++) {
      const card = new Sprite(this.cardTextures[i]);
      card.anchor.set(0.5);

      const layerFromFront = AceOfShadowsBoard.TOTAL_CARDS - 1 - i;
      card.x = layerFromFront * AceOfShadowsBoard.FIRST_STACK_OFFSET_X;
      card.y = layerFromFront * AceOfShadowsBoard.FIRST_STACK_OFFSET_Y;

      firstStack.addChild(card);
    }
  }

  private relayoutStack(stack: Container): void {
    const isFirstStack = this.stacks.length > 0 && stack === this.stacks[0];

    for (let i = 1; i < stack.children.length; i++) {
      const card = stack.children[i];
      if (isFirstStack) {
        const layerFromFront = stack.children.length - 1 - i;
        card.x = layerFromFront * AceOfShadowsBoard.FIRST_STACK_OFFSET_X;
        card.y = layerFromFront * AceOfShadowsBoard.FIRST_STACK_OFFSET_Y;
        continue;
      }

      const cardIndex = i - 1;
      card.x = cardIndex * 1.5;
      card.y = cardIndex * 1.5;
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

  // TEMP: Quick test method to distribute all cards instantly
  distributeAllCardsInstantly(): void {
    this.stopAnimation();
    const firstStack = this.stacks[0];
    let targetStackIndex = 1;

    // Move all cards except base from first stack
    while (firstStack.children.length > 1) {
      const card = firstStack.children[firstStack.children.length - 1];
      const targetStack = this.stacks[targetStackIndex];

      firstStack.removeChild(card);
      targetStack.addChild(card);
      this.movedCards++;

      // Cycle through stacks
      targetStackIndex++;
      if (targetStackIndex >= this.stacks.length) {
        targetStackIndex = 1;
      }
    }

    // Relayout all stacks
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
    const targetX = toStack.x + targetStackCardCount * 1.5;
    const targetY = toStack.y + targetStackCardCount * 1.5;

    const startX = card.x;
    const startY = card.y;
    const startTime = Date.now();
    const duration = 2000; // Reduced from 2000 for 100x faster testing

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
