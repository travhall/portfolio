import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-about',
  template: `
    <section class="hero about">
      <h2 class="title">Hello again.</h2>
      <h3 class="subtitle h4">&hellip; like I said, I'm Travis.</h3>
      <p class="body">
        Maecenas faucibus mollis interdum. Nulla vitae elit libero, a pharetra augue.
      </p>
      <button class="btn">
        Get to know me
        <svg class="icon -down">
          <use xlink:href="assets/icons/def.svg#icon-arrow-down"></use>
        </svg>
      </button>
      <div class="hero__image"></div>
    </section>
  `,
  styles: []
})
export class AboutComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
