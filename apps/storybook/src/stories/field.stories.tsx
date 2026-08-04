import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from '@vhnam/ui/components/field';
import { Input } from '@vhnam/ui/components/input';

const meta = {
  title: 'Components/Field',
  component: Field,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    orientation: {
      control: 'select',
      options: ['vertical', 'horizontal', 'responsive'],
    },
  },
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="w-80">
      <Field {...args}>
        <FieldLabel htmlFor="name">Name</FieldLabel>
        <Input id="name" placeholder="Jane Doe" />
        <FieldDescription>Your full legal name.</FieldDescription>
      </Field>
    </div>
  ),
};

export const WithError: Story = {
  render: (args) => (
    <div className="w-80">
      <Field {...args} data-invalid="true">
        <FieldLabel htmlFor="email">Email</FieldLabel>
        <Input id="email" aria-invalid defaultValue="not-an-email" />
        <FieldError errors={[{ message: 'Enter a valid email address.' }]} />
      </Field>
    </div>
  ),
};

export const WithMultipleErrors: Story = {
  render: (args) => (
    <div className="w-80">
      <Field {...args} data-invalid="true">
        <FieldLabel htmlFor="password">Password</FieldLabel>
        <Input id="password" aria-invalid type="password" />
        <FieldError
          errors={[
            { message: 'Must be at least 8 characters.' },
            { message: 'Must contain a number.' },
            { message: 'Must contain a number.' },
          ]}
        />
      </Field>
    </div>
  ),
};

export const ErrorWithChildren: Story = {
  render: (args) => (
    <div className="w-80">
      <Field {...args} data-invalid="true">
        <FieldLabel htmlFor="code">Code</FieldLabel>
        <Input id="code" aria-invalid />
        <FieldError>Custom error content.</FieldError>
      </Field>
    </div>
  ),
};

export const NoVisibleError: Story = {
  render: (args) => (
    <div className="w-80">
      <Field {...args}>
        <FieldLabel htmlFor="username">Username</FieldLabel>
        <Input id="username" />
        <FieldError errors={[]} />
      </Field>
    </div>
  ),
};

export const Responsive: Story = {
  render: (args) => (
    <div className="w-96">
      <Field {...args} orientation="responsive">
        <FieldContent>
          <FieldTitle>Marketing emails</FieldTitle>
          <FieldDescription>Get product updates and offers.</FieldDescription>
        </FieldContent>
      </Field>
    </div>
  ),
};

export const Horizontal: Story = {
  render: (args) => (
    <div className="w-96">
      <Field {...args} orientation="horizontal">
        <FieldContent>
          <FieldTitle>Notifications</FieldTitle>
          <FieldDescription>Receive updates via email.</FieldDescription>
        </FieldContent>
      </Field>
    </div>
  ),
};

export const Group: Story = {
  render: () => (
    <div className="w-80">
      <FieldSet>
        <FieldLegend>Contact information</FieldLegend>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="first-name">First name</FieldLabel>
            <Input id="first-name" placeholder="Jane" />
          </Field>
          <FieldSeparator>or</FieldSeparator>
          <Field>
            <FieldLabel htmlFor="last-name">Last name</FieldLabel>
            <Input id="last-name" placeholder="Doe" />
          </Field>
        </FieldGroup>
      </FieldSet>
    </div>
  ),
};
