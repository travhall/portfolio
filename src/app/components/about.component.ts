import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-about',
  template: `
    <section class="hero about">
      <h2 class="title">Hello again!</h2>
      <h3 class="subtitle h4">
        As we’ve established, I’m Travis (and that's Wylie).
      </h3>
      <p class="body">
        I'm a Denver-based UX designer and UI developer now leading user
        experience for Arrow Electronics, the world’s largest distributor of
        electronic components. With Arrow’s help, more than 175,000 technology
        manufacturers and service providers get the support and tools they need
        to develop innovative products and solutions that improve life and
        business around the globe.
      </p>
      <button class="btn">
        Get to know me
        <svg class="icon -down">
          <use xlink:href="assets/icons/def.svg#icon-arrow-down"></use>
        </svg>
      </button>
    </section>
    <section style="padding:0 20vw 20vh;">
      <p>
        Before landing at Arrow, I wrote code for The Lacek Group, a
        Minneapolis-based firm that has helped big brands, such as Ford and
        Marriott, build and manage loyalty programs that keep their customers
        satisfied, engaged and coming back for more. I also have worked on the
        creative side of web design for some great advertising and marketing
        agencies, such as Ingredient (formerly ideapark), McCann, Morsekode and
        playworkgroup.
      </p>
    </section>
    <section style="padding:0 20vw 20vh;">
      <h4>
        User Experience Design
      </h4>
      <p>
        I rely on user research, usability principles and user-centric
        interaction design to create and manage meaningful, successful and
        unforgettable digital experiences.
      </p>
      <h4>
        Front-end and UI Development
      </h4>
      <p>
        I specialize in building scalable, modular user interfaces that render
        consistently and function seamlessly for all devices.
      </p>
      <h4>
        Visual and Interaction Design
      </h4>
      <p>
        My work is built on a solid foundation of visual and interaction design,
        ensuring it makes a lasting impression.
      </p>
    </section>
    <section style="padding:0 20vw 20vh;">
      <p>
        Colleagues have told me several times that I’m unique because I have an
        eye for data-driven design — meaning I’m into function as much as form,
        and I’m not afraid to change what the data say isn’t working. I think
        this is because of my unabashedly practical, Midwestern roots.
      </p>
    </section>
  `,
  styles: []
})
export class AboutComponent implements OnInit {
  constructor() { }

  ngOnInit() { }
}
