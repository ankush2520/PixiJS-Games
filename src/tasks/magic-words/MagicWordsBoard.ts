import { Container, Graphics, Sprite, Text, Texture } from "pixi.js";
import { RichTextRenderer } from "./RichTextRenderer";
import { Scrollinghandler } from "./Scrollinghandler";

const MAGIC_WORDS_API_URL =
  "https://private-624120-softgamesassignment.apiary-mock.com/v2/magicwords";

export class MagicWordsBoard extends Container {
  private readonly viewportContainer: Container;
  private readonly viewportBackground: Graphics;
  private readonly viewportMask: Graphics;
  private readonly messagesContainer: Container;
  private readonly scrollbarTrack: Graphics;
  private readonly scrollbarThumb: Graphics;
  private readonly scrollinghandler: Scrollinghandler;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private dialogue: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private emojies: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private avatars: any[] = [];
  private emojiUrlByName = new Map<string, string>();
  private avatarByName = new Map<
    string,
    { url: string; position: "left" | "right" }
  >();
  private viewportWidth = 500;
  private viewportHeight = 400;
  private contentHeight = 0;
  private dialogueRenderVersion = 0;
  private readonly viewportPadding = 12;
  private readonly scrollbarWidth = 6;
  private readonly scrollbarGap = 8;
  private readonly avatarTextureCache = new Map<
    string,
    Promise<Texture | null>
  >();
  private readonly senderNameStyle = {
    fill: 0xe2e8f0,
    fontFamily: "Arial",
    fontSize: 14,
    fontWeight: "600" as const,
  };
  private readonly fallbackAvatarLabelStyle = {
    fill: 0xffffff,
    fontFamily: "Arial",
    fontSize: 16,
    fontWeight: "700" as const,
  };

  constructor() {
    super();
    this.viewportContainer = new Container();
    this.viewportBackground = new Graphics();
    this.viewportMask = new Graphics();
    this.messagesContainer = new Container();
    this.scrollbarTrack = new Graphics();
    this.scrollbarThumb = new Graphics();

    this.viewportContainer.addChild(this.viewportBackground);
    this.viewportContainer.addChild(this.messagesContainer);
    this.viewportContainer.addChild(this.viewportMask);
    this.viewportContainer.addChild(this.scrollbarTrack);
    this.viewportContainer.addChild(this.scrollbarThumb);
    this.messagesContainer.mask = this.viewportMask;
    this.addChild(this.viewportContainer);

    this.scrollinghandler = new Scrollinghandler(
      this.viewportContainer,
      this.messagesContainer,
      this.scrollbarTrack,
      this.scrollbarThumb,
      {
        viewportPadding: this.viewportPadding,
        scrollbarWidth: this.scrollbarWidth,
      },
    );
    this.drawViewport();
    this.scrollinghandler.setViewportSize(
      this.viewportWidth,
      this.viewportHeight,
    );
    this.scrollinghandler.setContentHeight(this.contentHeight);
  }

  async init(): Promise<void> {
    await this.loadData();
    await this.renderDialogue();
  }

  async loadData(): Promise<void> {
    const response = await fetch(MAGIC_WORDS_API_URL);
    const data = await response.json();

    this.dialogue = data.dialogue;
    this.emojies = data.emojies;
    this.avatars = data.avatars;

    this.emojiUrlByName.clear();
    this.avatarByName.clear();

    for (const item of this.emojies) {
      this.emojiUrlByName.set(
        String(item.name).trim().toLowerCase(),
        String(item.url),
      );
    }

    for (const item of this.avatars) {
      this.avatarByName.set(String(item.name), {
        url: String(item.url).replace(
          "https://api.dicebear.com:81/",
          "https://api.dicebear.com/",
        ),
        position: item.position,
      });
    }

    console.log(
      "lookup sizes:",
      this.emojiUrlByName.size,
      this.avatarByName.size,
    );
    console.log(this.dialogue);
  }

