import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HomeComponent } from './components/home.component';
import { CaseDetailComponent } from './components/case-detail.component';
import { NotFoundComponent } from './components/not-found.component';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    data: {
      state: 'Home'
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
  CaseDetailComponent,
  NotFoundComponent
];
