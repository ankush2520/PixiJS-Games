import { Particle, Texture } from "pixi.js"; // Import PIXI particle and texture types.

export class FlameParticle {
  // Represent one animated flame particle.
  private readonly particle: Particle; // Store the PIXI particle instance.
  private readonly sizeMultiplier: number; // Store global size scaling for this particle.
  private readonly heightScale = 0.5; // Reduce visible flame height to 50%.
  private readonly riseScale = 0.5; // Reduce vertical travel height to 50%.
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
  private liftStrength = 0; // Track upward acceleration strength.
  private flickerPhase = 0; // Track flicker phase offset.
  private flickerFrequency = 0; // Track flicker speed.
  private turbulencePhase = 0; // Track fine turbulence phase offset.
  private turbulenceFrequency = 0; // Track fine turbulence frequency.
  private coreHeat = 0; // Track whether particle behaves like hot core or outer flame.
  private outwardDrift = 0; // Track outward drift to widen upper flame profile.

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
      tint: 0xffb85a, // Set initial warm fire tint.
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

    const baseScale = this.randomInRange(0.76, 1.42); // Pick a random base scale for variation.
    this.coreHeat = this.randomInRange(0, 1); // Randomize core heat profile per particle.
    const widthBias = 0.7 + (1 - this.coreHeat) * 0.46; // Keep hot-core particles narrower.
    const heightBias = 1.2 + this.coreHeat * 0.95; // Keep hot-core particles taller.
    this.initialScaleX = // Compute randomized horizontal starting scale.
      baseScale *
      this.randomInRange(0.72, 1.08) *
      widthBias *
      this.sizeMultiplier; // Apply width randomness and global multiplier.
    this.initialScaleY = // Compute randomized vertical starting scale.
      baseScale *
      this.randomInRange(1.02, 1.75) *
      heightBias *
      this.sizeMultiplier *
      this.heightScale; // Apply height randomness and global multiplier.
    this.initialAlpha = this.randomInRange(0.52, 0.86) + this.coreHeat * 0.14; // Randomize starting opacity.

    this.velocityY =
      -this.randomInRange(128 + this.coreHeat * 32, 215 + this.coreHeat * 52) *
      this.riseScale; // Set initial upward speed.
    const lateralDrift = 16 - this.coreHeat * 8; // Reduce lateral drift for hot-core streaks.
    this.velocityX = this.randomInRange(-lateralDrift, lateralDrift); // Set small left/right drift.
    this.outwardDrift =
      this.randomInRange(-18, 18) * (0.5 + (1 - this.coreHeat) * 0.5); // Set outward spread so upper flame becomes wider without turning into blobs.
    this.lifetimeSeconds =
      this.randomInRange(0.78, 1.45) - this.coreHeat * 0.12; // Randomize particle lifespan.
    this.ageSeconds = 0; // Reset age to fresh state.

    this.wobblePhase = this.randomInRange(0, Math.PI * 2); // Randomize wobble phase to avoid synchronized motion.
    this.wobbleStrength =
      this.randomInRange(12, 28) * (0.7 + (1 - this.coreHeat) * 0.45); // Randomize wobble magnitude.
    this.wobbleFrequency = this.randomInRange(3.8, 7.1); // Randomize wobble speed.
    this.spinVelocity = this.randomInRange(-0.44, 0.44); // Randomize rotation direction and speed.
    this.liftStrength =
      (this.randomInRange(58, 100) + this.coreHeat * 22) * this.riseScale; // Randomize upward acceleration.
    this.flickerPhase = this.randomInRange(0, Math.PI * 2); // Randomize flicker phase.
    this.flickerFrequency = this.randomInRange(11, 23); // Randomize flicker speed.
    this.turbulencePhase = this.randomInRange(0, Math.PI * 2); // Randomize fine turbulence phase.
    this.turbulenceFrequency = this.randomInRange(7, 13); // Randomize fine turbulence speed.

