import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";

import { AnonLayoutComponent } from "./anon-layout.component";

@NgModule({
  imports: [RouterModule],
  declarations: [AnonLayoutComponent],
  exports: [AnonLayoutComponent],
})
export class AnonLayoutModule {}
