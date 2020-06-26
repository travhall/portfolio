import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-nav',
  template: `
    <nav class="nav">
      <div class="nav__toggle" (click)="menuOpen()" [ngClass]="status ? 'open' : 'closed'">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>

      <div class="nav__container" [ngClass]="status ? 'open' : 'closed'">
        <ul>
          <li class="nav__item">
            <a
              [routerLink]="['']"
              [routerLinkActiveOptions]="{exact:true}"
              routerLinkActive="active"
              (click)="menuOpen()"
              class="nav__link">
              Home
            </a>
          </li>
          <li class="nav__item">
            <a
              [routerLink]="['/about']"
              [routerLinkActiveOptions]="{exact:true}"
              routerLinkActive="active"
              (click)="menuOpen()"
              class="nav__link">
              About
            </a>
          </li>
          <li class="nav__item">
            <a
              [routerLink]="['/collection']"
              [routerLinkActiveOptions]="{exact:true}"
              routerLinkActive="active"
              (click)="menuOpen()"
              class="nav__link">
              Case Studies
            </a>
          </li>
          <li class="nav__item">
            <a href="" class="nav__link">
              Contact
            </a>
          </li>
        </ul>
        <ul class="contact__info">
          <li class="contact__item">
            <a href="mailto:hello@iamtravishall.com?subject=Important!&body=Hi." target="_blank" rel="noopener noreferrer">
              hello@iamtravishall.com
            </a>
          </li>
          <li class="contact__item">
            <a href="tel:1-303-335-9936" target="_blank" rel="noopener noreferrer">
              (303) 335-9936
            ‬</a>
          </li>
          <li class="contact__item">
            <a href="www.linkedin.com/in/travhall/" target="_blank" rel="noopener noreferrer">
              find me on linkedin
            </a>
          </li>
        </ul>
      </div>
    <nav>
  `
})
export class NavComponent implements OnInit {

  constructor() { }

  status = false;

  ngOnInit() {
  }

  menuOpen() {
    this.status = !this.status;
    document.body.classList.toggle('fixed');
  }

}
