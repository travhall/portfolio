import { Component, OnInit } from '@angular/core';
import { PortfolioService } from '../portfolio.service';
import { ActivatedRoute, Router, ParamMap } from '@angular/router';

@Component({
  selector: "app-case",
  template: `
    <section class="hero case">
      <h2 *ngIf="caseInfo.title" class="title h3">{{ caseInfo.title }}</h2>
      <h3 *ngIf="caseInfo.role" class="subtitle h5">{{ caseInfo.role }}</h3>
      <div class="body">
        <h4 *ngIf="caseInfo.client">{{ caseInfo.client }}</h4>
        <h5 *ngIf="caseInfo.date">{{ caseInfo.date }}</h5>
        <h6 *ngIf="caseInfo.type">{{ caseInfo.type }}</h6>
        <p *ngIf="caseInfo.desc">{{ caseInfo.desc }}</p>
      </div>
    </section>

    <section
      *ngFor="let block of caseInfo.caseItem"
      class="{{ block.class }} case__block"
    >
      <div *ngIf="block.isPublic == true">
        <div
          *ngIf="block.hasImage == true"
          class="{{ block.imageClass }} case__image"
        >
          <picture
            ><source
              media="(min-width:90rem)"
              srcset="assets/img/xl/{{ block.imagePath.toString() }}"/>
            <source
              media="(min-width:65rem)"
              srcset="assets/img/lg/{{ block.imagePath.toString() }}"/>
            <!-- <source
              media="(min-width:50rem)"
              srcset="assets/img/mdp/{{ block.imagePath.toString() }}"/> -->
            <source
              media="(orientation: landscape) and (min-width:48rem)"
              srcset="assets/img/mdl/{{ block.imagePath.toString() }}"/>
            <source
              media="(orientation: portrait) and (min-width:48rem)"
              srcset="assets/img/mdp/{{ block.imagePath.toString() }}"/>
            <source
              media="(min-width:25rem)"
              srcset="assets/img/sm/{{ block.imagePath.toString() }}"/>
            <img
              src="assets/img/base/{{ block.imagePath.toString() }}"
              alt="{{ block.altText }}"
          /></picture>
        </div>
        <div class="case__body">
          <h4 *ngIf="block.heading">{{ block.heading }}</h4>
          <h5 *ngIf="block.subhead">{{ block.subhead }}</h5>
          <p *ngIf="block.bodyCopy">{{ block.bodyCopy }}</p>
          <a
            *ngIf="block.link"
            href="{{ block.linkUrl.toString() }}"
            title="{{ block.link.toString() }}"
            target="{{ block.linkTarget }}"
            >{{ block.link }}</a
          >
        </div>
      </div>
    </section>

    <section class="pagination" style="text-align:center; padding:1rem;">
      <a (click)="goPrev()" style="padding:1rem">Previous</a>
      <a (click)="goNext()" style="padding:1rem">Next</a>
    </section>
  `,
  styles: []
})
export class CaseDetailComponent implements OnInit {
  public cases = [];
  public caseInfo;
  public caseId;

  constructor(
    private CaseService: PortfolioService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit() {
    this.cases = this.CaseService.getCase();

    this.route.paramMap.subscribe((params: ParamMap) => {
      const id = parseInt(params.get("id"), 0);
      const info = this.cases.find(x => x.id === id);
      this.caseInfo = info;
      this.caseId = id;
    });
  }

  goNext() {
    const prevId = this.caseId > 1 ? this.caseId - 1 : this.caseId;
    this.router.navigate(["case", prevId]);
  }
  goPrev() {
    const nextId =
      this.caseId === this.cases.length ? this.caseId : this.caseId + 1;
    this.router.navigate(["case", nextId]);
  }
}
