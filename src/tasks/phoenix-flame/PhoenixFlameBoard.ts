import { Container, Particle, ParticleContainer, Texture } from "pixi.js"; // Import PIXI types needed for layered particle rendering.
import { FlameParticle } from "./FlameParticle"; // Import primary fire particle behavior.
import { SmokeParticle } from "./SmokeParticle"; // Import secondary smoke particle behavior.

export class PhoenixFlameBoard extends Container {
  // Flame layer state.
  private readonly flameParticles: FlameParticle[] = []; // Track all allocated flame particles.
  private readonly activeFlames: FlameParticle[] = []; // Track currently active flame particles.
  private readonly pooledFlames: FlameParticle[] = []; // Track reusable flame particles.

  // Smoke layer state.
  private readonly smokeParticles: SmokeParticle[] = []; // Track all allocated smoke particles.
  private readonly activeSmoke: SmokeParticle[] = []; // Track currently active smoke particles.
  private readonly pooledSmoke: SmokeParticle[] = []; // Track reusable smoke particles.

  // Capacity and scale controls.
  private readonly maxFlameParticles = 66; // Limit total flame particle instances.
  private readonly maxSmokeParticles = 42; // Limit total smoke particle instances.
  private readonly flameScale = 3.825; // Set flame sprite scale multiplier (1.5x).
  private readonly smokeScale = 3.6; // Set smoke sprite scale multiplier (1.5x).

  // Emitter position and timing.
  private spawnX = 0; // Store emitter x coordinate.
  private spawnY = 0; // Store emitter y coordinate.
  private emitterTime = 0; // Track elapsed emitter time for oscillation.

  // Spawn accumulation controls.
  private flameSpawnAccumulator = 0; // Track frame-accumulated flame spawn budget.
  private smokeSpawnAccumulator = 0; // Track frame-accumulated smoke spawn budget.
  private readonly flameSpawnPerSecond = 52; // Base emission rate for flames.
  private readonly smokeSpawnPerSecond = 8; // Base emission rate for smoke.

  // Render containers.
  private readonly smokeContainer: ParticleContainer<Particle>; // Container for smoke particles.
  private readonly flameContainer: ParticleContainer<Particle>; // Container for flame particles.

  // Cached textures.
  private flameTexture: Texture | null = null; // Procedural flame texture cache.
  private smokeTexture: Texture | null = null; // Procedural smoke texture cache.

  constructor() {
    super();

    this.smokeContainer = new ParticleContainer({
      dynamicProperties: {
        position: true,
        rotation: true,
        vertex: true,
        color: true,
      },
    });
    this.smokeContainer.blendMode = "normal";

    this.flameContainer = new ParticleContainer({
      dynamicProperties: {
        position: true,
        rotation: true,
        vertex: true,
        color: true,
      },
    });
    this.flameContainer.blendMode = "add";

    this.addChild(this.smokeContainer, this.flameContainer); // Render smoke first, fire on top.
  }

  init(): void {
    if (!this.flameTexture) {
      this.flameTexture = this.createFlameTexture();
    }
    if (!this.smokeTexture) {
      this.smokeTexture = this.createSmokeTexture();
    }

    this.activeFlames.length = 0;
    this.pooledFlames.length = 0;
    this.flameParticles.length = 0;
    this.activeSmoke.length = 0;
    this.pooledSmoke.length = 0;
    this.smokeParticles.length = 0;
    this.flameSpawnAccumulator = 0;
    this.smokeSpawnAccumulator = 0;
    this.emitterTime = 0;

    for (const child of [...this.flameContainer.particleChildren]) {
      this.flameContainer.removeParticle(child);
    }
    for (const child of [...this.smokeContainer.particleChildren]) {
      this.smokeContainer.removeParticle(child);
    }

    for (let i = 0; i < this.maxFlameParticles; i++) {
      const flame = new FlameParticle(
        this.flameTexture ?? Texture.WHITE,
        this.flameScale,
      );
      flame.deactivate();
      this.flameParticles.push(flame);
      this.pooledFlames.push(flame);
      this.flameContainer.addParticle(flame.view);
    }

    for (let i = 0; i < this.maxSmokeParticles; i++) {
      const smoke = new SmokeParticle(
        this.smokeTexture ?? Texture.WHITE,
        this.smokeScale,
      );
      smoke.deactivate();
      this.smokeParticles.push(smoke);
      this.pooledSmoke.push(smoke);
      this.smokeContainer.addParticle(smoke.view);
    }

    this.flameContainer.update();
    this.smokeContainer.update();
  }

