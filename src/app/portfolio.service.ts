import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PortfolioService {

  constructor() { }

  getCase() {
    return [
      {
        id: '4',
        title: 'Enhancing Site Search',
        role: 'UX Research, UX Design',
        type: 'Feature Enhancement',
        client: 'Arrow Electronics',
        date: '2019',
        tools: '',
        desc: '',
        featured: true,
        featureImage: '',
        featureAlt: ''
      },
      {
        id: '3',
        title: 'Not a Robot',
        role: 'Art Direction, Identity Design, UX Design, Theme Development',
        type: 'Brand Identity & Front End Development',
        client: 'Jamie Alberico: SEO Specialist',
        date: '2019',
        tools: '',
        desc: '',
        featured: true,
        featureImage: '',
        featureAlt: ''
      },
      {
        id: '2',
        title: 'Jane Rae',
        role: 'Art Direction, Identity Design, UX Design, Theme Development',
        type: 'Brand Identity & Front End Development',
        client: 'Jane Rae Interiors',
        date: '2019',
        tools: '',
        desc: '',
        featured: true,
        featureImage: '',
        featureAlt: ''
      },
      {
        id: '1',
        title: 'Past Development Projects',
        role: '',
        type: '',
        client: '',
        date: '2019',
        tools: '',
        desc: '',
        featured: true,
        featureImage: '',
        featureAlt: ''
      }
    ];
  }
}
