import { Component, OnInit } from '@angular/core';
import { PortfolioService } from '../portfolio.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-case',
  template: `
    <article>
      <div>{{case.title}}</div>
      <div>{{case.role}}</div>
      <div>{{case.client}}</div>
      <div>{{case.date}}</div>
    </article>
  `,
  styles: []
})
export class CaseComponent implements OnInit {

  public cases = [];
  case: any;

  constructor(private CaseService: PortfolioService, private route: ActivatedRoute) { }

  ngOnInit() {
    this.cases = this.CaseService.getCase();
    this.case = this.cases.find(x => x.id === this.route.snapshot.paramMap.get('id'));
  }

}
