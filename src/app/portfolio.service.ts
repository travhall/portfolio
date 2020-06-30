import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PortfolioService {

  constructor() { }

  getCase() {
    return [
      {
        id: 6,
        title: 'Arrow Global Information Architecture',
        role: 'UX Lead',
        type: 'UX Research, Information Architecture',
        client: 'Arrow Electronics',
        date: '2020',
        desc: 'Maecenas faucibus mollis interdum. Etiam porta sem malesuada magna mollis euismod. Praesent commodo cursus magna, velt.',
        btnLabel: 'Read Case Study',
        featureImageSm: './assets/img/project--img--sm6.jpg',
        featureImageMd: './assets/img/project--img--md6.jpg',
        featureImageLg: './assets/img/project--img--lg6.jpg',
        featureImageXl: './assets/img/project--img--xl6.jpg',
        featureAlt: 'Featured Image Alt Text'
      },
      {
        id: 5,
        title: 'Arrow Global Header Design',
        role: 'UX Lead',
        type: 'UX, UI & Interaction Design',
        client: 'Arrow Electronics',
        date: '2020',
        desc: 'Maecenas faucibus mollis interdum. Etiam porta sem malesuada magna mollis euismod. Praesent commodo cursus magna, velt.',
        btnLabel: 'Read Case Study',
        featureImageSm: './assets/img/project--img--sm5.jpg',
        featureImageMd: './assets/img/project--img--md5.jpg',
        featureImageLg: './assets/img/project--img--lg5.jpg',
        featureImageXl: './assets/img/project--img--xl5.jpg',
        featureAlt: 'Featured Image Alt Text'
      },
      {
        id: 4,
        title: 'Arrow Design System',
        role: 'UX Lead',
        type: 'UI & Accessibility Design',
        client: 'Arrow Electronics',
        date: '2020',
        desc: 'Maecenas faucibus mollis interdum. Etiam porta sem malesuada magna mollis euismod. Praesent commodo cursus magna, velt.',
        btnLabel: 'Read Case Study',
        featureImageSm: './assets/img/project--img--sm4.jpg',
        featureImageMd: './assets/img/project--img--md4.jpg',
        featureImageLg: './assets/img/project--img--lg4.jpg',
        featureImageXl: './assets/img/project--img--xl4.jpg',
        featureAlt: 'Featured Image Alt Text'
      },
      {
        id: 3,
        title: 'Not a Robot',
        role: 'UX, Visual Designer & WordPress Developer',
        type: 'Branding & Microsite',
        client: 'Jamie Alberico',
        date: '2020',
        desc: 'Maecenas faucibus mollis interdum. Etiam porta sem malesuada magna mollis euismod. Praesent commodo cursus magna, velt.',
        btnLabel: 'Read Case Study',
        featureImageSm: './assets/img/project--img--sm3.jpg',
        featureImageMd: './assets/img/project--img--md3.jpg',
        featureImageLg: './assets/img/project--img--lg3.jpg',
        featureImageXl: './assets/img/project--img--xl3.jpg',
        featureAlt: 'Featured Image Alt Text'
      },
      {
        id: 2,
        title: 'Blossom Grow Light App',
        role: 'UX & Visual Design',
        type: 'App Design',
        client: 'Blossom LED',
        date: '2020',
        desc: 'Maecenas faucibus mollis interdum. Etiam porta sem malesuada magna mollis euismod. Praesent commodo cursus magna, velt.',
        btnLabel: 'Read Case Study',
        featureImageSm: './assets/img/project--img--sm2.jpg',
        featureImageMd: './assets/img/project--img--md2.jpg',
        featureImageLg: './assets/img/project--img--lg2.jpg',
        featureImageXl: './assets/img/project--img--xl2.jpg',
        featureAlt: 'Featured Image Alt Text'
      },
      {
        id: 1,
        title: 'Past Work Showcase',
        role: '',
        type: '',
        client: '',
        date: '2010 - 2018',
        desc: 'Maecenas faucibus mollis interdum. Etiam porta sem malesuada magna mollis euismod. Praesent commodo cursus magna, velt.',
        btnLabel: 'View Showcase',
        featureImageSm: './assets/img/project--img--sm1.jpg',
        featureImageMd: './assets/img/project--img--md1.jpg',
        featureImageLg: './assets/img/project--img--lg1.jpg',
        featureImageXl: './assets/img/project--img--xl1.jpg',
        featureAlt: 'Featured Image Alt Text'
      }
    ];
  }
}
