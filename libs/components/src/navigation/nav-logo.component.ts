import { Component, Input } from "@angular/core";

import { Icon } from "../icon";
import { SidebarService } from "../layout/sidebar.service";

@Component({
  selector: "bit-nav-logo",
  templateUrl: "./nav-logo.component.html",
})
export class NavLogoComponent {
  /** Icon that is displayed when the side nav is closed */
  @Input() closedIcon = "bwi-shield";

  /** Icon that is displayed when the side nav is open */
  @Input() openIcon: Icon;

  /**
   * Route to be passed to internal `routerLink`
   */
  @Input() route: string | any[];

  constructor(protected sidebarService: SidebarService) {}
}
