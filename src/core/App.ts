import { Application } from "pixi.js";
import { SceneManager } from "./SceneManager";
import { MenuScene } from "../scenes/MenuScene";
import { FpsCounter } from "../Common_UI/FpsCounter";
import { AceOfShadowsScene } from "../scenes/AceOfShadowsScene";
import { MagicWordsScene } from "../scenes/MagicWordsScene";
import { PhoenixFlameScene } from "../scenes/PhoenixFlameScene";

export class App {
  private readonly app: Application;
  private sceneManager: SceneManager | null = null;
  private fpsCounter: FpsCounter | null = null;

  constructor() {
    this.app = new Application();
  }

  async start(): Promise<void> {
    await this.app.init({
      resizeTo: window,
      antialias: true,
      background: "#1099bb",
    });
    this.app.renderer.events.features.wheel = true;

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
      this.fpsCounter?.resize();
    });

    const resizeCurrentScene = (): void => {
      sceneManager.resize(this.app.renderer.width, this.app.renderer.height);
    };

    const showAceOfShadows = (): void => {
      sceneManager.show(new AceOfShadowsScene(showMenu));
      resizeCurrentScene();
    };

    const showMagicWords = (): void => {
      sceneManager.show(new MagicWordsScene(showMenu));
      resizeCurrentScene();
    };

    const showPhoenixFlame = (): void => {
      sceneManager.show(new PhoenixFlameScene(showMenu));
      resizeCurrentScene();
    };

    const showMenu = (): void => {
      sceneManager.show(
        new MenuScene(showAceOfShadows, showMagicWords, showPhoenixFlame),
      );
      resizeCurrentScene();
    };

    showMenu();

    // Add global FPS counter last so it renders on top
    this.fpsCounter = new FpsCounter(this.app);
  }
}