  update(delta: number): void {
    const deltaSeconds = delta / 60;
    this.emitterTime += deltaSeconds;

    // Combine slow breathing, fast flutter, and random bursts for non-uniform flame intensity.
    const breath = 0.74 + 0.34 * (0.5 + 0.5 * Math.sin(this.emitterTime * 2.7));
    const flutter =
      0.88 + 0.18 * (0.5 + 0.5 * Math.sin(this.emitterTime * 9.3));
    const burst = Math.random() < deltaSeconds * 0.9 ? 1.25 : 1;
    const intensity = breath * flutter * burst;

    this.flameSpawnAccumulator +=
      deltaSeconds * this.flameSpawnPerSecond * intensity;
    this.smokeSpawnAccumulator +=
      deltaSeconds *
      this.smokeSpawnPerSecond *
      (0.72 + 0.34 * breath) *
      (0.95 + 0.08 * Math.random());

    this.spawnFlames(intensity);
    this.spawnSmoke(intensity);
    this.updateFlames(deltaSeconds);
    this.updateSmoke(deltaSeconds);
  }

  resize(width: number, height: number): void {
    this.spawnX = width * 0.5;
    this.spawnY = height * 0.84; // Keep the fire base near the bottom of the scene.
  }

  destroy(options?: boolean): void {
    this.activeFlames.length = 0;
    this.pooledFlames.length = 0;
    this.flameParticles.length = 0;
    this.activeSmoke.length = 0;
    this.pooledSmoke.length = 0;
    this.smokeParticles.length = 0;
    super.destroy(options);
  }

  private spawnFlames(intensity: number): void {
    while (this.flameSpawnAccumulator >= 1 && this.pooledFlames.length > 0) {
      this.flameSpawnAccumulator -= 1;
      const flame = this.pooledFlames.pop();
      if (!flame) {
        break;
      }

      // Torus-like spawn around base, matching Pixi emitter flame examples.
      const angle = Math.random() * Math.PI * 2;
      const radius = 1.5 + Math.random() * (7 + intensity * 9);
      const ringX = Math.cos(angle) * radius;
      const ringY = -Math.abs(Math.sin(angle) * radius * 0.42); // Bias flame spawn above the base.
      const sway =
        Math.sin(this.emitterTime * 1.25) * (10 + intensity * 9) +
        Math.sin(this.emitterTime * 4.6) * 4;
      const yJitter = Math.random() * 12 - 10; // Favor upward jitter from the base.

      flame.reset(this.spawnX + sway + ringX, this.spawnY + ringY + yJitter);
      this.activeFlames.push(flame);
    }
  }

  private spawnSmoke(intensity: number): void {
    while (this.smokeSpawnAccumulator >= 1 && this.pooledSmoke.length > 0) {
      this.smokeSpawnAccumulator -= 1;

      // Skip some spawn slots to create irregular puffs.
      if (Math.random() < 0.32) {
        continue;
      }

      const smoke = this.pooledSmoke.pop();
      if (!smoke) {
        break;
      }

      const sway = Math.sin(this.emitterTime * 1.1) * (8 + intensity * 5);
      const xJitter = (Math.random() - 0.5) * (32 + intensity * 26);
      const yJitter = Math.random() * 8 - 14; // Keep smoke starting above the flame base.

      smoke.reset(this.spawnX + sway + xJitter, this.spawnY + yJitter);
      this.activeSmoke.push(smoke);
    }
  }

  private updateFlames(deltaSeconds: number): void {
    for (let i = this.activeFlames.length - 1; i >= 0; i--) {
      const flame = this.activeFlames[i];
      if (!flame.update(deltaSeconds)) {
        continue;
      }

      flame.deactivate();
      this.activeFlames.splice(i, 1);
      this.pooledFlames.push(flame);
    }
  }

  private updateSmoke(deltaSeconds: number): void {
    for (let i = this.activeSmoke.length - 1; i >= 0; i--) {
      const smoke = this.activeSmoke[i];
      if (!smoke.update(deltaSeconds)) {
        continue;
      }

      smoke.deactivate();
      this.activeSmoke.splice(i, 1);
      this.pooledSmoke.push(smoke);
    }
  }

