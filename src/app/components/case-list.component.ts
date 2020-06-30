import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { PortfolioService } from '../portfolio.service';

@Component({
  selector: 'app-case-list',
  template: `
    <section *ngFor="let case of cases; let i = index" class="project__card">
      <div class="project__details">
        <h2 *ngIf="case.title" class="project__title h3">{{ case.title }}</h2>
        <h3 *ngIf="case.role" class="project__role h5">{{ case.role }}</h3>
        <h4 class="project__client h6">
          <span *ngIf="case.client">{{ case.client }} | </span>
          <span *ngIf="case.date">{{ case.date }}</span>
        </h4>
        <h5 *ngIf="case.type" class="project__type">{{ case.type }}</h5>
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
        [ngStyle]="{ 'background-image': 'url(' + case.featureImageSm + '), linear-gradient(10deg, #164b49, #d4af37)' }"
      ></div><div
        *ngIf="screenWidth > 600 && screenWidth < 1024"
        class="project__image"
        [ngStyle]="{ 'background-image': 'url(' + case.featureImageMd + '), linear-gradient(10deg, #164b49, #d4af37)' }"
      ></div><div
        *ngIf="screenWidth > 1024 && screenWidth < 1441"
        class="project__image"
        [ngStyle]="{ 'background-image': 'url(' + case.featureImageLg + '), linear-gradient(10deg, #164b49, #d4af37)' }"
      ></div><div
        *ngIf="screenWidth > 1440"
        class="project__image"
        [ngStyle]="{ 'background-image': 'url(' + case.featureImageXl + '), linear-gradient(10deg, #164b49, #d4af37)' }"
      ></div>
    </section>
  `,
  styles: []
})
export class CaseListComponent implements OnInit {
  public cases = [];
  public screenWidth: any;
  public screenHeight: any;

  constructor(private CaseService: PortfolioService, private router: Router) { }

  ngOnInit() {
    this.cases = this.CaseService.getCase();
    this.screenWidth = window.innerWidth;
    this.screenHeight = window.innerHeight;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.screenWidth = window.innerWidth;
    this.screenHeight = window.innerHeight;
  }
}
