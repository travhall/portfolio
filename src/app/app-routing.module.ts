import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HomeComponent } from './components/home.component';
import { AboutComponent } from './components/about.component';
import { CollectionComponent } from './components/collection.component';
import { ContactComponent } from './components/contact.component';
import { CaseDetailComponent } from './components/case-detail.component';
import { NotFoundComponent } from './components/not-found.component';
// import { from } from 'rxjs';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    data: {
      state: 'home'
    }
  },
  {
    path: 'about',
    component: AboutComponent,
    data: {
      state: 'about'
    }
  },
  {
    path: 'collection',
    component: CollectionComponent,
    data: {
      state: 'collection'
    }
  },
  {
    path: 'contact',
    component: ContactComponent,
    data: {
      state: 'contact'
    }
  },
  {
    path: 'case/:id',
    component: CaseDetailComponent,
    data: {
      state: 'Case Study'
    }
  },
  {
    path: '**',
    component: NotFoundComponent,
    data: {
      state: '404'
    }
  }
];

@NgModule({
  imports: [RouterModule.forRoot(
    routes,
    {
      scrollPositionRestoration: 'enabled',
      // enableTracing: true
    }
  )],
  exports: [RouterModule]
})
export class AppRoutingModule { }

export const RoutingComponents = [
  HomeComponent,
  AboutComponent,
  CollectionComponent,
  ContactComponent,
  CaseDetailComponent,
  NotFoundComponent
];
