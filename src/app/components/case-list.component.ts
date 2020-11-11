import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { PortfolioService } from '../portfolio.service';

@Component({
  selector: 'app-case-list',
  template: `
    <section *ngFor="let case of cases; let i = index" class="project__card">
      <div class="project__details">
        <h3 *ngIf="case.title" class="project__title">
          <a [routerLink]="['/case', case.id]">{{ case.title }}</a>
        </h3>
        <h4 *ngIf="case.type" class="project__type h5">{{ case.type }}</h4>
      </div>
      <!-- <button
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
      </ng-template> -->
    </section>
  `,
  styles: []
})
export class CaseListComponent implements OnInit {
  public cases = [];

  constructor(private CaseService: PortfolioService, private router: Router) { }

  ngOnInit() {
    this.cases = this.CaseService.getCase();
  }

}
