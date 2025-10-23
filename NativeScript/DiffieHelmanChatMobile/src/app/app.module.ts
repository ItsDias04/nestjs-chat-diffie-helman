import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core'
import { NativeScriptFormsModule, NativeScriptModule } from '@nativescript/angular'
import { NativeScriptUISideDrawerModule } from 'nativescript-ui-sidedrawer/angular'

import { AppRoutingModule } from './app-routing.module'
import { AppComponent } from './app.component'
import { provideHttpClient, withInterceptors } from '@angular/common/http'
import { authTokenInterceptor } from './data/auth/auth.interceptor'
@NgModule({
  bootstrap: [AppComponent],
  imports: [AppRoutingModule, NativeScriptModule, NativeScriptUISideDrawerModule],
  declarations: [AppComponent],
  schemas: [NO_ERRORS_SCHEMA],
  // providers: [ { provide: HTTP_INTERCEPTORS, useClass:  authTokenInterceptor, multi: true }],
  providers: [provideHttpClient(withInterceptors([authTokenInterceptor]))]
})
export class AppModule {}
