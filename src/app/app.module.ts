import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';

import { AppRoutingModule, RoutingComponents } from './app-routing.module';
import { AppComponent } from './app.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { PortfolioService } from './portfolio.service';

// Components
// import { HeaderComponent } from './components/header.component';
import { NavComponent } from './components/nav.component';
import { FooterComponent } from './components/footer.component';

@NgModule({
  declarations: [
    AppComponent,
    // HeaderComponent,
    NavComponent,
    FooterComponent,
    RoutingComponents
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
