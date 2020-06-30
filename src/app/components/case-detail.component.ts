import { Component, OnInit } from '@angular/core';
import { PortfolioService } from '../portfolio.service';
import { ActivatedRoute, Router, ParamMap } from '@angular/router';

@Component({
  selector: 'app-case',
  template: `
    <section class="hero case">
      <h2 *ngIf="caseInfo.title" class="title h3">{{caseInfo.title}}</h2>
      <h3 *ngIf="caseInfo.role" class="subtitle h5">{{caseInfo.role}}</h3>
      <div class="body">
        <h4 *ngIf="caseInfo.client">{{caseInfo.client}}</h4>
        <h5 *ngIf="caseInfo.date">{{caseInfo.date}}</h5>
        <h6 *ngIf="caseInfo.type">{{caseInfo.type}}</h6>
        <p *ngIf="caseInfo.desc">{{caseInfo.desc}}</p>
      </div>
    </section>
    <section class="pagination">
      <a (click)="goPrev()">Prev</a>
      <a (click)="goNext()">Next</a>
    </section>
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
