import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PortfolioService } from '../portfolio.service';


@Component({
  selector: 'app-home',
  template: `
    <section class="hero home">
      <h2 class="title">Hello, <span>I'm Travis</span></h2>
      <h3 class="subtitle h4">&hellip; and I enjoy making things for the web.</h3>
      <p class="body">
        In other words,
        <em>I specialize in crafting digital experiences that transform challenges into opportunities</em>. But I'm
        guessing you're not here to read a bunch of industry jargon, are you?
      </p>
      <button (click)="scroll('case-studies')" class="btn">
        Recent Work
        <svg class="icon -down">
          <use xlink:href="assets/icons/def.svg#icon-arrow-down"></use>
        </svg>
      </button>
      <div class="hero__image"></div>
    </section>

    <div id="case-studies">
      <section *ngFor="let case of cases | slice:0:3; let i = index" class="project__card">
        <div class="project__details">
          <h2 class="project__title h3">{{ case.title }}</h2>
          <h3 class="project__role h5">{{ case.role }}</h3>
          <h4 class="project__client h6">
            <span *ngIf="case.client">{{ case.client }} | </span>
            {{ case.date }}</h4>
          <h5 class="project__type">{{ case.type }}</h5>
        </div>
        <button
          *ngIf="case.btnLabel; else defaultBtn"
          [routerLink]="['/case', case.id]"
          class="btn -secondary">
          {{ case.btnLabel }}
          <svg class="icon -right">
            <use xlink:href="assets/icons/def.svg#icon-arrow-right"></use>
          </svg>
        </button>
        <ng-template #defaultBtn>
          <button
            [routerLink]="['/case', case.id]"
            class="btn -secondary">
            Read More
            <svg class="icon -right">
              <use xlink:href="assets/icons/def.svg#icon-arrow-right"></use>
            </svg>
          </button>
        </ng-template>
        <div
          *ngIf="screenWidth < 600"
          class="project__image"
          [ngStyle]="{ 'background-image': 'url(' + case.featureImageSm + '), linear-gradient(120deg, #164b49, #d4af37)' }"></div><div
          *ngIf="screenWidth > 601 && screenWidth < 800"
          class="project__image"
          [ngStyle]="{ 'background-image': 'url(' + case.featureImageMd + '), linear-gradient(120deg, #164b49, #d4af37)' }"></div><div
          *ngIf="screenWidth > 801 && screenWidth < 1200"
          class="project__image"
          [ngStyle]="{ 'background-image': 'url(' + case.featureImageLg + '), linear-gradient(120deg, #164b49, #d4af37)' }"></div><div
          *ngIf="screenWidth > 1201"
          class="project__image"
          [ngStyle]="{ 'background-image': 'url(' + case.featureImageXl + '), linear-gradient(120deg, #164b49, #d4af37)' }"></div>
      </section>
      <button
        aria-labelledby="Case Studies"
        title="Case Studies"
        [routerLink]="['/collection']"
        [routerLinkActiveOptions]="{exact:true}"
        routerLinkActive="active"
        class="btn">
        All Case Studies
        <svg class="icon -down">
          <use xlink:href="assets/icons/def.svg#icon-arrow-right"></use>
        </svg>
      </button>
    </div>
  `,
  styles: [`
    :host {
      /* border: 1px solid green; */
    }
    #case-studies > .btn {
      display: block;
      margin: var(--spacer--xl) auto calc(var(--spacer--xl) * 2);
    }
  `]
})
export class HomeComponent implements OnInit {
  public cases = [];
  public screenWidth: any;
  public screenHeight: any;

  constructor(private CaseService: PortfolioService, private router: Router) { }

  ngOnInit() {
    this.cases = this.CaseService.getCase();
    this.screenWidth = window.innerWidth;
    this.screenHeight = window.innerHeight;
  }

  scroll(id) {
    // console.log(`scrolling to ${id}`);
    const el = document.getElementById(id);
    el.scrollIntoView();
  }

}
