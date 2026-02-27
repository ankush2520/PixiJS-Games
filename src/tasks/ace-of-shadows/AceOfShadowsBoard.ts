import { Assets, Container, Sprite, Texture } from "pixi.js";

export class AceOfShadowsBoard extends Container {
  private _cardTexture?: Texture;
  private readonly stacksContainer = new Container();
  private readonly stackBasePositions: Array<{ x: number; y: number }> = [];
  private readonly stackPlaceholders: Sprite[] = [];

  private stacks: Container[] = [];

  constructor() {
    super();
    this.addChild(this.stacksContainer);
  }

  async init(): Promise<void> {
    this._cardTexture = await Assets.load("/assets/card.png");
    this.createStackPlaceholders();
  }

  get cardTexture(): Texture | undefined {
    return this._cardTexture;
  }

  get stackPositions(): ReadonlyArray<{ x: number; y: number }> {
    return this.stackBasePositions;
  }

  resize(width: number, height: number): void {
    this.position.set(width / 2, height / 2);
  }

  private createStackPlaceholders(): void {
    if (!this._cardTexture) {
      return;
    }

    this.stackBasePositions.length = 0;
    this.stacksContainer.removeChildren();
    for (const placeholder of this.stackPlaceholders) {
      placeholder.destroy();
    }
    this.stackPlaceholders.length = 0;

    const spacingX = 220;
    const spacingY = 260;
    const columns = 3;
    const rows = 2;

    for (let row = 0; row < rows; row++) {
      const y = (row - (rows - 1) / 2) * spacingY;

      for (let col = 0; col < columns; col++) {
        const x = (col - (columns - 1) / 2) * spacingX;
        this.stackBasePositions.push({ x, y });

        const stackBase = new Sprite(this._cardTexture);
        stackBase.anchor.set(0.5);
        stackBase.width = 240;
        stackBase.height = 320;
        stackBase.alpha = 0.25;
        stackBase.position.set(x, y);

        this.stackPlaceholders.push(stackBase);
        this.stacksContainer.addChild(stackBase);
      }
    }
  }
}
