import { Container } from "pixi.js";
import { FlameParticle } from "./FlameParticle";

export class PhoenixFlameBoard extends Container {
  private particles: FlameParticle[] = [];
  private readonly maxParticles = 10;
  private spawnX = 0;
  private spawnY = 0;
  private readonly activeParticles: FlameParticle[] = [];
  private readonly pooledParticles: FlameParticle[] = [];
  private spawnAccumulator = 0;
  private readonly spawnPerSecond = 24;

  init(): void {
    while (this.particles.length > 0) {
      const particle = this.particles.pop();
      if (!particle) {
        continue;
      }

      this.removeChild(particle);
      particle.destroy();
    }
    this.activeParticles.length = 0;
    this.pooledParticles.length = 0;
    this.spawnAccumulator = 0;

    for (let i = 0; i < this.maxParticles; i++) {
      const p = new FlameParticle();
      this.addChild(p);
      this.particles.push(p);
      this.pooledParticles.push(p);
      p.visible = false;
    }
  }

  update(delta: number): void {
    const deltaSeconds = delta / 60;
    this.spawnAccumulator += deltaSeconds * this.spawnPerSecond;

    while (this.spawnAccumulator >= 1 && this.pooledParticles.length > 0) {
      this.spawnAccumulator -= 1;
      const particle = this.pooledParticles.pop();
      if (!particle) {
        break;
      }

      const xJitter = (Math.random() - 0.5) * 28;
      const yJitter = -Math.random() * 8;
      particle.reset(this.spawnX + xJitter, this.spawnY + yJitter);
      particle.visible = true;
      this.activeParticles.push(particle);
    }

    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const particle = this.activeParticles[i];
      if (!particle.update(deltaSeconds)) {
        continue;
      }

      particle.visible = false;
      this.activeParticles.splice(i, 1);
      this.pooledParticles.push(particle);
    }
  }

  resize(width: number, height: number): void {
    this.spawnX = width * 0.5;
    this.spawnY = height * 0.8;

    for (const particle of this.activeParticles) {
      particle.reset(this.spawnX, this.spawnY);
    }
  }
}
