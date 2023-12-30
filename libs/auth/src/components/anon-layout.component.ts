import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";

import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";

import { Icon, IconModule } from "../../../components/src/icon";

import { BitwardenLogo } from "./bitwarden-logo";
import { IconLock } from "./icon-lock";

type IconType = "lock";

@Component({
  standalone: true,
  selector: "auth-anon-layout",
  templateUrl: "./anon-layout.component.html",
  imports: [IconModule, CommonModule],
})
export class AnonLayoutComponent {
  @Input() title: string;
  @Input() subTitle: string;
  @Input() icon: IconType;

  logo = BitwardenLogo;
  iconType: Icon | null;
  version: string;
  year = "2023";

  constructor(private platformUtilsService: PlatformUtilsService) {}

  async ngOnInit() {
    switch (this.icon) {
      case "lock":
        this.iconType = IconLock;
        break;
      default:
        this.iconType = null;
    }

    this.year = new Date().getFullYear().toString();
    this.version = await this.platformUtilsService.getApplicationVersion();
  }
}
