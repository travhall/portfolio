import {
  animate,
  state,
  style,
  transition,
  trigger
} from '@angular/animations';
import { AfterViewInit, Component, HostBinding } from '@angular/core';
import { fromEvent } from 'rxjs';
import {
  distinctUntilChanged,
  filter,
  map,
  pairwise,
  share,
  throttleTime
} from 'rxjs/operators';
import { Router } from '@angular/router';

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
      <a (click)="goHome()" class="logo" [ngClass]="isVisible ? '' : 'shrink'">
        <svg>
          <use xlink:href="assets/icons/def.svg#icon-Logo-Crest"></use>
        </svg>
      </a>
      <app-nav></app-nav>
    </header>
  `
  ,
  styles: [
    `
      :host {
        height: 0;
        position: absolute;
        top: 0;
        width: 100%;
        z-index: 5000;
      }
      @media(min-width: 36em) {
        :host {
          position: fixed;
        }
      }
    `
  ],
  animations: [
    trigger('toggle', [
      state(
        VisibilityState.Hidden,
        style({ opacity: 0.5, transform: 'translateY(-100%)', top: '-6rem' })
      ),
      state(
        VisibilityState.Visible,
        style({ opacity: 1, transform: 'translateY(0)', top: '0' })
      ),
      transition('* => *', animate('200ms ease-in'))
    ])
  ]
})
export class HeaderComponent implements AfterViewInit {
  public isVisible = true;

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

  constructor(private router: Router) { }

  goHome() {
    this.router.navigate(['/']);
  }
}
