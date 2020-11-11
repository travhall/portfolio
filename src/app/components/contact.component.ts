import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-contact',
  template: `
    <section class="hero contact">
      <h2 class="title">Get in touch</h2>
      <h3 class="subtitle h4">Subtitle</h3>
      <p class="body">
        Body faucibus mollis interdum. Nulla vitae elit libero, a pharetra augue.
      </p>
      <button class="btn">
        Button
        <svg class="icon -down">
          <use xlink:href="assets/icons/def.svg#icon-arrow-down"></use>
        </svg>
      </button>
    </section>
  `,
  styles: []
})
export class ContactComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
