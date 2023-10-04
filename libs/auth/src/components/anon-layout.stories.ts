import { Meta, StoryObj, componentWrapperDecorator, moduleMetadata } from "@storybook/angular";

import { AnonLayoutComponent } from "./anon-layout.component";

export default {
  title: "Web/Anon Layout",
  component: AnonLayoutComponent,
  decorators: [
    componentWrapperDecorator(
      /**
       * Applying a CSS transform makes a `position: fixed` element act like it is `position: relative`
       * https://github.com/storybookjs/storybook/issues/8011#issue-490251969
       */
      (story) => /* HTML */ `<div class="tw-scale-100 tw-border-2 tw-border-solid tw-border-[red]">
        ${story}
      </div>`
    ),
    moduleMetadata({
      imports: [],
      declarations: [],
    }),
  ],
} as Meta;

type Story = StoryObj<AnonLayoutComponent>;

export const Empty: Story = {
  render: (args) => ({
    props: args,
    template: /* HTML */ `<anon-layout></anon-layout>`,
  }),
};

export const WithContent: Story = {
  render: (args) => ({
    props: args,
    template: /* HTML */ `
      <anon-layout>
        <div
          class="tw-flex tw-h-96 tw-w-96 tw-flex-col tw-items-center tw-justify-center tw-bg-secondary-100"
        >
          Content
        </div>
      </anon-layout>
    `,
  }),
};
