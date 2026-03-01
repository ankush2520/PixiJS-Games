import { Particle, Texture } from "pixi.js"; // Import PIXI particle and texture types.

export class FlameParticle {
  // Represent one animated flame particle.
  private readonly particle: Particle; // Store the PIXI particle instance.
  private readonly sizeMultiplier: number; // Store global size scaling for this particle.
  private velocityX = 0; // Track horizontal movement speed.
  private velocityY = 0; // Track vertical movement speed.
  private lifetimeSeconds = 1; // Track total lifetime duration in seconds.
  private ageSeconds = 0; // Track elapsed life time in seconds.
  private initialAlpha = 1; // Track starting opacity.
  private initialScaleX = 1; // Track starting horizontal scale.
  private initialScaleY = 1; // Track starting vertical scale.
  private wobblePhase = 0; // Track sine phase offset for side-to-side motion.
  private wobbleStrength = 0; // Track wobble amplitude.
  private wobbleFrequency = 0; // Track wobble frequency.
  private spinVelocity = 0; // Track angular velocity for slow rotation.

  constructor(texture: Texture, sizeMultiplier = 1) {
    // Initialize with source texture and optional scale multiplier.
    const safeTexture = texture ?? Texture.WHITE; // Fallback to white texture when none is provided.
    this.sizeMultiplier = sizeMultiplier; // Persist the configured size multiplier.
    this.particle = new Particle({
      // Create the renderable particle object.
      texture: safeTexture, // Apply sprite texture.
      anchorX: 0.5, // Center the particle anchor on X.
      anchorY: 0.5, // Center the particle anchor on Y.
      alpha: 0, // Start invisible until spawned.
      scaleX: 1, // Start with default X scale.
      scaleY: 1, // Start with default Y scale.
      rotation: 0, // Start without rotation.
      tint: 0xffb347, // Set initial warm fire tint.
    }); // Finish particle creation.
  } // End constructor.

  get view(): Particle {
    // Expose the underlying PIXI particle for container usage.
    return this.particle; // Return the particle reference.
  } // End view getter.

  reset(x: number, y: number): void {
    // Respawn the particle at a new position.
    this.particle.x = x; // Set spawn X coordinate.
    this.particle.y = y; // Set spawn Y coordinate.

    const baseScale = this.randomInRange(0.82, 1.35); // Pick a random base scale for variation.
    this.initialScaleX = // Compute randomized horizontal starting scale.
      baseScale * this.randomInRange(0.75, 1.15) * this.sizeMultiplier; // Apply width randomness and global multiplier.
    this.initialScaleY = // Compute randomized vertical starting scale.
      baseScale * this.randomInRange(1.05, 1.8) * this.sizeMultiplier; // Apply height randomness and global multiplier.
    this.initialAlpha = this.randomInRange(0.55, 0.9); // Randomize starting opacity.

    this.velocityY = -this.randomInRange(110, 185); // Set initial upward speed.
    this.velocityX = this.randomInRange(-8, 8); // Set small left/right drift.
    this.lifetimeSeconds = this.randomInRange(0.85, 1.4); // Randomize particle lifespan.
    this.ageSeconds = 0; // Reset age to fresh state.

    this.wobblePhase = this.randomInRange(0, Math.PI * 2); // Randomize wobble phase to avoid synchronized motion.
    this.wobbleStrength = this.randomInRange(12, 24); // Randomize wobble magnitude.
    this.wobbleFrequency = this.randomInRange(3.2, 6.1); // Randomize wobble speed.
    this.spinVelocity = this.randomInRange(-0.35, 0.35); // Randomize rotation direction and speed.

    this.particle.scaleX = this.initialScaleX; // Apply initial horizontal scale.
    this.particle.scaleY = this.initialScaleY; // Apply initial vertical scale.
    this.particle.alpha = 0; // Start transparent for fade-in.
    this.particle.rotation = this.randomInRange(-0.03, 0.03); // Set slight initial angular offset.
    this.particle.tint = 0xfff2c0; // Start with bright core tint.
  } // End reset.

