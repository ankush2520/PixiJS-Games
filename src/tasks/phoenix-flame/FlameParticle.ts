import { Container, Sprite, Texture } from "pixi.js";

export class FlameParticle extends Container {
  private static readonly FLAME_COLORS = [0xffa500, 0xff4500, 0xffd700];
  private static readonly BASE_SIZE = 24;
  private readonly sprite: Sprite;
  private velocityX = 0;
  private velocityY = 0;
  private lifetimeSeconds = 1;
  private ageSeconds = 0;
  private initialAlpha = 1;
  private initialScale = 1;

  constructor() {
    super();
    this.sprite = new Sprite(Texture.WHITE);
    this.sprite.anchor.set(0.5);
    this.sprite.width = FlameParticle.BASE_SIZE;
    this.sprite.height = FlameParticle.BASE_SIZE;
    this.sprite.blendMode = "add";
    this.addChild(this.sprite);
  }

  reset(x: number, y: number): void {
    this.position.set(x, y);

    this.sprite.tint =
      FlameParticle.FLAME_COLORS[
        Math.floor(Math.random() * FlameParticle.FLAME_COLORS.length)
      ];
    this.initialScale = this.randomInRange(0.8, 1.8);
    this.initialAlpha = this.randomInRange(0.6, 1.0);
    this.velocityY = -this.randomInRange(80, 220);
    this.velocityX = this.randomInRange(-24, 24);
    this.lifetimeSeconds = this.randomInRange(0.8, 1.6);
    this.ageSeconds = 0;

    const initialSize = FlameParticle.BASE_SIZE * this.initialScale;
    this.sprite.width = initialSize;
    this.sprite.height = initialSize;
    this.sprite.alpha = this.initialAlpha;
  }

  update(deltaSeconds: number): boolean {
    this.ageSeconds += deltaSeconds;
    const progress = Math.min(1, this.ageSeconds / this.lifetimeSeconds);

    this.x += this.velocityX * deltaSeconds;
    this.y += this.velocityY * deltaSeconds;
    this.sprite.alpha = this.initialAlpha * (1 - progress);
    const currentSize =
      FlameParticle.BASE_SIZE * this.initialScale * (1 - progress * 0.2);
    this.sprite.width = currentSize;
    this.sprite.height = currentSize;

    return this.ageSeconds >= this.lifetimeSeconds;
  }

  private randomInRange(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }
}
