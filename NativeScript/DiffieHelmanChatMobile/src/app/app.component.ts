import { Component, OnInit } from '@angular/core'
import { NavigationEnd, Router } from '@angular/router'
import { RouterExtensions } from '@nativescript/angular'
import {
  DrawerTransitionBase,
  RadSideDrawer,
  SlideInOnTopTransition,
} from 'nativescript-ui-sidedrawer'
import { filter } from 'rxjs/operators'
import { Application } from '@nativescript/core'
import { AuthService } from './data/auth/auth.service'

@Component({
  selector: 'ns-app',
  templateUrl: 'app.component.html',
})
export class AppComponent implements OnInit {
  private _activatedUrl: string
  private _sideDrawerTransition: DrawerTransitionBase

  constructor(private router: Router, private routerExtensions: RouterExtensions, private authService: AuthService) {
    // Use the component constructor to inject services.
    console.log('AppComponent constructor')
  }

  ngOnInit(): void {
    console.log('AppComponent initialized', this.authService.isAuth)
    this._sideDrawerTransition = new SlideInOnTopTransition()

    // Navigate to login when not authenticated, otherwise go to home.
    // Previously code only set a variable — that doesn't trigger route change.
    if (this.authService.isAuth) {
      this._activatedUrl = '/home'
      // navigate to home if not already there
      this.routerExtensions.navigate(['/home'], { clearHistory: false }).catch((e) => console.error(e))
    } else {
      this._activatedUrl = '/login'
      // force navigation to login (clear history so back-stack doesn't return to protected pages)
      this.routerExtensions.navigate(['/login'], { clearHistory: true }).catch((e) => console.error(e))
    }

    this.router.events
      .pipe(filter((event: any) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => (this._activatedUrl = event.urlAfterRedirects))
  }

  get sideDrawerTransition(): DrawerTransitionBase {
    return this._sideDrawerTransition
  }

  isComponentSelected(url: string): boolean {
    return this._activatedUrl === url
  }

  onNavItemTap(navItemRoute: string): void {
    this.routerExtensions.navigate([navItemRoute], {
      transition: {
        name: 'fade',
      },
    })

    const sideDrawer = <RadSideDrawer>Application.getRootView()
    sideDrawer.closeDrawer()
  }
}
