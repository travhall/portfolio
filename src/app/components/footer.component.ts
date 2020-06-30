import { Component, OnInit, HostListener } from '@angular/core';

@Component({
  selector: 'app-footer',
  template: `
    <footer class="footer">
      <small class="copyright">
        Website design and content &copy;{{ year | date: "yyyy" }} Travis Hall.
      </small>
    </footer>
    <div
      id="contact-modal"
      class="contact__window"
      role="dialog"
      aria-labelledby="Contact Information"
      title="Contact Information">
      <a
        (click)="contactClose()"
        title="Close"
        class="contact__close">
        Close <small>(esc)</small>
      </a>
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
        <li class="contact__item">
            <a
              href="www.linkedin.com/in/travhall/"
              aria-labelledby="Find me on linkedin"
              title="Find me on linkedin"
              target="_blank" rel="noopener noreferrer">
              find me on linkedin
            </a>
        </li>
          <li class="contact__item">
            <a
              href="" target="_blank"
              aria-labelledby="Download my resum&eacute;"
              title="Download my resum&eacute;"
              rel="noopener noreferrer">
              download resum&eacute;
            </a>
          </li>
      </ul>
    </div>
  `
})

export class FooterComponent implements OnInit {
  year = Date.now();

  constructor() { }

  public keypressed;
  modal = false;

  ngOnInit() {
  }

  @HostListener('document:keydown.escape', ['$event']) onKeydownHandler(evt: KeyboardEvent) {
    this.contactClose();
  }

  contactClose() {
    this.modal = !this.modal;
    document.body.classList.remove('blur');
    document.getElementById('contact-modal').classList.remove('active');
  }

}