  async renderDialogue(): Promise<void> {
    this.dialogueRenderVersion++;
    const currentRenderVersion = this.dialogueRenderVersion;
    this.messagesContainer.removeChildren();
    this.contentHeight = 0;

    const viewportPadding = 12;
    const bubblePaddingX = 12;
    const bubblePaddingY = 8;
    const messageGap = 12;
    const avatarSize = 42;
    const avatarGap = 10;
    const senderNameGap = 4;
    const scrollbarReserve = this.scrollbarWidth + this.scrollbarGap;
    const contentWidth = Math.max(
      180,
      this.viewportWidth - viewportPadding * 2 - scrollbarReserve,
    );
    const maxTextWidth = Math.max(
      120,
      contentWidth - avatarSize - avatarGap - bubblePaddingX * 2,
    );

    let nextY = 0;

    for (let index = 0; index < this.dialogue.length; index++) {
      const item = this.dialogue[index] as { name?: string; text?: string };
      const speakerName = item.name ?? "Unknown";
      const messageText = item.text ?? "";
      const avatarData = this.avatarByName.get(speakerName);
      const isLeft = avatarData
        ? avatarData.position === "left"
        : speakerName === "Sheldon";
      const rowContainer = new Container();
      const senderNameLabel = new Text({
        text: speakerName,
        style: this.senderNameStyle,
      });
      const avatarNode = await this.createAvatarNode(
        speakerName,
        avatarData?.url,
        avatarSize,
      );
      if (currentRenderVersion !== this.dialogueRenderVersion) {
        return;
      }

      const renderer = new RichTextRenderer(
        messageText,
        Math.min(500, maxTextWidth),
        this.emojiUrlByName,
      );
      await renderer.render();
      if (currentRenderVersion !== this.dialogueRenderVersion) {
        return;
      }

      const bubble = new Graphics();
      const bubbleWidth = Math.min(
        Math.min(500, maxTextWidth) + bubblePaddingX * 2,
        Math.max(100, renderer.width + bubblePaddingX * 2),
      );
      const bubbleHeight = Math.max(36, renderer.height + bubblePaddingY * 2);
      const bubbleColor = isLeft ? 0x0a2b45 : 0x174267;
      const nameBlockHeight = senderNameLabel.height + senderNameGap;
      const contentX = isLeft
        ? avatarSize + avatarGap
        : contentWidth - avatarSize - avatarGap - bubbleWidth;
      const avatarX = isLeft ? 0 : contentWidth - avatarSize;

      bubble.roundRect(0, 0, bubbleWidth, bubbleHeight, 14);
      bubble.fill({ color: bubbleColor, alpha: 0.9 });
      bubble.stroke({ width: 1, color: 0xffffff, alpha: 0.15 });

      renderer.position.set(bubblePaddingX, bubblePaddingY);
      senderNameLabel.position.set(contentX, 0);
      avatarNode.position.set(avatarX, 0);

      const messageContainer = new Container();
      messageContainer.position.set(contentX, nameBlockHeight);
      messageContainer.addChild(bubble);
      messageContainer.addChild(renderer);

      rowContainer.addChild(avatarNode);
      rowContainer.addChild(senderNameLabel);
      rowContainer.addChild(messageContainer);
      rowContainer.y = nextY;
      this.messagesContainer.addChild(rowContainer);

      const rowHeight = Math.max(avatarSize, nameBlockHeight + bubbleHeight);
      nextY += rowHeight + messageGap;
    }

    this.contentHeight = Math.max(0, nextY - messageGap);
    this.scrollinghandler.setContentHeight(this.contentHeight);
  }

  private getTextureFromUrl(url: string): Texture | null {
    try {
      return Texture.from(url);
    } catch {
      return null;
    }
  }

  private getAvatarTexture(url: string): Promise<Texture | null> {
    const cachedTexture = this.avatarTextureCache.get(url);
    if (cachedTexture) {
      return cachedTexture;
    }

    const texturePromise = Promise.resolve(this.getTextureFromUrl(url));
    this.avatarTextureCache.set(url, texturePromise);
    return texturePromise;
  }

  private async createAvatarNode(
    speakerName: string,
    avatarUrl: string | undefined,
    avatarSize: number,
  ): Promise<Container> {
    const avatarContainer = new Container();
    const frame = new Graphics();
    frame.circle(avatarSize / 2, avatarSize / 2, avatarSize / 2);
    frame.fill({ color: 0x0f2d44, alpha: 0.95 });
    frame.stroke({ width: 1.5, color: 0xffffff, alpha: 0.35 });
    avatarContainer.addChild(frame);

    if (avatarUrl) {
      const texture = await this.getAvatarTexture(avatarUrl);
      if (texture) {
        const avatarSprite = new Sprite(texture);
        const inset = 2;
        avatarSprite.width = avatarSize - inset * 2;
        avatarSprite.height = avatarSize - inset * 2;
        avatarSprite.position.set(inset, inset);
        avatarContainer.addChild(avatarSprite);
        return avatarContainer;
      }
    }

    const fallbackLabel = new Text({
      text: speakerName.charAt(0).toUpperCase(),
      style: this.fallbackAvatarLabelStyle,
    });
    fallbackLabel.anchor.set(0.5);
    fallbackLabel.position.set(avatarSize / 2, avatarSize / 2);
    avatarContainer.addChild(fallbackLabel);

    return avatarContainer;
  }

  resize(
    width: number,
    height: number,
    topPadding?: number,
    bottomPadding?: number,
  ): void {
    const horizontalPadding = width < 768 ? 20 : 56;
    const resolvedTopPadding = topPadding ?? (width < 768 ? 88 : 112);
    const resolvedBottomPadding = bottomPadding ?? (width < 768 ? 24 : 40);

    const nextViewportWidth = Math.min(
      720,
      Math.max(220, width - horizontalPadding * 2),
    );
    const nextViewportHeight = Math.max(
      1,
      height - resolvedTopPadding - resolvedBottomPadding,
    );
    const sizeChanged =
      nextViewportWidth !== this.viewportWidth ||
      nextViewportHeight !== this.viewportHeight;

    this.viewportWidth = nextViewportWidth;
    this.viewportHeight = nextViewportHeight;

    this.drawViewport();
    this.scrollinghandler.setViewportSize(
      this.viewportWidth,
      this.viewportHeight,
    );
    this.scrollinghandler.setContentHeight(this.contentHeight);

    if (sizeChanged && this.dialogue.length > 0) {
      void this.renderDialogue();
    }
  }

  private drawViewport(): void {
    const cornerRadius = 18;
    const x = -this.viewportWidth / 2;
    const y = -this.viewportHeight / 2;

    this.viewportBackground.clear();
    this.viewportBackground.roundRect(
      x,
      y,
      this.viewportWidth,
      this.viewportHeight,
      cornerRadius,
    );
    this.viewportBackground.fill({ color: 0x05263f, alpha: 0.4 });
    this.viewportBackground.stroke({ width: 1, color: 0xffffff, alpha: 0.18 });

    this.viewportMask.clear();
    this.viewportMask.roundRect(
      x,
      y,
      this.viewportWidth,
      this.viewportHeight,
      cornerRadius,
    );
    this.viewportMask.fill(0xffffff);
  }
}
