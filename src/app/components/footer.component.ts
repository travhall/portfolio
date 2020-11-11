import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-footer',
  template: `
    <footer class="footer">
      <ul class="contact__info">
        <li class="contact__item">
          <a
            href="mailto:hello@iamtravishall.com?subject=Hi Travis!"
            aria-labelledby="Email me - hello@iamtravishall.com"
            title="Email me - hello@iamtravishall.com"
            target="_blank" rel="noopener noreferrer">
            hello@iamtravishall.com
          </a>
        </li>
        <li class="contact__item">
            <a
              href="tel:1-303-335-9936"
              aria-labelledby="Call me - (303) 335-9936"
              title="Call me - (303) 335-9936"
              target="_blank" rel="noopener noreferrer">
              (303) 335-9936
            ‬</a>
        </li>
      </ul>
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
