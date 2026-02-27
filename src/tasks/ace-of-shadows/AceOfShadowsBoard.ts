import { Container, Graphics } from "pixi.js";

export class AceOfShadowsBoard extends Container {
  private readonly stackBasePositions: Array<{ x: number; y: number }> = [];
  private readonly stacks: Container[] = [];

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

    for (let i = 0; i < 5; i++) {
      const cardGraphics = new Graphics();
      cardGraphics.rect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight);
      cardGraphics.fill(colors[i]);
      cardGraphics.stroke({ width: 3, color: 0xffffff });

      cardGraphics.x = i * 4;
      cardGraphics.y = i * 4;

      firstStack.addChild(cardGraphics);
    }
  }
}
