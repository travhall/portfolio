import { animate, state, style, transition, trigger } from '@angular/animations';
import { AfterViewInit, Component, HostBinding, ViewChild, ElementRef } from '@angular/core';
import { fromEvent } from 'rxjs';
import { distinctUntilChanged, filter, map, pairwise, share, throttleTime } from 'rxjs/operators';

enum VisibilityState {
  Visible = 'visible',
  Hidden = 'hidden'
}

enum Direction {
  Up = 'Up',
  Down = 'Down'
}

@Component({
  selector: 'app-header',
  template: `
  <header class="header">
    <a class="logo"title="iamtravishall.com - Travis Hall UX, UI &amp; Visual Design Professional - Denver | Minneapolis">
      <svg #toTarget>
        <use xlink:href="assets/icons/def.svg#icon-Logo-Crest"></use>
      </svg>
    </a>
  </header>
  `,
  styles: [
    `
      :host {
        height: 0;
        position: fixed;
        pointer-events: none;
        top: 0;
        width: 100%;
        z-index: 5000;
      }
    `
  ],
  animations: [
    trigger('toggle', [
      state(
        VisibilityState.Hidden,
        style({ opacity: 0.5, transform: 'translateY(-100%)' })
      ),
      state(
        VisibilityState.Visible,
        style({ opacity: 1, transform: 'translateY(0)' })
      ),
      transition('* => *', animate('200ms ease-in'))
    ])
  ]
})
export class HeaderComponent implements AfterViewInit {
  private isVisible = true;
  // @ViewChild('toTarget', { static: false }) toTarget: ElementRef;

  @HostBinding('@toggle')
  get toggle(): VisibilityState {
    return this.isVisible ? VisibilityState.Visible : VisibilityState.Hidden;
  }

  ngAfterViewInit() {
    const scroll$ = fromEvent(window, 'scroll').pipe(
      throttleTime(10),
      map(() => window.pageYOffset),
      pairwise(),
      map(([y1, y2]): Direction => (y2 < y1 ? Direction.Up : Direction.Down)),
      distinctUntilChanged(),
      share()
    );

    const goingUp$ = scroll$.pipe(
      filter(direction => direction === Direction.Up)
    );

    const goingDown$ = scroll$.pipe(
      filter(direction => direction === Direction.Down)
    );

    goingUp$.subscribe(() => (this.isVisible = true));
    goingDown$.subscribe(() => (this.isVisible = false));
  }

}
