import { importProvidersFrom } from "@angular/core";
import { RouterModule } from "@angular/router";
import { Meta, StoryObj, applicationConfig, moduleMetadata } from "@storybook/angular";

import { LoginComponent } from "@bitwarden/angular/auth/components/login.component";

import { AnonLayoutComponent } from "./anon-layout.component";

export default {
  title: "Web/Anon Layout",
  component: AnonLayoutComponent,
  decorators: [
    moduleMetadata({
      imports: [RouterModule],
    }),
    applicationConfig({
      providers: [
        importProvidersFrom(
          RouterModule.forRoot([{ path: "login", component: LoginComponent }], { useHash: true })
        ),
      ],
    }),
  ],
} as Meta;

type Story = StoryObj<AnonLayoutComponent>;

export const Default: Story = {};
