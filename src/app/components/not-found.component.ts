import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-not-found',
  template: `
    <section>
      <h2>404 son!</h2>
    </section>

    <!-- Icons -->
    <section>

      <h3>Icons</h3>

      <svg class="icon -xl">
        <use xlink:href="assets/icons/def.svg#icon-Logo-Crest"></use>
      </svg>

      <svg class="icon -xl">
        <use xlink:href="assets/icons/def.svg#icon-Logo-Flag"></use>
      </svg>

      <svg class="icon -xl">
        <use xlink:href="assets/icons/def.svg#icon-UX-Design"></use>
      </svg>

      <svg class="icon -xl">
        <use xlink:href="assets/icons/def.svg#icon-UI-Dev"></use>
      </svg>

      <svg class="icon -xl">
        <use xlink:href="assets/icons/def.svg#icon-Vis-Design"></use>
      </svg>

      <svg class="icon -lg">
        <use xlink:href="assets/icons/def.svg#icon-arrow-down"></use>
      </svg>

      <svg class="icon -lg">
        <use xlink:href="assets/icons/def.svg#icon-arrow-left"></use>
      </svg>

      <svg class="icon -lg">
        <use xlink:href="assets/icons/def.svg#icon-arrow-right"></use>
      </svg>

      <svg class="icon -lg">
        <use xlink:href="assets/icons/def.svg#icon-arrow-up"></use>
      </svg>

      <svg class="icon -lg">
        <use xlink:href="assets/icons/def.svg#icon-alert"></use>
      </svg>

      <svg class="icon -lg">
        <use xlink:href="assets/icons/def.svg#icon-check"></use>
      </svg>

      <svg class="icon -lg">
        <use xlink:href="assets/icons/def.svg#icon-hand"></use>
      </svg>

      <svg class="icon -lg">
        <use xlink:href="assets/icons/def.svg#icon-info"></use>
      </svg>

      <svg class="icon -lg">
        <use xlink:href="assets/icons/def.svg#icon-success"></use>
      </svg>

      <svg class="icon -lg">
        <use xlink:href="assets/icons/def.svg#icon-home"></use>
      </svg>

      <svg class="icon -lg">
        <use xlink:href="assets/icons/def.svg#icon-case"></use>
      </svg>

      <svg class="icon -lg">
        <use xlink:href="assets/icons/def.svg#icon-about"></use>
      </svg>

      <svg class="icon -lg">
        <use xlink:href="assets/icons/def.svg#icon-envelope"></use>
      </svg>

      <svg class="icon -lg">
        <use xlink:href="assets/icons/def.svg#icon-Linkedin"></use>
      </svg>

      <svg class="icon -lg">
        <use xlink:href="assets/icons/def.svg#icon-phone"></use>
      </svg>

    </section>

    <!-- Typography -->
    <section>

      <h3>Typography</h3>

      <p>
        This an example paragraph that demonstrates some basic text elements. The
        following is <b>bold text</b> and this is <strong>strong text</strong>. This
        is <i>italic text</i>, whereas this is <em>emphasized text</em>. This line
        features <sup>superscript text</sup> and <sub>subscript text</sub>, as well
        as, <u>underlined text</u>, <del>strikethrough text</del>, <a>an anchor</a>, a and
        another anchor with
        <a  class="link">
          an icon <svg class="icon -sm">
            <use xlink:href="assets/icons/def.svg#icon-arrow-down"></use>
          </svg></a>. All of these items are inline elements, which can be used in headings,
        paragraphs and just about anywhere really.
      </p>

      <blockquote>Super inspirational text goes in blockquotes</blockquote>

      <h1 class="h1">Heading Level 1</h1>
      <h2 class="h2">Heading Level 2</h2>
      <h3 class="h3">Heading Level 3</h3>
      <h4 class="h4">Heading Level 4</h4>
      <h5 class="h5">Heading Level 5</h5>
      <h6 class="h6">Heading Level 6</h6>

      <p class="lead">
        This is a lead paragraph. Lead paragraphs are meant to introduce bodies of
        text. It makes use of the .lead class.
      </p>

      <p>
        Nulla vitae elit libero, a pharetra augue. Aenean lacinia bibendum nulla sed
        consectetur. Aenean eu leo quam. Pellentesque ornare sem lacinia quam
        venenatis vestibulum. Vestibulum id ligula porta felis euismod semper. Morbi
        leo risus, porta ac consectetur ac, vestibulum at eros. Cras justo odio,
        dapibus ac facilisis in, egestas eget quam. Nulla vitae elit libero, a
        pharetra augue. Vestibulum id ligula porta felis euismod semper. Maecenas
        faucibus mollis interdum.
      </p>
      <p>
        Sample paragraph. Maecenas sed diam eget risus varius blandit sit amet non
        magna. Cum sociis natoque penatibus et magnis dis parturient montes,
        nascetur ridiculus mus. Fusce dapibus, tellus ac cursus commodo, tortor
        mauris condimentum nibh, ut fermentum massa justo sit amet risus. Duis
        mollis, est non commodo luctus, nisi erat porttitor ligula, eget lacinia
        odio sem nec elit. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
      </p>
      <p>
        Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut
        fermentum massa justo sit amet risus. Morbi leo risus, porta ac consectetur
        ac, vestibulum at eros. Vivamus sagittis lacus vel augue laoreet rutrum
        faucibus dolor auctor. Vivamus sagittis lacus vel augue laoreet rutrum
        faucibus dolor auctor. Cras mattis consectetur purus sit amet fermentum.
      </p>

      <h4>Blockquote</h4>
      <blockquote>
        Travis is a powerful customer advocate. During the time I was blessed to
        work with him, he crafted the user personas we used to drive a user-centric
        product, guided the product managers in adopting data-driven prioritization,
        and mentored his direct reports into deeply passionate professionals. I
        would jump at the chance to work with him again and hope I am provided the
        opportunity to do so.
        <cite>
          Donald Meyer - SDLC Practice Lead at Janus Henderson Investors U.S.
          <small>Former Head Of Product Management at Arrow Digital</small>
        </cite>
      </blockquote>
    </section>

    <!-- Buttons -->
    <section>

      <button>Button</button>
      <button class="-secondary">Button</button>
      <button class="-tertiary">Button</button>
      <button class="-white">Button</button>
      <button class="-ghost">Button</button>
      <button class="isDisabled">Disabled</button>

      <hr>

      <a class="btn" href="#!">Anchor</a>
      <a class="btn -secondary" href="#!">Anchor</a>
      <a class="btn -tertiary" href="#!">Anchor</a>
      <a class="btn -white" href="#!">Anchor</a>
      <a class="btn -ghost" href="#!">Anchor</a>
      <a class="btn isDisabled" href="#!">Anchor</a>

      <hr>

      <button class="btn">
        Button
        <svg class="icon">
          <use xlink:href="assets/icons/def.svg#icon-arrow-right"></use>
        </svg>
      </button>
      <button class="btn -secondary">
        Button
        <svg class="icon -right">
          <use xlink:href="assets/icons/def.svg#icon-arrow-right"></use>
        </svg>
      </button>
      <button class="btn -tertiary">
        Button
        <svg class="icon">
          <use xlink:href="assets/icons/def.svg#icon-arrow-right"></use>
        </svg>
      </button>
      <button class="btn -white">
        Button
        <svg class="icon">
          <use xlink:href="assets/icons/def.svg#icon-arrow-right"></use>
        </svg>
      </button>
      <button class="btn -ghost">
        Button
        <svg class="icon">
          <use xlink:href="assets/icons/def.svg#icon-arrow-right"></use>
        </svg>
      </button>

      <hr>

      <button class="btn -success">
        Button
        <svg class="icon">
          <use xlink:href="assets/icons/def.svg#icon-success"></use>
        </svg>
      </button>
      <button class="btn -warning">
        Button
        <svg class="icon">
          <use xlink:href="assets/icons/def.svg#icon-hand"></use>
        </svg>
      </button>
      <button class="btn -error">
        Button
        <svg class="icon">
          <use xlink:href="assets/icons/def.svg#icon-alert"></use>
        </svg>
      </button>
      <button class="btn -ghost -block">
        Block Button
        <svg class="icon">
          <use xlink:href="assets/icons/def.svg#icon-arrow-down"></use>
        </svg>
      </button>

    </section>

    <!-- Lists -->
    <section>

      <h3>Lists</h3>

      <h4>Unordered</h4>
      <ul>
        <li>Dolor pulvinar etiam.</li>
        <li>Sagittis adipiscing.</li>
        <li>Felis enim feugiat.</li>
        <li>Etiam vel felis lorem.</li>
      </ul>

      <h4>Ordered</h4>
      <ol>
        <li>Dolor pulvinar etiam.</li>
        <li>Etiam vel felis viverra.</li>
        <li>Felis enim feugiat.</li>
        <li>Dolor pulvinar etiam.</li>
        <li>Etiam vel felis lorem.</li>
        <li>Felis enim et feugiat.</li>
      </ol>

    </section>

    <!-- Tables -->
    <section>

      <h3>Tables</h3>

      <h4>Default</h4>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Item One</td>
            <td>Ante turpis integer aliquet porttitor.</td>
            <td>29.99</td>
          </tr>
          <tr>
            <td>Item Two</td>
            <td>Vis ac commodo adipiscing arcu aliquet.</td>
            <td>19.99</td>
          </tr>
          <tr>
            <td>Item Three</td>
            <td> Morbi faucibus arcu accumsan lorem.</td>
            <td>29.99</td>
          </tr>
          <tr>
            <td>Item Four</td>
            <td>Vitae integer tempus condimentum.</td>
            <td>19.99</td>
          </tr>
          <tr>
            <td>Item Five</td>
            <td>Ante turpis integer aliquet porttitor.</td>
            <td>29.99</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2"></td>
            <td>100.00</td>
          </tr>
        </tfoot>
      </table>

      <h4>Alternate</h4>
      <table class="striped clickable">
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Item One</td>
            <td>Ante turpis integer aliquet porttitor.</td>
            <td>29.99</td>
          </tr>
          <tr>
            <td>Item Two</td>
            <td>Vis ac commodo adipiscing arcu aliquet.</td>
            <td>19.99</td>
          </tr>
          <tr>
            <td>Item Three</td>
            <td> Morbi faucibus arcu accumsan lorem.</td>
            <td>29.99</td>
          </tr>
          <tr>
            <td>Item Four</td>
            <td>Vitae integer tempus condimentum.</td>
            <td>19.99</td>
          </tr>
          <tr>
            <td>Item Five</td>
            <td>Ante turpis integer aliquet porttitor.</td>
            <td>29.99</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2"></td>
            <td>100.00</td>
          </tr>
        </tfoot>
      </table>
    </section>

    <!-- Forms -->
    <section>

      <h3>Forms</h3>

      <form class="form" method="post" action="#">
        <div class="row">
          <input class="field" type="text" name="demo-name" id="demo-name" placeholder="Jane Doe" />
          <label for="demo-name">Name</label>
        </div>
        <div class="row">
          <input class="field" type="email" name="demo-email" id="demo-email" placeholder="jane@untitled.tld" />
          <label for="demo-email">Email</label>
        </div>
        <div class="row">
          <select class="field" name="demo-category" id="demo-category">
            <option value="">-</option>
            <option value="1">Manufacturing</option>
            <option value="1">Shipping</option>
            <option value="1">Administration</option>
            <option value="1">Human Resources</option>
          </select>
          <label for="demo-category">Category</label>
        </div>
        <div class="row">
          <input type="radio" id="demo-priority-low" name="demo-priority" checked>
          <label for="demo-priority-low">Low</label>
        </div>
        <div class="row">
          <input type="radio" id="demo-priority-high" name="demo-priority">
          <label for="demo-priority-high">High</label>
        </div>
        <div class="row">
          <input type="checkbox" id="demo-copy" name="demo-copy">
          <label for="demo-copy">Email me a copy</label>
        </div>
        <div class="row">
          <input type="checkbox" id="demo-human" name="demo-human" checked>
          <label for="demo-human">Not a robot</label>
        </div>
        <div class="row">
          <textarea name="demo-message" id="demo-message" placeholder="Enter your message" rows="6"></textarea>
          <label for="demo-message">Message</label>
        </div>
        <ul class="actions">
          <li><input type="submit" value="Send Message" class="primary" /></li>
          <li><input type="reset" value="Reset" /></li>
        </ul>
      </form>

    </section>
  `,
  styles: [
    `section {
      min-height: 50vh;
      padding:var(--spacer--lg);
    }`
  ]
})
export class NotFoundComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