    this.particle.scaleX = this.initialScaleX; // Apply initial horizontal scale.
    this.particle.scaleY = this.initialScaleY; // Apply initial vertical scale.
    this.particle.alpha = 0; // Start transparent for fade-in.
    this.particle.rotation = this.randomInRange(-0.05, 0.05); // Set slight initial angular offset.
    this.particle.tint = 0xffffea; // Start with bright core tint.
  } // End reset.

  update(deltaSeconds: number): boolean {
    // Advance particle simulation and report completion.
    this.ageSeconds += deltaSeconds; // Accumulate age by frame delta.
    const progress = Math.min(1, this.ageSeconds / this.lifetimeSeconds); // Normalize life progress from 0 to 1.
    const remaining = 1 - progress; // Compute remaining lifetime ratio.
    const fadeIn = Math.min(1, progress / 0.08); // Build quick fade-in curve.
    const fadeOut = Math.pow(remaining, 0.86); // Build smooth fade-out curve.

    const buoyancy = this.liftStrength * (0.72 + progress * 0.58); // Increase lift as particle ages to create rising tongues.
    this.velocityY -= buoyancy * deltaSeconds; // Accelerate upward over time.
    this.velocityX *= Math.max(0, 1 - 2.8 * deltaSeconds); // Dampen lateral velocity over time.
    const wobble = // Compute horizontal wobble displacement.
      Math.sin(this.ageSeconds * this.wobbleFrequency + this.wobblePhase) * // Use sinusoidal motion based on age and randomized frequency.
      this.wobbleStrength * // Scale wobble by amplitude.
      (0.28 + progress * 0.58); // Increase wobble with height but keep flame tongues coherent.
    const turbulence = // Compute fine turbulence for sharper flame flutter.
      Math.sin(
        this.ageSeconds * this.turbulenceFrequency + this.turbulencePhase,
      ) *
      (7 + this.coreHeat * 4) *
      (0.24 + progress * 0.52); // Keep turbulence active in upper flame region.
    const spread = this.outwardDrift * (0.2 + progress * 0.72); // Push particles outward as they rise.
    const flickerAmplitude = 0.1 + (1 - this.coreHeat) * 0.07; // Give outer particles stronger flicker than inner core.
    const flicker = // Compute per-particle flicker signal.
      Math.max(
        0.68,
        0.9 +
          flickerAmplitude *
            Math.sin(
              this.ageSeconds * this.flickerFrequency + this.flickerPhase,
            ),
      ); // Clamp flicker so the flame never fully drops out.

    this.particle.x +=
      (this.velocityX + wobble + turbulence + spread) * deltaSeconds; // Move particle horizontally.
    this.particle.y += this.velocityY * deltaSeconds; // Move particle vertically.
    this.particle.alpha =
      this.initialAlpha *
      fadeIn *
      fadeOut *
      flicker *
      (0.92 + this.coreHeat * 0.12); // Apply opacity envelope.

    const widthGrowth = 0.64 + 0.72 * progress + (1 - this.coreHeat) * 0.08; // Widen upper flame while avoiding egg-like blobs.
    const heightDecay = 1.22 - 0.62 * progress + this.coreHeat * 0.06; // Keep a stronger vertical tongue profile.
    this.particle.scaleX = this.initialScaleX * widthGrowth; // Apply dynamic horizontal scale.
    this.particle.scaleY = this.initialScaleY * Math.max(0.38, heightDecay); // Apply dynamic vertical scale with floor.

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
    const hotCoreStart = this.lerpColor(0xfffff0, 0xfff4c4, 1 - this.coreHeat); // Pick hotter start tones for inner particles.
    const warmMidStart = this.lerpColor(0xfff6c2, 0xffd27a, 1 - this.coreHeat); // Pick warm yellow/orange bridge tones.
    const orangeMid = this.lerpColor(0xffd27a, 0xff8a24, 1 - this.coreHeat); // Pick body orange tones.
    const redEdge = this.lerpColor(0xff8a24, 0xc81912, 1 - this.coreHeat); // Pick red edge tones.
    const emberTail = this.lerpColor(0x4b0506, 0x1e0102, this.coreHeat * 0.6); // Pick dark ember tail tones.

    if (progress < 0.16) {
      // Handle early hot-core phase.
      return this.lerpColor(hotCoreStart, warmMidStart, progress / 0.16); // Interpolate from pale yellow to warm orange.
    } // End early phase.

    if (progress < 0.52) {
      // Handle mid flame phase.
      return this.lerpColor(warmMidStart, orangeMid, (progress - 0.16) / 0.36); // Interpolate from orange-yellow to deep orange.
    } // End mid phase.

    if (progress < 0.82) {
      // Handle red outer shell phase.
      return this.lerpColor(orangeMid, redEdge, (progress - 0.52) / 0.3); // Interpolate from orange to red edge.
    } // End red shell phase.

    return this.lerpColor(redEdge, emberTail, (progress - 0.82) / 0.18); // Fade late phase to deep ember red.
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
