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
      <a
        aria-labelledby="Home"
        title="Home"
        [routerLink]="['']"
        [routerLinkActiveOptions]="{exact:true}"
        routerLinkActive="active"
        class="logo"
        [ngClass]="isVisible ? '' : 'shrink'">
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
        /* position: fixed; */
        height: 0;
        width: 100%;
        z-index: 1500;
      }
      @media (min-width: 48.125rem) {
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
        style({ transform: 'translateY(-8rem)' })
      ),
      state(
        VisibilityState.Visible,
        style({ transform: 'translateY(0)' })
      ),
      transition('* => *', animate('350ms ease-in'))
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
}
