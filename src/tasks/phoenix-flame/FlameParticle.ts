import { Particle, Texture } from "pixi.js";

export class FlameParticle {
  private readonly particle: Particle;
  private readonly sizeMultiplier: number;
  private velocityX = 0;
  private velocityY = 0;
  private lifetimeSeconds = 1;
  private ageSeconds = 0;
  private initialAlpha = 1;
  private initialScaleX = 1;
  private initialScaleY = 1;
  private wobblePhase = 0;
  private wobbleStrength = 0;
  private wobbleFrequency = 0;
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
      tint: 0xffa500,
    });
  }

  get view(): Particle {
    return this.particle;
  }

  reset(x: number, y: number): void {
    this.particle.x = x;
    this.particle.y = y;

    const baseScale = this.randomInRange(0.82, 1.35);
    this.initialScaleX =
      baseScale * this.randomInRange(0.75, 1.15) * this.sizeMultiplier;
    this.initialScaleY =
      baseScale * this.randomInRange(1.05, 1.8) * this.sizeMultiplier;
    this.initialAlpha = this.randomInRange(0.55, 0.9);

    this.velocityY = -this.randomInRange(110, 185);
    this.velocityX = this.randomInRange(-8, 8);
    this.lifetimeSeconds = this.randomInRange(0.85, 1.4);
    this.ageSeconds = 0;

    this.wobblePhase = this.randomInRange(0, Math.PI * 2);
    this.wobbleStrength = this.randomInRange(12, 24);
    this.wobbleFrequency = this.randomInRange(3.2, 6.1);
    this.spinVelocity = this.randomInRange(-0.35, 0.35);

    this.particle.scaleX = this.initialScaleX;
    this.particle.scaleY = this.initialScaleY;
    this.particle.alpha = 0;
    this.particle.rotation = this.randomInRange(-0.03, 0.03);
    this.particle.tint = 0xfff5cd;
  }

  update(deltaSeconds: number): boolean {
    this.ageSeconds += deltaSeconds;
    const progress = Math.min(1, this.ageSeconds / this.lifetimeSeconds);
    const remaining = 1 - progress;
    const fadeIn = Math.min(1, progress / 0.12);
    const fadeOut = Math.pow(remaining, 0.8);

    this.velocityY -= 60 * deltaSeconds;
    const wobble =
      Math.sin(this.ageSeconds * this.wobbleFrequency + this.wobblePhase) *
      this.wobbleStrength *
      remaining;

    this.particle.x += (this.velocityX + wobble) * deltaSeconds;
    this.particle.y += this.velocityY * deltaSeconds;
    this.particle.alpha = this.initialAlpha * fadeIn * fadeOut;

    // Real flames widen and soften as they rise.
    const widthGrowth = 0.82 + 0.5 * progress;
    const heightDecay = 1.05 - 0.42 * progress;
    this.particle.scaleX = this.initialScaleX * widthGrowth;
    this.particle.scaleY = this.initialScaleY * Math.max(0.5, heightDecay);

    this.particle.rotation += this.spinVelocity * deltaSeconds;
    this.particle.tint = this.getFlameTint(progress);

    return this.ageSeconds >= this.lifetimeSeconds;
  }

  deactivate(): void {
    this.particle.alpha = 0;
  }

  private randomInRange(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }

  private getFlameTint(progress: number): number {
    if (progress < 0.28) {
      return this.lerpColor(0xfff7d8, 0xffd36f, progress / 0.28);
    }

    if (progress < 0.72) {
      return this.lerpColor(0xffd36f, 0xff8422, (progress - 0.28) / 0.44);
    }

    return this.lerpColor(0xff8422, 0x421000, (progress - 0.72) / 0.28);
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