  private createFlameTexture(): Texture {
    const canvas = document.createElement("canvas");
    canvas.width = 192;
    canvas.height = 192;
    const context = canvas.getContext("2d");

    if (!context) {
      return Texture.WHITE;
    }

    const outerGlow = context.createRadialGradient(96, 124, 16, 96, 124, 88);
    outerGlow.addColorStop(0, "rgba(255, 194, 112, 0.86)");
    outerGlow.addColorStop(0.4, "rgba(255, 124, 40, 0.54)");
    outerGlow.addColorStop(0.72, "rgba(178, 26, 12, 0.28)");
    outerGlow.addColorStop(1, "rgba(42, 2, 4, 0)");
    context.fillStyle = outerGlow;
    context.beginPath(); // Jagged outer shell for non-egg flame silhouette.
    context.moveTo(96, 184);
    context.lineTo(80, 150);
    context.lineTo(58, 162);
    context.lineTo(72, 122);
    context.lineTo(46, 130);
    context.lineTo(64, 88);
    context.lineTo(76, 96);
    context.lineTo(90, 34);
    context.lineTo(108, 92);
    context.lineTo(122, 80);
    context.lineTo(146, 128);
    context.lineTo(122, 122);
    context.lineTo(138, 160);
    context.lineTo(114, 148);
    context.fill();

    const bodyGradient = context.createLinearGradient(96, 18, 96, 186);
    bodyGradient.addColorStop(0, "rgba(255, 236, 170, 0)");
    bodyGradient.addColorStop(0.2, "rgba(255, 216, 132, 0.2)");
    bodyGradient.addColorStop(0.5, "rgba(255, 156, 50, 0.54)");
    bodyGradient.addColorStop(0.82, "rgba(210, 42, 16, 0.34)");
    bodyGradient.addColorStop(1, "rgba(60, 3, 5, 0)");
    context.fillStyle = bodyGradient;
    context.beginPath(); // Inner body with multiple tongues.
    context.moveTo(96, 174);
    context.lineTo(84, 140);
    context.lineTo(72, 148);
    context.lineTo(82, 114);
    context.lineTo(64, 118);
    context.lineTo(80, 86);
    context.lineTo(90, 92);
    context.lineTo(96, 42);
    context.lineTo(102, 90);
    context.lineTo(114, 84);
    context.lineTo(130, 118);
    context.lineTo(112, 114);
    context.lineTo(122, 148);
    context.lineTo(108, 140);
    context.fill();

    const innerCore = context.createLinearGradient(96, 40, 96, 172);
    innerCore.addColorStop(0, "rgba(255, 255, 244, 0.96)");
    innerCore.addColorStop(0.34, "rgba(255, 236, 168, 0.9)");
    innerCore.addColorStop(0.66, "rgba(255, 146, 36, 0.56)");
    innerCore.addColorStop(1, "rgba(196, 28, 14, 0)");
    context.fillStyle = innerCore;
    context.beginPath(); // Hot center tongue.
    context.moveTo(96, 48);
    context.lineTo(108, 150);
    context.lineTo(96, 138);
    context.lineTo(84, 150);
    context.fill();

    const baseGlow = context.createRadialGradient(96, 168, 8, 96, 168, 52);
    baseGlow.addColorStop(0, "rgba(255, 204, 120, 0.5)");
    baseGlow.addColorStop(0.54, "rgba(255, 96, 24, 0.24)");
    baseGlow.addColorStop(1, "rgba(76, 6, 8, 0)");
    context.fillStyle = baseGlow;
    context.beginPath();
    context.ellipse(96, 170, 52, 16, 0, 0, Math.PI * 2);
    context.fill();

    return Texture.from(canvas);
  }

  private createSmokeTexture(): Texture {
    const canvas = document.createElement("canvas");
    canvas.width = 160;
    canvas.height = 160;
    const context = canvas.getContext("2d");

    if (!context) {
      return Texture.WHITE;
    }

    const body = context.createRadialGradient(80, 88, 8, 80, 88, 66);
    body.addColorStop(0, "rgba(118, 109, 102, 0.36)");
    body.addColorStop(0.45, "rgba(74, 68, 64, 0.26)");
    body.addColorStop(1, "rgba(20, 18, 18, 0)");
    context.fillStyle = body;
    context.beginPath();
    context.arc(80, 88, 66, 0, Math.PI * 2);
    context.fill();

    const plume = context.createLinearGradient(80, 18, 80, 152);
    plume.addColorStop(0, "rgba(124, 116, 108, 0)");
    plume.addColorStop(0.28, "rgba(102, 95, 88, 0.2)");
    plume.addColorStop(0.68, "rgba(70, 64, 60, 0.26)");
    plume.addColorStop(1, "rgba(23, 21, 20, 0)");
    context.fillStyle = plume;
    context.beginPath();
    context.ellipse(80, 86, 40, 56, 0, 0, Math.PI * 2);
    context.fill();

    return Texture.from(canvas);
  }
}
