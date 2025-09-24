import { Component, NO_ERRORS_SCHEMA } from "@angular/core";
import { Router } from "@angular/router";
import {
  NativeScriptCommonModule,
  NativeScriptRouterModule,
} from "@nativescript/angular";

@Component({
  selector: "Home",
  templateUrl: "./home.component.html",
  imports: [NativeScriptCommonModule, NativeScriptRouterModule],
  schemas: [NO_ERRORS_SCHEMA],
})
export class HomeComponent {
  goToAbout() {
    console.log("Go to About");
    // this.router.navigate(["/"]);
  }
  goToSettings() {
    console.log("Go to Settings");
    // this.router.navigate(["/settings"]);
  }
}
