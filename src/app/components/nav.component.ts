import { Component, OnInit } from '@angular/core';
import { ThemeService } from 'src/app/theme/theme.service';

@Component({
  selector: 'app-nav',
  template: `
    <nav class="nav">
      <ul class="nav__container">
        <!-- <li class="nav__item">
          <a (click)="toggleTheme()">
            Theme
          </a>
        </li> -->
        <li class="nav__item">
          <a
            aria-labelledby="About"
            title="About"
            [routerLink]="['/about']"
            [routerLinkActiveOptions]="{exact:true}"
            routerLinkActive="active"
            class="nav__link">
            About
          </a>
        </li>
        <li class="nav__item">
          <a
            aria-labelledby="Case Studies"
            title="Case Studies"
            [routerLink]="['/collection']"
            [routerLinkActiveOptions]="{exact:true}"
            routerLinkActive="active"
            class="nav__link">
            Case Studies
          </a>
        </li>
        <!-- <li class="nav__item">
          <a
            aria-labelledby="Contact"
            title="Contact"
            [routerLink]="['/contact']"
            [routerLinkActiveOptions]="{exact:true}"
            routerLinkActive="active"
            class="nav__link">
            Contact
          </a>
        </li> -->
      </ul>
    <nav>
  `
})
export class NavComponent implements OnInit {

  constructor(private themeService: ThemeService) { }

  ngOnInit() {
  }

  toggleTheme() {
    if (this.themeService.isDarkTheme()) {
      this.themeService.setLightTheme();
    } else {
      this.themeService.setDarkTheme();
    }
  }

}
