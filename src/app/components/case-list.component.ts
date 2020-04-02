import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PortfolioService } from '../portfolio.service';

@Component({
  selector: 'app-case-list',
  template: `
    <section *ngFor="let case of cases; let i = index" class="project__card">
      <div class="project__details">
        <h2 class="project__title">{{ case.title }}</h2>
        <!--<ul>
          <li class="project__role">{{ case.role }}</li>
          <li class="project__type">{{ case.type }}</li>
          <li class="project__client">{{ case.client }}</li>
          <li class="project__date">{{ case.date }}</li>
        </ul>-->
        <p>
          Maecenas faucibus mollis interdum. Etiam porta sem malesuada magna
          mollis euismod. Praesent commodo cursus magna, vel scelerisque nisl
          consectetur et. Cras justo odio, dapibus ac facilisis in, egestas eget
          quam. Curabitur blandit tempus porttitor.
        </p>
      </div>
      <button class="btn -secondary" [routerLink]="['/case', case.id]">
        Read Case Study
        <svg class="icon -right">
          <use xlink:href="assets/icons/def.svg#icon-arrow-right"></use>
        </svg>
      </button>
      <div
        class="project__image"
        [ngStyle]="{
          'background-image':
            'url(' +
            case.featureImage +
            '), linear-gradient(125deg, #164b49, #367067)'
        }"
      ></div>
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
