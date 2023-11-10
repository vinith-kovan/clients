import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";

import { JslibModule } from "@bitwarden/angular/jslib.module";

import { OnboardingModule } from "../../../shared/components/onboarding/onboarding.module";

import { VaultOnboardingComponent } from "./vault-onboarding.component";

@NgModule({
  imports: [OnboardingModule, CommonModule, JslibModule],
  declarations: [VaultOnboardingComponent],
  exports: [VaultOnboardingComponent],
})
export class VaultOnboardingModule {}
