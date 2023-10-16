import { Component, Input } from "@angular/core";

import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";

import { IconModule } from "../../../components/src/icon";

import { BitwardenLogo } from "./bitwarden-logo";

@Component({
  standalone: true,
  selector: "auth-anon-layout",
  templateUrl: "./anon-layout.component.html",
  imports: [IconModule],
})
export class AnonLayoutComponent {
  @Input()
  title: string;

  logo = BitwardenLogo;
  version: string;
  year = "2023";

  constructor(private platformUtilsService: PlatformUtilsService) {}

  async ngOnInit() {
    this.year = new Date().getFullYear().toString();
    this.version = await this.platformUtilsService.getApplicationVersion();
  }
}
