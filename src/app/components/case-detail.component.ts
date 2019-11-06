import { Component, OnInit } from '@angular/core';
import { PortfolioService } from '../portfolio.service';
import { ActivatedRoute, Router, ParamMap } from '@angular/router';

@Component({
  selector: 'app-case',
  template: `
    <article class="project__page">
      <h2>{{caseInfo.title}}</h2>
      <div>{{caseInfo.role}}</div>
      <div>{{caseInfo.client}}</div>
      <div>{{caseInfo.date}}</div>
      <a (click)="goPrev()">Prev</a>
      <a (click)="goNext()">Next</a>
    </article>
  `,
  styles: [`a {padding:1rem;}`]
})
export class CaseDetailComponent implements OnInit {

  public cases = [];
  public caseInfo;
  public caseId;

  constructor(
    private CaseService: PortfolioService,
    private route: ActivatedRoute,
    private router: Router) { }

  ngOnInit() {
    this.cases = this.CaseService.getCase();

    this.route.paramMap.subscribe((params: ParamMap) => {
      const id = parseInt(params.get('id'), 0);
      const info = this.cases.find(x => x.id === id);
      this.caseInfo = info;
      this.caseId = id;
    });

  }

  goPrev() {
    const prevId = this.caseId > 1 ? this.caseId - 1 : this.caseId;
    this.router.navigate(['case', prevId]);
  }
  goNext() {
    const nextId = this.caseId === this.cases.length ? this.caseId : this.caseId + 1;
    this.router.navigate(['case', nextId]);
  }

}
