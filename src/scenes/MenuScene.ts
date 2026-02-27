import { BaseScene } from "../core/BaseScene";
import { Container, Graphics, Text, TextStyle } from "pixi.js";

export class MenuScene extends BaseScene {
  private readonly btnStyle = new TextStyle({ fill: "#ffffff", fontSize: 28 });
  private readonly menuText = new Text({
    text: "Menu Scene",
    style: new TextStyle({
      fontFamily: "Arial",
      fontSize: 48,
      fill: 0xffffff,
    }),
  });
  private readonly aceBtn = new Text({
    text: "Ace of Shadows",
    style: this.btnStyle,
  });
  private readonly magicWordsBtn = new Text({
    text: "Magic Words",
    style: this.btnStyle,
  });
  private readonly phoenixFlameBtn = new Text({
    text: "Phoenix Flame",
    style: this.btnStyle,
  });
  private readonly aceButtonBg = new Graphics();
  private readonly magicWordsButtonBg = new Graphics();
  private readonly phoenixFlameButtonBg = new Graphics();
  private readonly aceButton = new Container();
  private readonly magicWordsButton = new Container();
  private readonly phoenixFlameButton = new Container();

  constructor(
    private readonly onAceSelected: () => void,
    private readonly onMagicWordsSelected: () => void,
    private readonly onPhoenixFlameSelected: () => void,
  ) {
    super();
  }

  onEnter(): void {
    this.createMenuText();
    this.createAceButton();
    this.createMagicWordsButton();
    this.createPhoenixFlameButton();
  }

  resize(width: number, height: number): void {
    this.menuText.position.set(width / 2, 60);
    this.aceButton.position.set(width / 2, height / 2 - 90);
    this.magicWordsButton.position.set(width / 2, height / 2);
    this.phoenixFlameButton.position.set(width / 2, height / 2 + 90);
  }

  createMenuText(): void {
    this.menuText.anchor.set(0.5);
    if (!this.menuText.parent) {
      this.addChild(this.menuText);
    }
  }

  createAceButton(): void {
    this.setupTaskButton(
      this.aceButton,
      this.aceButtonBg,
      this.aceBtn,
      0x1d4ed8,
      this.onAceButtonTap,
    );
  }

  createMagicWordsButton(): void {
    this.setupTaskButton(
      this.magicWordsButton,
      this.magicWordsButtonBg,
      this.magicWordsBtn,
      0x0f766e,
      this.onMagicWordsButtonTap,
    );
  }

  createPhoenixFlameButton(): void {
    this.setupTaskButton(
      this.phoenixFlameButton,
      this.phoenixFlameButtonBg,
      this.phoenixFlameBtn,
      0xb45309,
      this.onPhoenixFlameButtonTap,
    );
  }

  private setupTaskButton(
    button: Container,
    buttonBg: Graphics,
    label: Text,
    fillColor: number,
    onTap: () => void,
  ): void {
    buttonBg.clear();
    buttonBg
      .roundRect(-160, -32, 320, 64, 12)
      .fill({ color: fillColor })
      .stroke({ color: 0xffffff, width: 2 });

    label.anchor.set(0.5);

    button.eventMode = "static";
    button.cursor = "pointer";
    button.off("pointertap", onTap, this);
    button.on("pointertap", onTap, this);

    if (!button.children.length) {
      button.addChild(buttonBg, label);
    }
    if (!button.parent) {
      this.addChild(button);
    }
  }

  private onAceButtonTap(): void {
    this.onAceSelected();
  }

  private onMagicWordsButtonTap(): void {
    this.onMagicWordsSelected();
  }

  private onPhoenixFlameButtonTap(): void {
    this.onPhoenixFlameSelected();
  }
}
