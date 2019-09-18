import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

// import { HomeComponent } from './views/home.component';
import { CaseListComponent } from './components/case-list.component';
import { CaseComponent } from './components/case.component';
import { NotFoundComponent } from './components/not-found.component';

const routes: Routes = [
  {
    path: '',
    component: CaseListComponent,
    data: {
      state: 'Home'
    }
  },
  {
    path: 'case/:id',
    component: CaseComponent,
    data: {
      state: 'Case'
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
      scrollPositionRestoration: 'top',
      enableTracing: true
    }
  )],
  exports: [RouterModule]
})
export class AppRoutingModule { }

export const RoutingComponents = [
  CaseListComponent,
  CaseComponent,
  NotFoundComponent
];
