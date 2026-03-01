import { Particle, Texture } from "pixi.js";

export class SmokeParticle {
  private readonly particle: Particle;
  private readonly sizeMultiplier: number;
  private velocityX = 0;
  private velocityY = 0;
  private lifetimeSeconds = 1;
  private ageSeconds = 0;
  private initialAlpha = 1;
  private initialScaleX = 1;
  private initialScaleY = 1;
  private driftPhase = 0;
  private driftFrequency = 0;
  private driftStrength = 0;
  private spinVelocity = 0;

  constructor(texture: Texture, sizeMultiplier = 1) {
    const safeTexture = texture ?? Texture.WHITE;
    this.sizeMultiplier = sizeMultiplier;
    this.particle = new Particle({
      texture: safeTexture,
      anchorX: 0.5,
      anchorY: 0.5,
      alpha: 0,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      tint: 0x5a514a,
    });
  }

  get view(): Particle {
    return this.particle;
  }

  reset(x: number, y: number): void {
    this.particle.x = x;
    this.particle.y = y;

    const baseScale = this.randomInRange(0.74, 1.22);
    this.initialScaleX =
      baseScale * this.randomInRange(0.85, 1.3) * this.sizeMultiplier;
    this.initialScaleY =
      baseScale * this.randomInRange(0.9, 1.36) * this.sizeMultiplier;
    this.initialAlpha = this.randomInRange(0.16, 0.34);

    this.velocityY = -this.randomInRange(36, 82);
    this.velocityX = this.randomInRange(-22, 22);
    this.lifetimeSeconds = this.randomInRange(1.25, 2.5);
    this.ageSeconds = 0;

    this.driftPhase = this.randomInRange(0, Math.PI * 2);
    this.driftFrequency = this.randomInRange(1.4, 2.9);
    this.driftStrength = this.randomInRange(10, 24);
    this.spinVelocity = this.randomInRange(-0.25, 0.25);

    this.particle.scaleX = this.initialScaleX;
    this.particle.scaleY = this.initialScaleY;
    this.particle.alpha = 0;
    this.particle.rotation = this.randomInRange(-0.2, 0.2);
    this.particle.tint = 0x5e554d;
  }

  update(deltaSeconds: number): boolean {
    this.ageSeconds += deltaSeconds;
    const progress = Math.min(1, this.ageSeconds / this.lifetimeSeconds);
    const remaining = 1 - progress;
    const fadeIn = Math.min(1, progress / 0.22);
    const fadeOut = Math.pow(remaining, 1.28);

    this.velocityY -= 18 * deltaSeconds;
    this.velocityX *= Math.max(0, 1 - 1.6 * deltaSeconds);
    const drift =
      Math.sin(this.ageSeconds * this.driftFrequency + this.driftPhase) *
      this.driftStrength *
      (0.42 + remaining * 0.58);

    this.particle.x += (this.velocityX + drift) * deltaSeconds;
    this.particle.y += this.velocityY * deltaSeconds;
    this.particle.alpha = this.initialAlpha * fadeIn * fadeOut;

    const widthGrowth = 1 + 0.9 * progress;
    const heightGrowth = 1 + 1.06 * progress;
    this.particle.scaleX = this.initialScaleX * widthGrowth;
    this.particle.scaleY = this.initialScaleY * heightGrowth;

    this.particle.rotation += this.spinVelocity * deltaSeconds;
    this.particle.tint = this.getSmokeTint(progress);

    return this.ageSeconds >= this.lifetimeSeconds;
  }

  deactivate(): void {
    this.particle.alpha = 0;
  }

  private getSmokeTint(progress: number): number {
    if (progress < 0.58) {
      return this.lerpColor(0x61574f, 0x4b423b, progress / 0.58);
    }

    return this.lerpColor(0x4b423b, 0x191615, (progress - 0.58) / 0.42);
  }

  private randomInRange(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }

  private lerpColor(from: number, to: number, t: number): number {
    const factor = Math.max(0, Math.min(1, t));
    const fromR = (from >> 16) & 0xff;
    const fromG = (from >> 8) & 0xff;
    const fromB = from & 0xff;
    const toR = (to >> 16) & 0xff;
    const toG = (to >> 8) & 0xff;
    const toB = to & 0xff;

    const r = Math.round(fromR + (toR - fromR) * factor);
    const g = Math.round(fromG + (toG - fromG) * factor);
    const b = Math.round(fromB + (toB - fromB) * factor);

    return (r << 16) | (g << 8) | b;
  }
}
