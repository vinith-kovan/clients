import { animate, state, style, transition, trigger } from "@angular/animations";
import { CommonModule } from "@angular/common";
import { Component, ModuleWithProviders, NgModule } from "@angular/core";
import {
  DefaultNoComponentGlobalConfig,
  GlobalConfig,
  Toast as BaseToast,
  ToastPackage,
  ToastrService,
  TOAST_CONFIG,
} from "ngx-toastr";

import { BitToastComponent } from "@bitwarden/components";

@Component({
  selector: "[toast-component2]",
  template: `
    <bit-toast
      [title]="title"
      [type]="options?.payload?.type || 'info'"
      [text]="message"
      [progressBarWidth]="width"
      (onClose)="remove()"
    ></bit-toast>
  `,
  animations: [
    trigger("flyInOut", [
      state("inactive", style({ opacity: 0 })),
      state("active", style({ opacity: 1 })),
      state("removed", style({ opacity: 0 })),
      transition("inactive => active", animate("{{ easeTime }}ms {{ easing }}")),
      transition("active => removed", animate("{{ easeTime }}ms {{ easing }}")),
    ]),
  ],
  preserveWhitespaces: false,
})
export class BitwardenToast extends BaseToast {
  constructor(protected toastrService: ToastrService, public toastPackage: ToastPackage) {
    super(toastrService, toastPackage);
  }
}

export const BitwardenToastGlobalConfig: GlobalConfig = {
  ...DefaultNoComponentGlobalConfig,
  toastComponent: BitwardenToast,
  tapToDismiss: false,
  progressBar: true,
  extendedTimeOut: 2000,
};

@NgModule({
  imports: [CommonModule, BitToastComponent],
  declarations: [BitwardenToast],
  exports: [BitwardenToast],
})
export class BitwardenToastModule {
  static forRoot(config: Partial<GlobalConfig> = {}): ModuleWithProviders<BitwardenToastModule> {
    return {
      ngModule: BitwardenToastModule,
      providers: [
        {
          provide: TOAST_CONFIG,
          useValue: {
            default: BitwardenToastGlobalConfig,
            config: config,
          },
        },
      ],
    };
  }
}
