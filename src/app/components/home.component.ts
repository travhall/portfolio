import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-home',
  template: `
    <section class="hero home">
      <h2 class="title">Hello, <span>I'm Travis</span></h2>
      <h3 class="subtitle h4">
        &hellip; and I enjoy making things people use.
      </h3>
      <p class="body">
        I'm not big into industry jargon, and I’m guessing you’re not here to read a
        bunch of it, so l’ll leave it at this:
        <em>I specialize in crafting digital experiences that create opportunities and transform challenges into successes.</em>
      </p>
      <button class="btn">
        Recent Work
        <svg class="icon -down">
          <use xlink:href="assets/icons/def.svg#icon-arrow-down"></use>
        </svg>
      </button>
    </section>
  `,
  styles: []
})
export class HomeComponent implements OnInit {
  constructor() { }

  ngOnInit() { }
}
