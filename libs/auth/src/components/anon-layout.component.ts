import { Component, Input } from "@angular/core";

import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";

@Component({
  standalone: true,
  selector: "anon-layout",
  templateUrl: "./anon-layout.component.html",
  styleUrls: ["./anon-layout.component.css"],
})
export class AnonLayoutComponent {
  @Input()
  title: string;

  version: string;
  year = "2023";

  constructor(private platformUtilsService: PlatformUtilsService) {}

  async ngOnInit() {
    this.year = new Date().getFullYear().toString();
    this.version = await this.platformUtilsService.getApplicationVersion();
  }
}
