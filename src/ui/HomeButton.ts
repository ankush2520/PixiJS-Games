import { Container, Graphics, Text, TextStyle } from "pixi.js";

export class HomeButton extends Container {
  private readonly background = new Graphics();
  private readonly textLabel = new Text({
    text: "Home",
    style: new TextStyle({
      fontFamily: "Arial",
      fontSize: 22,
      fill: 0xffffff,
    }),
  });

  constructor(private readonly onTap: () => void) {
    super();

    this.draw();
    this.textLabel.anchor.set(0.5);
    this.textLabel.position.set(60, 22);

    this.eventMode = "static";
    this.cursor = "pointer";
    this.off("pointertap", this.handleTap, this);
    this.on("pointertap", this.handleTap, this);

    this.addChild(this.background, this.textLabel);
  }

  private draw(): void {
    this.background.clear();
    this.background
      .roundRect(0, 0, 120, 44, 10)
      .fill({ color: 0x334155 })
      .stroke({ color: 0xffffff, width: 2 });
  }

  private handleTap(): void {
    this.onTap();
  }
}
