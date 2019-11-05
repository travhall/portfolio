import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <header class="header">
      <a class="logo" [routerLink]="['/']">
        <svg>
          <use xlink:href="assets/icons/def.svg#icon-Logo-Crest"></use>
        </svg>
      </a>
    </header>
    <main class="main">
    <router-outlet></router-outlet>
    </main>
    <app-footer></app-footer>
  `
})
export class AppComponent {
  title = 'iamtravishall.com - Travis Hall UX, UI & Visual Design Professional - Denver | Minneapolis';
}
