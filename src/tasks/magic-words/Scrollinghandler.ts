import {
  Container,
  FederatedPointerEvent,
  FederatedWheelEvent,
  Graphics,
} from "pixi.js";

/**
 * Configuration options for ScrollingHandler
 */
type ScrollinghandlerOptions = {
  /** Padding around viewport edges in pixels */
  viewportPadding: number;
  /** Width of the scrollbar in pixels */
  scrollbarWidth: number;
};

/** DOM wheel event delta mode constants (from WheelEvent.DOM_DELTA_*) */
const DOM_DELTA_LINE = 1; // Delta in line units (multiply by ~16px)
const DOM_DELTA_PAGE = 2; // Delta in page units (multiply by viewport height)

/**
 * Custom Scrolling Handler with Touch/Mouse Support
 *
 * Provides smooth scrolling functionality for a content container within a viewport.
 * Features:
 * - Mouse wheel scrolling with delta mode support (pixel, line, page)
 * - Touch/mouse drag scrolling with grabbing cursor feedback
 * - Custom rendered scrollbar (track + thumb) with proportional sizing
 * - Automatic scroll bounds clamping based on content height
 * - Responsive scrollbar visibility (hidden when content fits viewport)
 *
 * Architecture:
 * - viewportContainer: Container that captures input events
 * - messagesContainer: Container holding the scrollable content
 * - scrollbarTrack: Visual track background
 * - scrollbarThumb: Visual draggable indicator (proportional to visible ratio)
 *
 * Coordinate System:
 * - scrollY = 0: Content positioned at top
 * - scrollY < 0: Content scrolled up (positive scroll offset)
 * - minScrollY: Maximum negative scrollY when content is scrolled to bottom
 */
export class Scrollinghandler {
  /** Current viewport width in pixels */
  private viewportWidth = 0;

  /** Current viewport height in pixels */
  private viewportHeight = 0;

  /** Total height of scrollable content in pixels */
  private contentHeight = 0;

  /** Current scroll position (0 = top, negative = scrolled down) */
  private scrollY = 0;

  /** Minimum allowed scrollY (maximum scroll down position) */
  private minScrollY = 0;

  /** Flag indicating active drag operation */
  private isDragging = false;

  /** Y position where drag started (global coordinates) */
  private dragStartY = 0;

  /** scrollY value when drag started */
  private dragStartScrollY = 0;

  /**
   * Constructs a new ScrollingHandler
   *
   * @param viewportContainer - Container that receives scroll events (viewport bounds)
   * @param messagesContainer - Container holding scrollable content
   * @param scrollbarTrack - Graphics object for scrollbar background
   * @param scrollbarThumb - Graphics object for scrollbar handle
   * @param options - Configuration (padding, scrollbar width)
   */
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

  /**
   * Updates the viewport dimensions
   * Called when window resizes or layout changes
   *
   * @param width - New viewport width in pixels
   * @param height - New viewport height in pixels
   */
  setViewportSize(width: number, height: number): void {
    this.viewportWidth = width;
    this.viewportHeight = height;
    this.updateScrollBounds();
  }

  /**
   * Updates the total scrollable content height
   * Called when content is added/removed or resized
   *
   * @param contentHeight - New content height in pixels
   */
  setContentHeight(contentHeight: number): void {
    this.contentHeight = Math.max(0, contentHeight);
    this.updateScrollBounds();
  }

  /**
   * Registers all event listeners for scrolling interactions
   * Handles mouse, touch, and wheel events on the viewport
   */
  private setupScrolling(): void {
    this.viewportContainer.eventMode = "static"; // Enable event handling
    this.viewportContainer.cursor = "default";

    // Drag scrolling events
    this.viewportContainer.on("pointerdown", this.onPointerDown, this);
    this.viewportContainer.on("pointermove", this.onPointerMove, this);
    this.viewportContainer.on("pointerup", this.onPointerUp, this);
    this.viewportContainer.on("pointerupoutside", this.onPointerUp, this); // Handle drag ending outside viewport
    this.viewportContainer.on("pointercancel", this.onPointerUp, this); // Handle interrupted drag

    // Mouse wheel scrolling
    this.viewportContainer.on("wheel", this.onWheel, this);
  }

  /**
   * Handles pointer down event (mouse/touch press)
   * Initiates drag scrolling if content is scrollable
   */
  private onPointerDown(event: FederatedPointerEvent): void {
    // Only enable dragging if content exceeds viewport height
    if (this.minScrollY === 0) {
      return;
    }

    this.isDragging = true;
    this.dragStartY = event.global.y; // Store initial pointer Y position
    this.dragStartScrollY = this.scrollY; // Store initial scroll position
    this.viewportContainer.cursor = "grabbing"; // Visual feedback for active drag
  }

  /**
   * Handles pointer move event during drag
   * Updates scroll position based on pointer delta
   */
  private onPointerMove(event: FederatedPointerEvent): void {
    if (!this.isDragging) {
      return;
    }

    // Calculate how far pointer has moved since drag started
    const deltaY = event.global.y - this.dragStartY;
    // Apply delta to initial scroll position (direct 1:1 mapping)
    this.setScroll(this.dragStartScrollY + deltaY);
  }

