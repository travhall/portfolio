import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-collection',
  template: `
    <app-case-list id="case-studies"></app-case-list>
  `,
  styles: []
})
export class CollectionComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
