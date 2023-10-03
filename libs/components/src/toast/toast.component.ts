import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output } from "@angular/core";

import { IconButtonModule } from "../icon-button";

export type BitToastType = "success" | "error" | "info" | "warning";

export type BitToastConfig = {
  type: BitToastType;
  title: string;
  text: string;
};

const variants: Record<BitToastType, { icon: string; bgColor: string }> = {
  success: {
    icon: "bwi-check",
    bgColor: "tw-bg-success-500",
  },
  error: {
    icon: "bwi-error",
    bgColor: "tw-bg-danger-500",
  },
  info: {
    icon: "bwi-info-circle",
    bgColor: "tw-bg-secondary-500",
  },
  warning: {
    icon: "bwi-exclamation-triangle",
    bgColor: "tw-bg-warning-500",
  },
};

@Component({
  selector: "bit-toast",
  templateUrl: "toast.component.html",
  standalone: true,
  imports: [CommonModule, IconButtonModule],
})
export class BitToastComponent {
  @Input() type: BitToastType = "info";

  @Input() text: string;

  @Input() title: string;

  /**
   * Percent width of the progress bar
   **/
  @Input() progressBarWidth = 0;

  @Output() onClose = new EventEmitter<void>();

  protected get iconClass(): string {
    return variants[this.type].icon;
  }

  protected get bgColor(): string {
    return variants[this.type].bgColor;
  }
}
