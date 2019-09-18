import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-nav',
  template: `
    <nav class="nav">
      <ul class="nav__container">
        <li class="nav__item">
          <a href="" class="nav__link">
            Link
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