  /**
   * Handles pointer up event (mouse/touch release)
   * Ends drag operation and resets cursor
   */
  private onPointerUp(): void {
    this.isDragging = false;
    // Show grab cursor if scrollable, default cursor if not
    this.viewportContainer.cursor = this.minScrollY < 0 ? "grab" : "default";
  }

  /**
   * Handles mouse wheel scroll event
   * Supports different delta modes (pixel, line, page)
   */
  private onWheel(event: FederatedWheelEvent): void {
    // Only handle wheel if content is scrollable
    if (this.minScrollY === 0) {
      return;
    }

    let delta = event.deltaY;

    // Normalize delta based on browser's delta mode
    if (event.deltaMode === DOM_DELTA_LINE) {
      // Line mode: multiply by approximate line height (16px)
      delta *= 16;
    } else if (event.deltaMode === DOM_DELTA_PAGE) {
      // Page mode: multiply by 90% of viewport height
      delta *= this.viewportHeight * 0.9;
    }
    // Pixel mode (default): use delta as-is

    // Apply scroll (negative because wheel down = positive deltaY = scroll content up)
    this.setScroll(this.scrollY - delta);

    // Prevent default browser scrolling
    event.preventDefault();
    event.stopPropagation();
  }

  /**
   * Recalculates scroll bounds based on current viewport and content dimensions
   * Called whenever viewport size or content height changes
   */
  private updateScrollBounds(): void {
    // Calculate visible area after accounting for padding
    const visibleHeight =
      this.viewportHeight - this.options.viewportPadding * 2;

    // Calculate minimum scrollY (how far content can scroll down)
    // If content fits: minScrollY = 0 (no scrolling needed)
    // If content overflows: minScrollY = negative value (scroll distance available)
    this.minScrollY = Math.min(0, visibleHeight - this.contentHeight);

    // Re-clamp current scroll position to new bounds
    this.setScroll(this.scrollY);

    // Update cursor to reflect scrollability
    if (!this.isDragging) {
      this.viewportContainer.cursor = this.minScrollY < 0 ? "grab" : "default";
    }
  }

  /**
   * Sets scroll position with clamping to valid bounds
   *
   * @param nextScrollY - Desired scroll position
   */
  private setScroll(nextScrollY: number): void {
    // Clamp to valid range: [minScrollY, 0]
    const clampedScrollY = Math.max(this.minScrollY, Math.min(0, nextScrollY));
    this.scrollY = clampedScrollY;
    this.applyScrollPosition(); // Update content position
    this.updateScrollbar(); // Update scrollbar thumb position
  }

  /**
   * Applies current scroll position to content container
   * Positions content relative to viewport center with padding offset
   */
  private applyScrollPosition(): void {
    this.messagesContainer.position.set(
      // X: Align to left edge with padding (assuming viewport centered at 0,0)
      -this.viewportWidth / 2 + this.options.viewportPadding,
      // Y: Align to top edge with padding, offset by scrollY
      -this.viewportHeight / 2 + this.options.viewportPadding + this.scrollY,
    );
  }

  /**
   * Renders the custom scrollbar with proportional thumb sizing
   *
   * Thumb size represents visible ratio (viewport/content)
   * Thumb position represents scroll progress
   */
  private updateScrollbar(): void {
    // Calculate track position (right edge of viewport, inset by padding)
    const trackX =
      this.viewportWidth / 2 -
      this.options.viewportPadding -
      this.options.scrollbarWidth;
    const trackY = -this.viewportHeight / 2 + this.options.viewportPadding;
    const trackHeight = this.viewportHeight - this.options.viewportPadding * 2;

    // Draw scrollbar track (background)
    this.scrollbarTrack.clear();
    this.scrollbarTrack.roundRect(
      trackX,
      trackY,
      this.options.scrollbarWidth,
      trackHeight,
      this.options.scrollbarWidth / 2, // Corner radius
    );
    this.scrollbarTrack.fill({ color: 0xffffff, alpha: 0.15 }); // Semi-transparent white

    // Clear thumb (hide if content doesn't need scrolling)
    this.scrollbarThumb.clear();
    if (this.minScrollY === 0 || this.contentHeight <= 0) {
      return; // No scrolling needed, don't draw thumb
    }

    const visibleHeight =
      this.viewportHeight - this.options.viewportPadding * 2;
    const contentScrollableHeight = this.contentHeight - visibleHeight;
    if (contentScrollableHeight <= 0) {
      return; // Content fits viewport
    }

    // Calculate thumb size (proportional to visible ratio)
    const minThumbHeight = 34; // Minimum size for usability
    const thumbHeight = Math.max(
      minThumbHeight,
      trackHeight * (visibleHeight / this.contentHeight), // Ratio of visible to total
    );

    // Calculate thumb travel distance
    const thumbTravel = Math.max(0, trackHeight - thumbHeight);

    // Calculate scroll progress (0 = top, 1 = bottom)
    const scrollProgress = Math.max(
      0,
      Math.min(1, -this.scrollY / contentScrollableHeight),
    );

    // Position thumb based on scroll progress
    const thumbY = trackY + thumbTravel * scrollProgress;

    // Draw scrollbar thumb (handle)
    this.scrollbarThumb.roundRect(
      trackX,
      thumbY,
      this.options.scrollbarWidth,
      thumbHeight,
      this.options.scrollbarWidth / 2, // Corner radius
    );
    this.scrollbarThumb.fill({ color: 0xffffff, alpha: 0.7 }); // More opaque than track
  }
}
