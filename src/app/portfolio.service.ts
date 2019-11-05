import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PortfolioService {

  constructor() { }

  getCase() {
    return [
      {
        id: 4,
        title: 'Advanced Part Search',
        role: 'UX Research, UX Design',
        type: 'Feature Enhancement',
        client: 'Arrow Electronics',
        date: '2019',
        desc: '',
        featured: true,
        featureImage: './assets/img/project--img4.jpg',
        featureAlt: 'Featured Image Alt Text'
      },
      {
        id: 3,
        title: 'Not a Robot',
        role: 'Art Direction, Identity Design, UX Design, Theme Development',
        type: 'Brand Identity & Front End Development',
        client: 'Jamie Alberico: SEO Specialist',
        date: '2019',
        desc: '',
        featured: true,
        featureImage: './assets/img/project--img3.jpg',
        featureAlt: 'Featured Image Alt Text'
      },
      {
        id: 2,
        title: 'Jane Rae Interiors',
        role: 'Art Direction, Identity Design, UX Design, Theme Development',
        type: 'Brand Identity & Front End Development',
        client: 'Jane Rae Interiors',
        date: '2019',
        desc: '',
        featured: true,
        featureImage: './assets/img/project--img2.jpg',
        featureAlt: 'Featured Image Alt Text'
      },
      {
        id: 1,
        title: 'Past Projects',
        role: '',
        type: '',
        client: '',
        date: '2010-2018',
        desc: '',
        featured: true,
        featureImage: './assets/img/project--img1.jpg',
        featureAlt: 'Featured Image Alt Text'
      }
    ];
  }
}
