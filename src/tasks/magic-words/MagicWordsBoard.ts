import {
  Container,
  FederatedPointerEvent,
  FederatedWheelEvent,
  Graphics,
} from "pixi.js";
import { RichTextRenderer } from "./RichTextRenderer";

const MAGIC_WORDS_API_URL =
  "https://private-624120-softgamesassignment.apiary-mock.com/v2/magicwords";

export class MagicWordsBoard extends Container {
  private readonly viewportContainer: Container;
  private readonly viewportBackground: Graphics;
  private readonly viewportMask: Graphics;
  private readonly messagesContainer: Container;
  private readonly scrollbarTrack: Graphics;
  private readonly scrollbarThumb: Graphics;
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
  private scrollY = 0;
  private minScrollY = 0;
  private isDragging = false;
  private dragStartY = 0;
  private dragStartScrollY = 0;
  private dialogueRenderVersion = 0;
  private readonly viewportPadding = 12;
  private readonly scrollbarWidth = 6;
  private readonly scrollbarGap = 8;

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

    this.setupScrolling();
    this.drawViewport();
    this.applyScrollPosition();
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

    for (const item of this.emojies) {
      this.emojiUrlByName.set(item.name, item.url);
    }

    for (const item of this.avatars) {
      this.avatarByName.set(item.name, {
        url: item.url,
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
    const scrollbarReserve = this.scrollbarWidth + this.scrollbarGap;
    const maxMessageWidth = Math.max(
      120,
      this.viewportWidth -
        viewportPadding * 2 -
        bubblePaddingX * 2 -
        scrollbarReserve,
    );

    let nextY = 0;

    for (let index = 0; index < this.dialogue.length; index++) {
      const item = this.dialogue[index];
      const messageContainer = new Container();
      const renderer = new RichTextRenderer(
        item.text ?? "",
        Math.min(500, maxMessageWidth),
        this.emojiUrlByName,
      );
      await renderer.render();
      if (currentRenderVersion !== this.dialogueRenderVersion) {
        return;
      }

      const bubble = new Graphics();
      const bubbleWidth = Math.min(
        Math.min(500, maxMessageWidth) + bubblePaddingX * 2,
        Math.max(100, renderer.width + bubblePaddingX * 2),
      );
      const bubbleHeight = Math.max(36, renderer.height + bubblePaddingY * 2);
      const bubbleColor = index % 2 === 0 ? 0x0a2b45 : 0x134264;

      bubble.roundRect(0, 0, bubbleWidth, bubbleHeight, 14);
      bubble.fill({ color: bubbleColor, alpha: 0.9 });
      bubble.stroke({ width: 1, color: 0xffffff, alpha: 0.15 });

      renderer.position.set(bubblePaddingX, bubblePaddingY);
      messageContainer.addChild(bubble);
      messageContainer.addChild(renderer);
      messageContainer.y = nextY;

      nextY += bubbleHeight + messageGap;

      this.messagesContainer.addChild(messageContainer);
    }

    this.contentHeight = Math.max(0, nextY - messageGap);
    this.updateScrollBounds();
    this.applyScrollPosition();
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
    this.updateScrollBounds();
    this.applyScrollPosition();

    if (sizeChanged && this.dialogue.length > 0) {
      void this.renderDialogue();
    }
  }

  private setupScrolling(): void {
    this.viewportContainer.eventMode = "static";
    this.viewportContainer.cursor = "grab";

    this.viewportContainer.on("pointerdown", this.onPointerDown, this);
    this.viewportContainer.on("pointermove", this.onPointerMove, this);
    this.viewportContainer.on("pointerup", this.onPointerUp, this);
    this.viewportContainer.on("pointerupoutside", this.onPointerUp, this);
    this.viewportContainer.on("pointercancel", this.onPointerUp, this);
    this.viewportContainer.on("wheel", this.onWheel, this);
  }

  private onPointerDown(event: FederatedPointerEvent): void {
    if (this.minScrollY === 0) {
      return;
    }

    this.isDragging = true;
    this.dragStartY = event.global.y;
    this.dragStartScrollY = this.scrollY;
    this.viewportContainer.cursor = "grabbing";
  }

  private onPointerMove(event: FederatedPointerEvent): void {
    if (!this.isDragging) {
      return;
    }

    const deltaY = event.global.y - this.dragStartY;
    this.setScroll(this.dragStartScrollY + deltaY);
  }

  private onPointerUp(): void {
    this.isDragging = false;
    this.viewportContainer.cursor = this.minScrollY < 0 ? "grab" : "default";
  }

  private onWheel(event: FederatedWheelEvent): void {
    if (this.minScrollY === 0) {
      return;
    }

    const DOM_DELTA_LINE = 1;
    const DOM_DELTA_PAGE = 2;
    let delta = event.deltaY;
    if (event.deltaMode === DOM_DELTA_LINE) {
      delta *= 16;
    } else if (event.deltaMode === DOM_DELTA_PAGE) {
      delta *= this.viewportHeight * 0.9;
    }

    this.setScroll(this.scrollY - delta);
    event.preventDefault();
    event.stopPropagation();
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

    this.updateScrollbar();
  }

  private updateScrollBounds(): void {
    const visibleHeight = this.viewportHeight - this.viewportPadding * 2;
    this.minScrollY = Math.min(0, visibleHeight - this.contentHeight);
    this.setScroll(this.scrollY);
    if (!this.isDragging) {
      this.viewportContainer.cursor = this.minScrollY < 0 ? "grab" : "default";
    }
  }

  private setScroll(nextScrollY: number): void {
    const clampedScrollY = Math.max(this.minScrollY, Math.min(0, nextScrollY));
    this.scrollY = clampedScrollY;
    this.applyScrollPosition();
    this.updateScrollbar();
  }

  private applyScrollPosition(): void {
    this.messagesContainer.position.set(
      -this.viewportWidth / 2 + this.viewportPadding,
      -this.viewportHeight / 2 + this.viewportPadding + this.scrollY,
    );
  }

  private updateScrollbar(): void {
    const trackX =
      this.viewportWidth / 2 - this.viewportPadding - this.scrollbarWidth;
    const trackY = -this.viewportHeight / 2 + this.viewportPadding;
    const trackHeight = this.viewportHeight - this.viewportPadding * 2;

    this.scrollbarTrack.clear();
    this.scrollbarTrack.roundRect(
      trackX,
      trackY,
      this.scrollbarWidth,
      trackHeight,
      this.scrollbarWidth / 2,
    );
    this.scrollbarTrack.fill({ color: 0xffffff, alpha: 0.15 });

    this.scrollbarThumb.clear();
    if (this.minScrollY === 0 || this.contentHeight <= 0) {
      return;
    }

    const visibleHeight = this.viewportHeight - this.viewportPadding * 2;
    const contentScrollableHeight = this.contentHeight - visibleHeight;
    if (contentScrollableHeight <= 0) {
      return;
    }

    const minThumbHeight = 34;
    const thumbHeight = Math.max(
      minThumbHeight,
      trackHeight * (visibleHeight / this.contentHeight),
    );
    const thumbTravel = Math.max(0, trackHeight - thumbHeight);
    const scrollProgress = Math.max(
      0,
      Math.min(1, -this.scrollY / contentScrollableHeight),
    );
    const thumbY = trackY + thumbTravel * scrollProgress;

    this.scrollbarThumb.roundRect(
      trackX,
      thumbY,
      this.scrollbarWidth,
      thumbHeight,
      this.scrollbarWidth / 2,
    );
    this.scrollbarThumb.fill({ color: 0xffffff, alpha: 0.7 });
  }
}
