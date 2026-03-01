import { Container, Particle, ParticleContainer, Texture } from "pixi.js"; // Import PIXI types needed for board and particle rendering.
import { FlameParticle } from "./FlameParticle"; // Import per-particle behavior class.

export class PhoenixFlameBoard extends Container {
  // Define a board that manages pooled flame particles.
  private readonly particles: FlameParticle[] = []; // Track all allocated particles.
  private readonly maxParticles = 10; // Limit the number of live/pooled particles.
  private readonly flameScale = 2.4; // Set the global flame size multiplier.
  private spawnX = 0; // Store emitter X position.
  private spawnY = 0; // Store emitter Y position.
  private emitterTime = 0; // Track elapsed emitter time for sway animation.
  private readonly activeParticles: FlameParticle[] = []; // Store particles currently animating.
  private readonly pooledParticles: FlameParticle[] = []; // Store reusable inactive particles.
  private spawnAccumulator = 0; // Accumulate spawn budget across frames.
  private readonly spawnPerSecond = 18; // Control emission rate per second.
  private readonly particleContainer: ParticleContainer<Particle>; // Hold particle sprites in an optimized PIXI container.
  private flameTexture: Texture | null = null; // Cache generated flame texture.

  constructor() {
    // Initialize board and its particle container.
    super(); // Call base PIXI container constructor.
    this.particleContainer = new ParticleContainer({
      // Create high-performance particle container.
      dynamicProperties: {
        // Enable per-frame updates for selected properties.
        position: true, // Allow particle position updates.
        rotation: true, // Allow particle rotation updates.
        vertex: true, // Allow scale/geometry updates.
        color: true, // Allow tint/alpha updates.
      }, // End dynamic property flags.
    }); // Finish particle container creation.
    this.particleContainer.blendMode = "add"; // Use additive blending for bright flame glow.
    this.addChild(this.particleContainer); // Attach particle container to scene graph.
  } // End constructor.

  init(): void {
    // Prepare texture, pool, and initial particle objects.
    if (!this.flameTexture) {
      // Lazily generate texture once.
      this.flameTexture = this.createFlameTexture(); // Create and cache procedural flame texture.
    } // End lazy texture block.

    this.activeParticles.length = 0; // Clear active list.
    this.pooledParticles.length = 0; // Clear pool list.
    this.particles.length = 0; // Clear all-particles list.
    this.spawnAccumulator = 0; // Reset spawn accumulator.
    this.emitterTime = 0; // Reset emitter clock.

    for (const child of [...this.particleContainer.particleChildren]) {
      // Iterate current particle children safely via shallow copy.
      this.particleContainer.removeParticle(child); // Remove existing particle from container.
    } // End existing-child cleanup.

    for (let i = 0; i < this.maxParticles; i++) {
      // Pre-allocate pool up to configured maximum.
      const p = new FlameParticle( // Create one flame particle instance.
        this.flameTexture ?? Texture.WHITE, // Provide cached texture with white fallback.
        this.flameScale, // Provide global flame size multiplier.
      ); // Finish particle construction.
      p.deactivate(); // Ensure particle starts hidden.
      this.particles.push(p); // Track in full particle list.
      this.pooledParticles.push(p); // Add to reusable particle pool.
      this.particleContainer.addParticle(p.view); // Add particle sprite to render container.
    } // End pool creation loop.

    this.particleContainer.update(); // Sync container internals after particle list changes.
  } // End init.

