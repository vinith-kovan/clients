import { NgModule } from "@angular/core";

import { ProgressModule } from "../../../../../../../libs/components/src";
import { SharedModule } from "../../shared.module";

import { OnboardingTaskComponent } from "./onboarding-task.component";
import { OnboardingComponent } from "./onboarding.component";

@NgModule({
  imports: [SharedModule, ProgressModule],
  exports: [OnboardingComponent, OnboardingTaskComponent],
  declarations: [OnboardingComponent, OnboardingTaskComponent],
})
export class OnboardingModule {}
