import { Component, OnInit } from '@angular/core';
import { PortfolioService } from '../portfolio.service';

@Component({
  selector: 'app-case-list',
  template: `
    <section *ngFor="let case of cases; let i = index" class="project">
      <div>{{i}}</div>
      <div>{{case.title}}</div>
      <div>{{case.role}}</div>
      <div>{{case.client}}</div>
      <div>{{case.date}}</div>
      <button
      [routerLink]="['/case', case.id]"
      >Link</button>
    </section>
  `,
  styles: []
})
export class CaseListComponent implements OnInit {

  public cases = [];

  constructor(private CaseService: PortfolioService) { }

  ngOnInit() {
    this.cases = this.CaseService.getCase();
  }

}
