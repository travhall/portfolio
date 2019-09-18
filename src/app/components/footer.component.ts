import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-footer',
  template: `
    <footer class="footer">
      <a href="" class="logo" title=""></a>
      <small class="copyright">
        Website design and content &copy;{{ year | date: "yyyy" }} Travis Hall.
      </small>
    </footer>
  `
})
export class FooterComponent implements OnInit {
  year = Date.now();
  constructor() { }

  ngOnInit() {
  }

}
