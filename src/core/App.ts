import { Application } from "pixi.js";
import { SceneManager } from "./SceneManager";
import { MenuScene } from "../scenes/MenuScene";
import { FpsCounter } from "../ui/FpsCounter";
import { AceOfShadowsScene } from "../scenes/AceOfShadowsScene";
import { MagicWordsScene } from "../scenes/MagicWordsScene";
import { PhoenixFlameScene } from "../scenes/PhoenixFlameScene";

export class App {
  private readonly app: Application;
  private sceneManager: SceneManager | null = null;

  constructor() {
    this.app = new Application();
  }

  async start(): Promise<void> {
    await this.app.init({
      resizeTo: window,
      antialias: true,
      background: "#1099bb",
    });

    const sceneManager = new SceneManager(this.app);
    this.sceneManager = sceneManager;

    const view = this.app.canvas;
    view.style.width = "100%";
    view.style.height = "100%";
    view.style.display = "block";
    view.style.position = "fixed";
    view.style.top = "0";
    view.style.left = "0";

    document.body.style.margin = "0";
    document.body.appendChild(view);

    window.addEventListener("resize", () => {
      this.sceneManager?.resize(
        this.app.renderer.width,
        this.app.renderer.height,
      );
    });

    sceneManager.show(
      new MenuScene(
        () => {
          sceneManager.show(new AceOfShadowsScene());
          sceneManager.resize(
            this.app.renderer.width,
            this.app.renderer.height,
          );
        },
        () => {
          sceneManager.show(new MagicWordsScene());
          sceneManager.resize(
            this.app.renderer.width,
            this.app.renderer.height,
          );
        },
        () => {
          sceneManager.show(new PhoenixFlameScene());
          sceneManager.resize(
            this.app.renderer.width,
            this.app.renderer.height,
          );
        },
      ),
    );
    sceneManager.resize(this.app.renderer.width, this.app.renderer.height);

    // Add global FPS counter last so it renders on top
    new FpsCounter(this.app);
  }
}
