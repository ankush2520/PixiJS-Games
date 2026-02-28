import { Container, Particle, ParticleContainer, Texture } from "pixi.js";
import { FlameParticle } from "./FlameParticle";

export class PhoenixFlameBoard extends Container {
  private readonly particles: FlameParticle[] = [];
  private readonly maxParticles = 10;
  private readonly flameScale = 1.5;
  private spawnX = 0;
  private spawnY = 0;
  private emitterTime = 0;
  private readonly activeParticles: FlameParticle[] = [];
  private readonly pooledParticles: FlameParticle[] = [];
  private spawnAccumulator = 0;
  private readonly spawnPerSecond = 18;
  private readonly particleContainer: ParticleContainer<Particle>;
  private flameTexture: Texture | null = null;

  constructor() {
    super();
    this.particleContainer = new ParticleContainer({
      dynamicProperties: {
        position: true,
        rotation: true,
        vertex: true,
        color: true,
      },
    });
    this.particleContainer.blendMode = "add";
    this.addChild(this.particleContainer);
  }

  init(): void {
    if (!this.flameTexture) {
      this.flameTexture = this.createFlameTexture();
    }

    this.activeParticles.length = 0;
    this.pooledParticles.length = 0;
    this.particles.length = 0;
    this.spawnAccumulator = 0;
    this.emitterTime = 0;

    for (const child of [...this.particleContainer.particleChildren]) {
      this.particleContainer.removeParticle(child);
    }

    for (let i = 0; i < this.maxParticles; i++) {
      const p = new FlameParticle(
        this.flameTexture ?? Texture.WHITE,
        this.flameScale,
      );
      p.deactivate();
      this.particles.push(p);
      this.pooledParticles.push(p);
      this.particleContainer.addParticle(p.view);
    }

    this.particleContainer.update();
  }

  update(delta: number): void {
    const deltaSeconds = delta / 60;
    this.emitterTime += deltaSeconds;
    this.spawnAccumulator += deltaSeconds * this.spawnPerSecond;

    while (this.spawnAccumulator >= 1 && this.pooledParticles.length > 0) {
      this.spawnAccumulator -= 1;
      const particle = this.pooledParticles.pop();
      if (!particle) {
        break;
      }

      const sway = Math.sin(this.emitterTime * 1.35) * 12;
      const xJitter = (Math.random() - 0.5) * 56;
      const yJitter = -Math.random() * 8;
      particle.reset(this.spawnX + sway + xJitter, this.spawnY + yJitter);
      this.activeParticles.push(particle);
    }

    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const particle = this.activeParticles[i];
      if (!particle.update(deltaSeconds)) {
        continue;
      }

      particle.deactivate();
      this.activeParticles.splice(i, 1);
      this.pooledParticles.push(particle);
    }
  }

  resize(width: number, height: number): void {
    this.spawnX = width * 0.5;
    this.spawnY = height * 0.5;
  }

  destroy(options?: boolean): void {
    this.activeParticles.length = 0;
    this.pooledParticles.length = 0;
    this.particles.length = 0;
    super.destroy(options);
  }

  private createFlameTexture(): Texture {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const context = canvas.getContext("2d");

    if (!context) {
      return Texture.WHITE;
    }

    // Soft sprite with no hard edges. Shape comes from per-particle scaling/motion.
    const outerGlow = context.createRadialGradient(64, 78, 10, 64, 78, 60);
    outerGlow.addColorStop(0, "rgba(255, 220, 120, 0.95)");
    outerGlow.addColorStop(0.4, "rgba(255, 146, 35, 0.52)");
    outerGlow.addColorStop(1, "rgba(255, 70, 0, 0)");
    context.fillStyle = outerGlow;
    context.beginPath();
    context.arc(64, 78, 60, 0, Math.PI * 2);
    context.fill();

    const innerCore = context.createRadialGradient(64, 70, 4, 64, 70, 28);
    innerCore.addColorStop(0, "rgba(255, 255, 240, 0.96)");
    innerCore.addColorStop(0.48, "rgba(255, 210, 110, 0.78)");
    innerCore.addColorStop(1, "rgba(255, 130, 20, 0)");
    context.fillStyle = innerCore;
    context.beginPath();
    context.arc(64, 70, 28, 0, Math.PI * 2);
    context.fill();

    return Texture.from(canvas);
  }
}
