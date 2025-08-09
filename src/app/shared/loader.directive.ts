import { Directive, ElementRef, Input, Renderer2, OnDestroy, OnInit } from '@angular/core';

@Directive({
  selector: '[appLoader]'
})
export class LoaderDirective implements OnInit, OnDestroy {
  @Input('appLoader') isLoading = false;
  @Input() loaderText: string | null = null; // optional text
  @Input() disableOnLoad: boolean = true; // disable button while loading
  @Input() spinnerSize: 'sm' | 'md' | 'lg' = 'md';

  private overlayEl!: HTMLElement;
  private spinnerEl!: HTMLElement;

  private originalPosition!: string | null;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnInit() {
    // create overlay and spinner but don't attach yet
    this.createOverlay();
    this.update(this.isLoading);
  }

  ngOnDestroy() {
    this.removeOverlay();
  }

  // Angular will call this when @Input changes (works if binding updates value)
  ngOnChanges?() {
    this.update(this.isLoading);
  }

  // Public method (optional) to toggle programmatically
  public setLoading(loading: boolean) {
    this.isLoading = loading;
    this.update(loading);
  }

  private update(loading: boolean) {
    if (loading) {
      this.showOverlay();
    } else {
      this.hideOverlay();
    }
  }

  private createOverlay() {
    const host = this.el.nativeElement as HTMLElement;

    // ensure host has non-static position for absolute overlay
    this.originalPosition = host.style.position || getComputedStyle(host).position;
    if (this.originalPosition === '' || this.originalPosition === 'static') {
      this.renderer.setStyle(host, 'position', 'relative');
    }

    // overlay
    this.overlayEl = this.renderer.createElement('div');
    this.renderer.addClass(this.overlayEl, 'cm-loader-overlay'); // class for styling

    // spinner wrapper
    this.spinnerEl = this.renderer.createElement('div');
    this.renderer.addClass(this.spinnerEl, 'cm-loader-spinner');
    this.renderer.addClass(this.spinnerEl, `cm-loader-${this.spinnerSize}`);

    // spinner inner (CSS animated)
    const spinnerInner = this.renderer.createElement('div');
    this.renderer.addClass(spinnerInner, 'cm-spinner');

    // optional text
    if (this.loaderText) {
      const textEl = this.renderer.createElement('div');
      this.renderer.addClass(textEl, 'cm-loader-text');
      const textNode = this.renderer.createText(this.loaderText);
      this.renderer.appendChild(textEl, textNode);
      this.renderer.appendChild(this.spinnerEl, spinnerInner);
      this.renderer.appendChild(this.spinnerEl, textEl);
    } else {
      this.renderer.appendChild(this.spinnerEl, spinnerInner);
    }

    this.renderer.appendChild(this.overlayEl, this.spinnerEl);
  }

  private showOverlay() {
    const host = this.el.nativeElement as HTMLElement;

    // append overlay if not already
    if (!host.contains(this.overlayEl)) {
      this.renderer.appendChild(host, this.overlayEl);
    }

    // disable element if requested (useful for buttons/inputs)
    if (this.disableOnLoad) {
      this.renderer.setAttribute(host, 'disabled', 'true');
      this.renderer.addClass(host, 'cm-loading-disabled');
    }
  }

  private hideOverlay() {
    const host = this.el.nativeElement as HTMLElement;

    // remove overlay if present
    if (host.contains(this.overlayEl)) {
      this.renderer.removeChild(host, this.overlayEl);
    }

    // restore disabled state
    if (this.disableOnLoad) {
      // only remove attribute if it was set by us. (simple approach: always remove)
      this.renderer.removeAttribute(host, 'disabled');
      this.renderer.removeClass(host, 'cm-loading-disabled');
    }

    // restore original position if we changed it (optional)
    if (this.originalPosition === '' || this.originalPosition === 'static') {
      // leave it — avoid disturbing layout; optional to restore
    }
  }

  private removeOverlay() {
    const host = this.el.nativeElement as HTMLElement;
    if (host.contains(this.overlayEl)) {
      this.renderer.removeChild(host, this.overlayEl);
    }
  }
}
