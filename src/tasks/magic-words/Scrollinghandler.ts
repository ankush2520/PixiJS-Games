import {
  Container,
  FederatedPointerEvent,
  FederatedWheelEvent,
  Graphics,
} from "pixi.js";

type ScrollinghandlerOptions = {
  viewportPadding: number;
  scrollbarWidth: number;
};

const DOM_DELTA_LINE = 1;
const DOM_DELTA_PAGE = 2;

export class Scrollinghandler {
  private viewportWidth = 0;
  private viewportHeight = 0;
  private contentHeight = 0;
  private scrollY = 0;
  private minScrollY = 0;
  private isDragging = false;
  private dragStartY = 0;
  private dragStartScrollY = 0;

  constructor(
    private readonly viewportContainer: Container,
    private readonly messagesContainer: Container,
    private readonly scrollbarTrack: Graphics,
    private readonly scrollbarThumb: Graphics,
    private readonly options: ScrollinghandlerOptions,
  ) {
    this.setupScrolling();
    this.applyScrollPosition();
    this.updateScrollbar();
  }

  setViewportSize(width: number, height: number): void {
    this.viewportWidth = width;
    this.viewportHeight = height;
    this.updateScrollBounds();
  }

  setContentHeight(contentHeight: number): void {
    this.contentHeight = Math.max(0, contentHeight);
    this.updateScrollBounds();
  }

  private setupScrolling(): void {
    this.viewportContainer.eventMode = "static";
    this.viewportContainer.cursor = "default";

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

  private updateScrollBounds(): void {
    const visibleHeight =
      this.viewportHeight - this.options.viewportPadding * 2;
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
      -this.viewportWidth / 2 + this.options.viewportPadding,
      -this.viewportHeight / 2 + this.options.viewportPadding + this.scrollY,
    );
  }

  private updateScrollbar(): void {
    const trackX =
      this.viewportWidth / 2 -
      this.options.viewportPadding -
      this.options.scrollbarWidth;
    const trackY = -this.viewportHeight / 2 + this.options.viewportPadding;
    const trackHeight = this.viewportHeight - this.options.viewportPadding * 2;

    this.scrollbarTrack.clear();
    this.scrollbarTrack.roundRect(
      trackX,
      trackY,
      this.options.scrollbarWidth,
      trackHeight,
      this.options.scrollbarWidth / 2,
    );
    this.scrollbarTrack.fill({ color: 0xffffff, alpha: 0.15 });

    this.scrollbarThumb.clear();
    if (this.minScrollY === 0 || this.contentHeight <= 0) {
      return;
    }

    const visibleHeight =
      this.viewportHeight - this.options.viewportPadding * 2;
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
      this.options.scrollbarWidth,
      thumbHeight,
      this.options.scrollbarWidth / 2,
    );
    this.scrollbarThumb.fill({ color: 0xffffff, alpha: 0.7 });
  }
}
