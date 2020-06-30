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
              aria-labelledby="Home"
              title="Home"
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
              aria-labelledby="About"
              title="About"
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
              aria-labelledby="Case Studies"
              title="Case Studies"
              [routerLink]="['/collection']"
              [routerLinkActiveOptions]="{exact:true}"
              routerLinkActive="active"
              (click)="menuOpen()"
              class="nav__link">
              Case Studies
            </a>
          </li>
          <li class="nav__item">
            <a
              aria-labelledby="Contact"
              title="Contact"
              [routerLink]="['/contact']"
              [routerLinkActiveOptions]="{exact:true}"
              routerLinkActive="active"
              (click)="menuOpen()"
              class="nav__link">
              Contact
            </a>
          </li>
        </ul>

        <ul class="contact__info">
          <li class="contact__item">
            <a
              href="mailto:hello@iamtravishall.com?subject=Hi Travis!"
              aria-labelledby="Email me - hello@iamtravishall.com"
              title="Email me - hello@iamtravishall.com"
              target="_blank" rel="noopener noreferrer">
              hello@iamtravishall.com
            </a>
          </li>
          <li class="contact__item">
            <a
              href="tel:1-303-335-9936"
              aria-labelledby="Call me - (303) 335-9936"
              title="Call me - (303) 335-9936"
              target="_blank" rel="noopener noreferrer">
              (303) 335-9936
            ‬</a>
          </li>
          <li class="contact__item">
            <a
              href="www.linkedin.com/in/travhall/"
              aria-labelledby="Find me on linkedin"
              title="Find me on linkedin"
              target="_blank" rel="noopener noreferrer">
              find me on linkedin
            </a>
          </li>
          <li class="contact__item">
            <a
              href="" target="_blank"
              aria-labelledby="Download my resum&eacute;"
              title="Download my resum&eacute;"
              rel="noopener noreferrer">
              download resum&eacute;
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
  modal = false;

  ngOnInit() {
  }

  menuOpen() {
    this.status = !this.status;
    document.body.classList.toggle('fixed');
  }

  contactOpen() {
    this.modal = !this.modal;
    document.body.classList.add('blur');
    document.getElementById('contact-modal').classList.add('active');
  }

}
