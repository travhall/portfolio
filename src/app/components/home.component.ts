import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-home',
  template: `
    <section class="hero">
      <h2 class="title">Hello, <span>I'm Travis</span></h2>
      <h3 class="h4 subtitle">&hellip; and I enjoy making things for the web.</h3>
      <p class="body">
        In other words,
        <em>I specialize in crafting digital experiences that transform challenges into opportunities</em>. But I'm
        guessing you're not here to read a bunch of industry jargon, are you?
      </p>
      <button (click)="scroll('case-studies')" class="btn">
        Case Studies
        <svg class="icon -down">
          <use xlink:href="assets/icons/def.svg#icon-arrow-down"></use>
        </svg>
      </button>
      <div class="hero__image"></div>
    </section>
    <app-case-list id="case-studies"></app-case-list>
    <!--<section id="about" class="about">
      <div class="about__content">
        <h2 class="title">Hello again!</h2>
        <p class="lead">
          Like I said, my name is Travis <i>(and that's Wylie)</i>.
        </p>
        <p>
          I'm a Denver based UX designer and UI developer, currently leading user experience for Arrow Electronics. Previously,
          I wrote code for
          <a href="https://ideapark.com/" class="" target="_blank" title="ideapark">ideapark</a>
          and
          <a href="https://www.lacek.com/" class="" target="_blank" title="The Lacek Group">The Lacek Group</a>. I've also
          worked with some great agencies like
          <a href="http://www.mccannmpls.com/" class="" target="_blank" title="McCann">McCann</a>,
          <a href="https://morsekode.com/" class="" target="_blank" title="Morsekode">Morsekode</a>, and
          <a href="http://www.playworkgroup.com/" class="" target="_blank" title="playworkgroup">playworkgroup</a>.
        </p>
      </div>
      <div class="about__image"></div>
    </section>-->
  `,
  styles: []
})
export class HomeComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

  scroll(id) {
    console.log(`scrolling to ${id}`);
    const el = document.getElementById(id);
    el.scrollIntoView();
  }

}
