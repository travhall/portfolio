import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <header class="header">
      <a
      class="logo"
      title="iamtravishall.com - Travis Hall UX, UI &amp; Visual Design Professional - Denver | Minneapolis"
      [routerLink]="['']"
      >
        <svg #toTarget>
          <use xlink:href="assets/icons/def.svg#icon-Logo-Crest"></use>
        </svg>
      </a>
    </header>
    <main class="main">
      <section class="hero">
        <div class="hero__content">
          <h2>Hello, I'm Travis</h2>
          <h3 class="h4 subtitle">and I enjoy making things for the web.</h3>
          <p>
            In other words,
            <em>I specialize in crafting digital experiences that transform challenges into opportunities</em>. But I'm
            guessing you're not here to read a bunch of industry jargon, are you?
          </p>
        </div>
        <a href="mailto:hello@iamtravishall.com" class="link" title="Email me at hello@iamtravishall.com">hello@iamtravishall.com</a>
        <a href="" class="link scroll" title="">
          Case Studies
          <svg class="icon -lg">
            <use xlink:href="assets/icons/def.svg#icon-arrow-down"></use>
          </svg>
        </a>
        <div class="hero__image"></div>
      </section>
      <router-outlet></router-outlet>
      <section class="about">
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
      </section>
      <app-footer></app-footer>
    </main>
  `
})
export class AppComponent {
  title = 'iamtravishall.com - Travis Hall UX, UI & Visual Design Professional - Denver | Minneapolis';
}
