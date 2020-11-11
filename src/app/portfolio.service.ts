import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PortfolioService {

  constructor() { }

  getCase() {
    return [
      {
        // Case Overview
        id: 5,
        title: 'Arrow Global Information Architecture',
        role: 'UX Lead',
        type: 'UX Research, Information Architecture',
        client: 'Arrow Electronics',
        date: '2020',
        desc: 'Maecenas faucibus mollis interdum. Etiam porta sem malesuada magna mollis euismod. Praesent commodo cursus magna, velt.',
        btnLabel: 'Read Case Study',
        featureImage: './assets/img/project--img.jpg',
        featureAlt: 'Featured Image Alt Text',
      },
      {
        // Case Overview
        id: 4,
        title: 'Arrow Design System',
        role: 'UX Lead',
        type: 'UI & Accessibility Design',
        client: 'Arrow Electronics',
        date: '2020',
        desc: 'Maecenas faucibus mollis interdum. Etiam porta sem malesuada magna mollis euismod. Praesent commodo cursus magna, velt.',
        btnLabel: 'Read Case Study',
        featureImage: './assets/img/project--img.jpg',
        featureAlt: 'Featured Image Alt Text',
      },
      {
        // Case Overview
        id: 3,
        title: 'Not a Robot',
        role: 'UX, Visual Designer & WordPress Developer',
        type: 'Branding & Microsite',
        client: 'Jamie Alberico',
        date: '2020',
        desc: 'Maecenas faucibus mollis interdum. Etiam porta sem malesuada magna mollis euismod. Praesent commodo cursus magna, velt.',
        btnLabel: 'Read Case Study',
        featureImage: './assets/img/project--img.jpg',
        featureAlt: 'Featured Image Alt Text',
      },
      {
        // Case Overview
        id: 2,
        title: 'Blossom Grow Light App',
        role: 'UX & Visual Design',
        type: 'App Design',
        client: 'Blossom LED',
        date: '2020',
        desc: 'Maecenas faucibus mollis interdum. Etiam porta sem malesuada magna mollis euismod. Praesent commodo cursus magna, velt.',
        btnLabel: 'Read Case Study',
        featureImage: './assets/img/project--img.jpg',
        featureAlt: 'Featured Image Alt Text',
      },
      {
        // Case Overview
        id: 1,
        title: 'Past Work Showcase',
        role: '',
        type: '',
        client: '',
        date: '2010 - 2018',
        desc: 'Maecenas faucibus mollis interdum. Etiam porta sem malesuada magna mollis euismod. Praesent commodo cursus magna, velt.',
        btnLabel: 'View Showcase',
        featureImage: '',
        featureAlt: 'Featured Image Alt Text',
        caseItem: [
          {
            isPublic: true,
            class: 'centered',
            heading: 'Centered Case Block',
            subhead: 'Fermentum Pharetra Justo',
            bodyCopy: 'Maecenas faucibus mollis interdum. Etiam porta sem malesuada magna mollis euismod.',
            hasImage: true,
            imagePath: 'past_projects/caseImage.svg',
            imageClass: 'centered',
            altText: 'Alt text',
            link: 'link',
            linkUrl: 'http://www.google.com',
            linkTarget: '_blank',
          },
          {
            isPublic: true,
            class: 'left',
            heading: 'Left Case Block',
            subhead: 'Block subhead',
            bodyCopy: 'Maecenas faucibus mollis interdum. Etiam porta sem malesuada magna mollis euismod.',
            hasImage: true,
            imagePath: 'past_projects/test.png',
            imageClass: 'full',
            altText: 'Alt text',
            link: 'link',
            linkUrl: 'http://www.google.com',
            linkTarget: '_blank',
          },
          {
            isPublic: true,
            class: 'right',
            heading: 'Right Case Block',
            subhead: 'Block subhead',
            bodyCopy: 'Maecenas faucibus mollis interdum. Etiam porta sem malesuada magna mollis euismod.',
            hasImage: true,
            imagePath: 'past_projects/test.png',
            imageClass: 'full',
            altText: 'Alt text',
            link: 'link',
            linkUrl: 'http://www.google.com',
            linkTarget: '_blank',
          },
        ],
      }
    ];
  }
}