  update(delta: number): void {
    // Advance emitter and active particles each frame.
    const deltaSeconds = delta / 60; // Convert ticker delta to seconds approximation.
    this.emitterTime += deltaSeconds; // Increment emitter clock.
    this.spawnAccumulator += deltaSeconds * this.spawnPerSecond; // Accumulate spawn budget from elapsed time.

    while (this.spawnAccumulator >= 1 && this.pooledParticles.length > 0) {
      // Spawn while enough budget and pooled particles exist.
      this.spawnAccumulator -= 1; // Consume one spawn unit.
      const particle = this.pooledParticles.pop(); // Take a particle from the pool.
      if (!particle) {
        // Guard against unexpected undefined.
        break; // Exit loop if no particle is available.
      } // End null guard.

      const sway = Math.sin(this.emitterTime * 1.35) * 12; // Compute emitter sway motion.
      const xJitter = (Math.random() - 0.5) * 56; // Add random horizontal spread.
      const yJitter = -Math.random() * 8; // Add slight upward spawn jitter.
      particle.reset(this.spawnX + sway + xJitter, this.spawnY + yJitter); // Reinitialize particle at computed spawn point.
      this.activeParticles.push(particle); // Move particle into active list.
    } // End spawn loop.

    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      // Iterate active particles backward for safe removal.
      const particle = this.activeParticles[i]; // Read current active particle.
      if (!particle.update(deltaSeconds)) {
        // Update particle and skip if still alive.
        continue; // Keep active particle in list.
      } // End still-alive branch.

      particle.deactivate(); // Hide particle when lifetime ends.
      this.activeParticles.splice(i, 1); // Remove particle from active list.
      this.pooledParticles.push(particle); // Return particle to reusable pool.
    } // End active update loop.
  } // End update.

  resize(width: number, height: number): void {
    // Reposition emitter when viewport changes.
    this.spawnX = width * 0.5; // Place emitter at horizontal center.
    this.spawnY = height * 0.5; // Place emitter at vertical center.
  } // End resize.

  destroy(options?: boolean): void {
    // Cleanup internal arrays before container destroy.
    this.activeParticles.length = 0; // Clear active particles.
    this.pooledParticles.length = 0; // Clear pooled particles.
    this.particles.length = 0; // Clear master particle list.
    super.destroy(options); // Forward destroy call to parent class.
  } // End destroy.

  private createFlameTexture(): Texture {
    // Build procedural radial gradient texture for particles.
    const canvas = document.createElement("canvas"); // Allocate offscreen canvas element.
    canvas.width = 128; // Set texture width.
    canvas.height = 128; // Set texture height.
    const context = canvas.getContext("2d"); // Acquire 2D drawing context.

    if (!context) {
      // Guard when 2D context creation fails.
      return Texture.WHITE; // Fallback to white texture.
    } // End context guard.

    const outerGlow = context.createRadialGradient(64, 78, 10, 64, 78, 60); // Create outer flame glow gradient.
    outerGlow.addColorStop(0, "rgba(255, 170, 74, 0.9)"); // Add warm orange center stop.
    outerGlow.addColorStop(0.35, "rgba(255, 95, 28, 0.62)"); // Add orange-red mid stop.
    outerGlow.addColorStop(0.7, "rgba(178, 24, 14, 0.34)"); // Add darker red edge stop.
    outerGlow.addColorStop(1, "rgba(70, 6, 8, 0)"); // Fade to transparent deep red.
    context.fillStyle = outerGlow; // Select outer gradient fill style.
    context.beginPath(); // Start path for outer circle.
    context.arc(64, 78, 60, 0, Math.PI * 2); // Draw outer circular gradient area.
    context.fill(); // Fill outer glow shape.

    const innerCore = context.createRadialGradient(64, 70, 4, 64, 70, 28); // Create inner hot-core gradient.
    innerCore.addColorStop(0, "rgba(240, 209, 29, 0.98)"); // Add hot yellow center stop.
    innerCore.addColorStop(0.32, "rgba(132, 98, 11, 0.92)"); // Add darker yellow transition stop.
    innerCore.addColorStop(0.7, "rgba(255, 40, 47, 0.5)"); // Add red transition stop.
    innerCore.addColorStop(1, "rgba(71, 24, 20, 0)"); // Fade inner core to transparent ember tone.
    context.fillStyle = innerCore; // Select inner gradient fill style.
    context.beginPath(); // Start path for inner core circle.
    context.arc(64, 70, 28, 0, Math.PI * 2); // Draw inner circular gradient area.
    context.fill(); // Fill inner core shape.

    return Texture.from(canvas); // Convert canvas to PIXI texture and return.
  } // End createFlameTexture.
} // End PhoenixFlameBoard class.
