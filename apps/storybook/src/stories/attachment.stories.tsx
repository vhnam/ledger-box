import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from '@vhnam/ui/components/attachment';
import { Icon } from '@vhnam/ui/components/icon';
import { Spinner } from '@vhnam/ui/components/spinner';

import { sampleAvatarDataUri } from '../fixtures/sample-avatar';

const meta = {
  title: 'Components/Attachment',
  component: Attachment,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    state: {
      control: 'select',
      options: ['idle', 'uploading', 'processing', 'error', 'done'],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'xs'],
    },
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
    },
  },
} satisfies Meta<typeof Attachment>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Attachment className="w-80">
      <AttachmentMedia>
        <Icon name="FilePdfIcon" className="size-5" />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>receipt.pdf</AttachmentTitle>
        <AttachmentDescription>PDF · 245 KB</AttachmentDescription>
      </AttachmentContent>
      <AttachmentActions>
        <AttachmentAction aria-label="Remove receipt.pdf">
          <Icon name="TrashIcon" />
        </AttachmentAction>
      </AttachmentActions>
    </Attachment>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('receipt.pdf')).toBeVisible();
    await expect(canvas.getByText(/245 KB/)).toBeVisible();
  },
};

export const ImagePreview: Story = {
  render: () => (
    <Attachment className="w-80 cursor-pointer">
      <AttachmentMedia variant="image" className="size-12">
        <img src={sampleAvatarDataUri} alt="receipt.png" />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>receipt.png</AttachmentTitle>
        <AttachmentDescription>PNG · 128 KB</AttachmentDescription>
      </AttachmentContent>
      <AttachmentTrigger aria-label="View receipt.png" />
      <AttachmentActions>
        <AttachmentAction aria-label="Remove receipt.png">
          <Icon name="TrashIcon" />
        </AttachmentAction>
      </AttachmentActions>
    </Attachment>
  ),
};

export const UploadIdle: Story = {
  render: () => (
    <Attachment state="idle" className="w-80 flex-col items-center gap-2 px-4 py-6">
      <AttachmentMedia className="size-10 bg-transparent [&_svg]:size-5!">
        <Icon name="UploadSimpleIcon" className="text-muted-foreground" />
      </AttachmentMedia>
      <AttachmentContent className="text-center">
        <AttachmentTitle>Upload files</AttachmentTitle>
        <AttachmentDescription className="whitespace-normal">
          PDF, PNG, JPG, WEBP · multiple files supported
        </AttachmentDescription>
      </AttachmentContent>
      <AttachmentTrigger aria-label="Upload files" />
    </Attachment>
  ),
};

export const Uploading: Story = {
  render: () => (
    <Attachment state="uploading" className="w-80">
      <AttachmentMedia>
        <Spinner className="size-5" />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>invoice.pdf</AttachmentTitle>
        <AttachmentDescription>Uploading...</AttachmentDescription>
      </AttachmentContent>
    </Attachment>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Uploading...')).toBeVisible();
  },
};

export const Processing: Story = {
  render: () => (
    <Attachment state="processing" className="w-80">
      <AttachmentMedia>
        <Spinner className="size-5" />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>invoice.pdf</AttachmentTitle>
        <AttachmentDescription>Optimizing...</AttachmentDescription>
      </AttachmentContent>
    </Attachment>
  ),
};

export const Error: Story = {
  render: () => (
    <Attachment state="error" className="w-80">
      <AttachmentMedia>
        <Icon name="WarningCircleIcon" className="size-5" />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>invoice.pdf</AttachmentTitle>
        <AttachmentDescription>Upload failed</AttachmentDescription>
      </AttachmentContent>
      <AttachmentActions>
        <AttachmentAction aria-label="Remove invoice.pdf">
          <Icon name="TrashIcon" />
        </AttachmentAction>
      </AttachmentActions>
    </Attachment>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Upload failed')).toBeVisible();
  },
};

export const Vertical: Story = {
  render: () => (
    <Attachment orientation="vertical">
      <AttachmentMedia variant="image">
        <img src={sampleAvatarDataUri} alt="receipt.png" />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>receipt.png</AttachmentTitle>
        <AttachmentDescription>PNG · 128 KB</AttachmentDescription>
      </AttachmentContent>
      <AttachmentActions>
        <AttachmentAction aria-label="Remove receipt.png">
          <Icon name="TrashIcon" />
        </AttachmentAction>
      </AttachmentActions>
    </Attachment>
  ),
};

export const Group: Story = {
  render: () => (
    <AttachmentGroup className="max-w-md">
      <Attachment orientation="vertical">
        <AttachmentMedia variant="image">
          <img src={sampleAvatarDataUri} alt="receipt-1.png" />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>receipt-1.png</AttachmentTitle>
          <AttachmentDescription>PNG</AttachmentDescription>
        </AttachmentContent>
      </Attachment>
      <Attachment orientation="vertical">
        <AttachmentMedia>
          <Icon name="FilePdfIcon" className="size-6" />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>invoice.pdf</AttachmentTitle>
          <AttachmentDescription>PDF</AttachmentDescription>
        </AttachmentContent>
      </Attachment>
      <Attachment orientation="vertical">
        <AttachmentMedia variant="image">
          <img src={sampleAvatarDataUri} alt="receipt-2.png" />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>receipt-2.png</AttachmentTitle>
          <AttachmentDescription>PNG</AttachmentDescription>
        </AttachmentContent>
      </Attachment>
    </AttachmentGroup>
  ),
};
