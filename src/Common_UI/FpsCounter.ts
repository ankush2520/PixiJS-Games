import { Application, Container, Text, TextStyle } from "pixi.js";

export class FpsCounter extends Container {
  private readonly app: Application;
  public readonly fpsText: Text;

  constructor(app: Application) {
    super();
    this.app = app;

    const style = new TextStyle({
      fontFamily: "monospace",
      fontSize: 24,
      fill: 0xffffff,
      stroke: { color: 0x008000, width: 3 },
    });

    this.fpsText = new Text({ text: "FPS: 0", style });
    this.fpsText.anchor.set(1, 0);
    this.addChild(this.fpsText);

    this.resize();
    this.app.stage.addChild(this);

    this.app.ticker.add((ticker) => {
      this.update(ticker.deltaMS);
    });
  }

  resize(): void {
    const isMobile = this.app.screen.width < 600;
    const fontSize = isMobile ? 16 : 24;

    if (this.fpsText.style.fontSize !== fontSize) {
      this.fpsText.style.fontSize = fontSize;
    }

    this.position.set(this.app.screen.width - 8, 8);
  }

  update(deltaMS: number): void {
    const fps = Math.round(1000 / Math.max(deltaMS, 0.0001));
    this.fpsText.text = `FPS: ${fps}`;
  }
}
