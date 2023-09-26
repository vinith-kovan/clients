import { A11yModule } from "@angular/cdk/a11y";
import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";

import { IconButtonModule } from "../icon-button";
import { NavigationModule } from "../navigation";
import { SharedModule } from "../shared";

import { SidebarService } from "./sidebar.service";

@Component({
  selector: "bit-layout",
  templateUrl: "layout.component.html",
  standalone: true,
  imports: [CommonModule, SharedModule, NavigationModule, A11yModule, IconButtonModule],
})
export class LayoutComponent {
  constructor(protected sidebarService: SidebarService) {}

  protected handleKeyDown = (event: KeyboardEvent) => {
    if (this.sidebarService.isOverlay && event.key === "Escape") {
      this.sidebarService.setClose();
      document.getElementById("bit-sidebar-toggle-button").focus();
      return false;
    }

    return true;
  };
}
