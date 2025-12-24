import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';

const meta = {
  title: 'Components/Common/Modal',
  component: Modal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

function ModalWrapper({
  title,
  children,
  size,
}: {
  title?: string;
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={title}
        size={size}
      >
        {children}
      </Modal>
    </>
  );
}

export const Default: Story = {
  render: () => (
    <ModalWrapper title="Default Modal">
      <p>This is a basic modal with some content inside.</p>
      <p>Click the × button, press ESC, or click outside to close.</p>
    </ModalWrapper>
  ),
};

export const WithoutTitle: Story = {
  render: () => (
    <ModalWrapper>
      <h3>Custom Content</h3>
      <p>
        This modal has no title prop, but you can add your own heading in the
        content.
      </p>
    </ModalWrapper>
  ),
};

export const SmallSize: Story = {
  render: () => (
    <ModalWrapper title="Small Modal" size="small">
      <p>This is a small modal, perfect for simple confirmations or alerts.</p>
    </ModalWrapper>
  ),
};

export const MediumSize: Story = {
  render: () => (
    <ModalWrapper title="Medium Modal" size="medium">
      <p>
        This is a medium modal (default size), suitable for forms and detailed
        content.
      </p>
      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
    </ModalWrapper>
  ),
};

export const LargeSize: Story = {
  render: () => (
    <ModalWrapper title="Large Modal" size="large">
      <p>
        This is a large modal, ideal for complex forms or extensive content.
      </p>
      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
      <p>Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
    </ModalWrapper>
  ),
};

export const WithForm: Story = {
  render: () => (
    <ModalWrapper title="Add New Item">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          alert('Form submitted!');
        }}
      >
        <Input
          label="Item Name"
          placeholder="Enter item name"
          required
          fullWidth
        />
        <br />
        <Input
          type="number"
          label="Quantity"
          placeholder="Enter quantity"
          required
          fullWidth
        />
        <br />
        <div
          style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}
        >
          <Button type="button" variant="secondary">
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Add Item
          </Button>
        </div>
      </form>
    </ModalWrapper>
  ),
};

export const WithLongContent: Story = {
  render: () => (
    <ModalWrapper title="Scrollable Content">
      <p>This modal has a lot of content that will scroll.</p>
      {Array.from({ length: 20 }).map((_, i) => (
        <p key={i}>
          Paragraph {i + 1}: Lorem ipsum dolor sit amet, consectetur adipiscing
          elit. Sed do eiusmod tempor incididunt ut labore et dolore magna
          aliqua.
        </p>
      ))}
    </ModalWrapper>
  ),
};

export const ConfirmationDialog: Story = {
  render: () => (
    <ModalWrapper title="Confirm Deletion" size="small">
      <p>
        Are you sure you want to delete this item? This action cannot be undone.
      </p>
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'flex-end',
          marginTop: '1rem',
        }}
      >
        <Button variant="secondary">Cancel</Button>
        <Button variant="danger">Delete</Button>
      </div>
    </ModalWrapper>
  ),
};
