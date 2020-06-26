import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';

import { AppRoutingModule, RoutingComponents } from './app-routing.module';
import { AppComponent } from './app.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { PortfolioService } from './portfolio.service';

// Components
import { HeaderComponent } from './components/header.component';
import { NavComponent } from './components/nav.component';
import { CaseListComponent } from './components/case-list.component';
import { FooterComponent } from './components/footer.component';

// Views
import { HomeComponent } from './components/home.component';
import { AboutComponent } from './components/about.component';
import { CollectionComponent } from './components/collection.component';


@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    NavComponent,
    FooterComponent,
    CaseListComponent,
    RoutingComponents,
    HomeComponent,
    AboutComponent,
    CollectionComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production })
  ],
  providers: [PortfolioService],
  bootstrap: [AppComponent]
})
export class AppModule { }
