import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-nav',
  template: `
    <nav class="nav">
      <ul class="nav__container">
        <li class="nav__item">
          <a href="" class="nav__link">
            Case Studies
          </a>
        </li>
        <li class="nav__item">
          <a href="" class="nav__link">
            About
          </a>
        </li>
        <li class="nav__item">
          <a href="" class="nav__link">
            Contact
          </a>
        </li>
      </ul>
    <nav>
  `
})
export class NavComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
