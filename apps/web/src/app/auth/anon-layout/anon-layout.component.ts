import { Component } from "@angular/core";

// import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";

@Component({
  selector: "app-anon-layout",
  templateUrl: "./anon-layout.component.html",
})
export class AnonLayoutComponent {
  version = "2023.1.1";
  year = "2023";
  title = "Title Placeholder";

  // constructor(private platformUtilsService: PlatformUtilsService) {}

  // async ngOnInit() {
  //   this.year = new Date().getFullYear().toString();
  //   this.version = await this.platformUtilsService.getApplicationVersion();
  // }
}