  update(deltaSeconds: number): boolean {
    // Advance particle simulation and report completion.
    this.ageSeconds += deltaSeconds; // Accumulate age by frame delta.
    const progress = Math.min(1, this.ageSeconds / this.lifetimeSeconds); // Normalize life progress from 0 to 1.
    const remaining = 1 - progress; // Compute remaining lifetime ratio.
    const fadeIn = Math.min(1, progress / 0.12); // Build quick fade-in curve.
    const fadeOut = Math.pow(remaining, 0.8); // Build smooth fade-out curve.

    this.velocityY -= 60 * deltaSeconds; // Accelerate upward over time.
    const wobble = // Compute horizontal wobble displacement.
      Math.sin(this.ageSeconds * this.wobbleFrequency + this.wobblePhase) * // Use sinusoidal motion based on age and randomized frequency.
      this.wobbleStrength * // Scale wobble by amplitude.
      remaining; // Reduce wobble as particle expires.

    this.particle.x += (this.velocityX + wobble) * deltaSeconds; // Move particle horizontally.
    this.particle.y += this.velocityY * deltaSeconds; // Move particle vertically.
    this.particle.alpha = this.initialAlpha * fadeIn * fadeOut; // Apply opacity envelope.

    const widthGrowth = 0.82 + 0.5 * progress; // Widen flame as it rises.
    const heightDecay = 1.05 - 0.42 * progress; // Shrink flame height as it ages.
    this.particle.scaleX = this.initialScaleX * widthGrowth; // Apply dynamic horizontal scale.
    this.particle.scaleY = this.initialScaleY * Math.max(0.5, heightDecay); // Apply dynamic vertical scale with floor.

    this.particle.rotation += this.spinVelocity * deltaSeconds; // Rotate particle over time.
    this.particle.tint = this.getFlameTint(progress); // Update tint based on lifetime progress.

    return this.ageSeconds >= this.lifetimeSeconds; // Signal if particle lifetime ended.
  } // End update.

  deactivate(): void {
    // Hide particle when returned to pool.
    this.particle.alpha = 0; // Make particle fully transparent.
  } // End deactivate.

  private randomInRange(min: number, max: number): number {
    // Generate random value in inclusive-exclusive range.
    return min + Math.random() * (max - min); // Return randomized value.
  } // End random helper.

  private getFlameTint(progress: number): number {
    // Map life progress to fire color gradient.
    if (progress < 0.2) {
      // Handle early hot-core phase.
      return this.lerpColor(0xfff8df, 0xffc66d, progress / 0.2); // Interpolate from pale yellow to warm orange.
    } // End early phase.

    if (progress < 0.62) {
      // Handle mid flame phase.
      return this.lerpColor(0xffc66d, 0xff7b1f, (progress - 0.2) / 0.42); // Interpolate from orange to red-orange.
    } // End mid phase.

    return this.lerpColor(0xff7b1f, 0x4a0506, (progress - 0.62) / 0.38); // Fade late phase to deep ember red.
  } // End tint mapping.

  private lerpColor(from: number, to: number, t: number): number {
    // Interpolate between two RGB hex colors.
    const factor = Math.max(0, Math.min(1, t)); // Clamp interpolation factor to valid range.
    const fromR = (from >> 16) & 0xff; // Extract source red channel.
    const fromG = (from >> 8) & 0xff; // Extract source green channel.
    const fromB = from & 0xff; // Extract source blue channel.
    const toR = (to >> 16) & 0xff; // Extract target red channel.
    const toG = (to >> 8) & 0xff; // Extract target green channel.
    const toB = to & 0xff; // Extract target blue channel.

    const r = Math.round(fromR + (toR - fromR) * factor); // Interpolate red channel.
    const g = Math.round(fromG + (toG - fromG) * factor); // Interpolate green channel.
    const b = Math.round(fromB + (toB - fromB) * factor); // Interpolate blue channel.

    return (r << 16) | (g << 8) | b; // Repack channels into hex color number.
  } // End color interpolation helper.
} // End FlameParticle class.
