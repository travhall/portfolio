import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <app-header></app-header>
    <main class="main">
      <router-outlet></router-outlet>
    </main>
    <app-footer></app-footer>
  `
})
export class AppComponent {
  title = 'iamtravishall.com - Travis Hall UX, UI & Visual Design Professional - Denver | Minneapolis';
}
