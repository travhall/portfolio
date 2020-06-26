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
        title: 'Title Six',
        role: 'Role',
        type: 'Project Type',
        client: 'Client',
        date: '2020',
        desc: 'Description Text',
        featured: true,
        featureImage: './assets/img/project--img.jpg',
        featureAlt: 'Featured Image Alt Text'
      },
      {
        id: 5,
        title: 'Title Five',
        role: 'Role',
        type: 'Project Type',
        client: 'Client',
        date: '2020',
        desc: 'Description Text',
        featured: true,
        featureImage: './assets/img/project--img.jpg',
        featureAlt: 'Featured Image Alt Text'
      },
      {
        id: 4,
        title: 'Title Four',
        role: 'Role',
        type: 'Project Type',
        client: 'Client',
        date: '2020',
        desc: 'Description Text',
        featured: true,
        featureImage: './assets/img/project--img.jpg',
        featureAlt: 'Featured Image Alt Text'
      },
      {
        id: 3,
        title: 'Title Three',
        role: 'Role',
        type: 'Project Type',
        client: 'Client',
        date: '2020',
        desc: 'Description Text',
        featured: true,
        featureImage: './assets/img/project--img.jpg',
        featureAlt: 'Featured Image Alt Text'
      },
      {
        id: 2,
        title: 'Title Two',
        role: 'Role',
        type: 'Project Type',
        client: 'Client',
        date: '2020',
        desc: 'Description Text',
        featured: true,
        featureImage: './assets/img/project--img.jpg',
        featureAlt: 'Featured Image Alt Text'
      },
      {
        id: 1,
        title: 'Title One',
        role: 'Role',
        type: 'Project Type',
        client: 'Client',
        date: '2020',
        desc: 'Description Text',
        featured: true,
        featureImage: './assets/img/project--img.jpg',
        featureAlt: 'Featured Image Alt Text'
      }
    ];
  }
}
