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

export const Default: Story = {
  render: (args) => ({
    props: args,
    template: /* HTML */ `
      <anon-layout title="Page Title">
        <div class="tw-flex tw-flex-col tw-gap-4 tw-bg-secondary-100 tw-p-6">
          <div>
            Lorem ipsum dolor sit, amet consectetur adipisicing elit. Nam explicabo, beatae saepe
            odit, omnis optio molestias voluptate accusantium reprehenderit illo quas distinctio
            nostrum similique iusto animi. Est possimus soluta animi!
          </div>
          <div>
            Lorem ipsum dolor sit, amet consectetur adipisicing elit. Nam explicabo, beatae saepe
            odit, omnis optio molestias voluptate accusantium reprehenderit illo quas distinctio
            nostrum similique iusto animi. Est possimus soluta animi!
          </div>
          <div>
            Lorem ipsum dolor sit, amet consectetur adipisicing elit. Nam explicabo, beatae saepe
            odit, omnis optio molestias voluptate accusantium reprehenderit illo quas distinctio
            nostrum similique iusto animi. Est possimus soluta animi!
          </div>
        </div>
      </anon-layout>
    `,
  }),
};
