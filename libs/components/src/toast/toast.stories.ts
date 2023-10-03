import { Meta, StoryObj, moduleMetadata } from "@storybook/angular";

import { BitToastComponent } from "./toast.component";

export default {
  title: "Component Library/Toast",
  component: BitToastComponent,
  decorators: [
    moduleMetadata({
      imports: [],
    }),
  ],
} as Meta;

type Story = StoryObj<BitToastComponent>;

export const Default: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div class="tw-flex tw-flex-col tw-gap-4">
        <bit-toast title="Success" text="Hello world!" progressBarWidth="50" type="success"></bit-toast>
        <bit-toast title="Info" text="Hello world!" progressBarWidth="50" type="info"></bit-toast>
        <bit-toast title="Warning" text="Hello world!" progressBarWidth="50" type="warning"></bit-toast>
        <bit-toast title="Error" text="Hello world!" progressBarWidth="50" type="error"></bit-toast>
      </div>
    `,
  }),
};

export const Long: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div class="tw-flex tw-flex-col tw-gap-4">
        <bit-toast title="Success" text="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum." progressBarWidth="50" type="success"></bit-toast>
        <bit-toast title="Info" text="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum." progressBarWidth="50" type="info"></bit-toast>
        <bit-toast title="Warning" text="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum." progressBarWidth="50" type="warning"></bit-toast>
        <bit-toast title="Error" text="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum." progressBarWidth="50" type="error"></bit-toast>
      </div>
    `,
  }),
};
