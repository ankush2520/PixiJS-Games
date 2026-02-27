import { Container, Graphics } from "pixi.js";

export class HomeButton extends Container {
  private readonly background = new Graphics();

  constructor(private readonly onTap: () => void) {
    super();

    this.draw();

    this.eventMode = "static";
    this.cursor = "pointer";
    this.off("pointertap", this.handleTap, this);
    this.on("pointertap", this.handleTap, this);

    this.addChild(this.background);
  }

  private draw(): void {
    this.background.clear();

    // Background
    this.background.roundRect(0, 0, 45, 45, 8);
    this.background.fill({ color: 0x334155 });
    this.background.stroke({ color: 0xffffff, width: 2 });

    // Draw home icon (house) - roof triangle
    this.background.poly([
      22.5,
      12, // Top point
      14,
      20, // Bottom left
      31,
      20, // Bottom right
      22.5,
      12, // Back to top
    ]);
    this.background.fill({ color: 0xffffff });

    // House body (rectangle)
    this.background.rect(16, 20, 13, 11);
    this.background.fill({ color: 0xffffff });

    // Door (small rectangle)
    this.background.rect(20, 25, 5, 6);
    this.background.fill({ color: 0x334155 });
  }

  private handleTap(): void {
    this.onTap();
  }
}
