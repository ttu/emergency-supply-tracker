import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tooltip } from './Tooltip';
import { Button } from './Button';

const meta = {
  title: 'Common/Tooltip',
  component: Tooltip,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Top: Story = {
  args: {
    content: 'This is a helpful tooltip',
    position: 'top',
    children: <Button variant="primary">Hover me (top)</Button>,
  },
};

export const Bottom: Story = {
  args: {
    content: 'This tooltip appears below',
    position: 'bottom',
    children: <Button variant="primary">Hover me (bottom)</Button>,
  },
};

export const Left: Story = {
  args: {
    content: 'This tooltip appears on the left',
    position: 'left',
    children: <Button variant="primary">Hover me (left)</Button>,
  },
};

export const Right: Story = {
  args: {
    content: 'This tooltip appears on the right',
    position: 'right',
    children: <Button variant="primary">Hover me (right)</Button>,
  },
};

export const LongContent: Story = {
  args: {
    content:
      'This is a longer tooltip with more content. It will wrap to multiple lines but has a max-width to keep it readable.',
    position: 'top',
    children: <Button variant="primary">Hover for long tooltip</Button>,
  },
};

export const CustomDelay: Story = {
  args: {
    content: 'This tooltip appears after 500ms delay',
    position: 'top',
    delay: 500,
    children: <Button variant="primary">Hover me (delayed)</Button>,
  },
};

export const WithTextSpan: Story = {
  args: {
    content: 'Additional information about this term',
    position: 'top',
    children: (
      <span style={{ textDecoration: 'underline dotted' }}>
        Hover this text
      </span>
    ),
  },
};

export const AllPositions = () => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '2rem',
      padding: '4rem',
    }}
  >
    <Tooltip content="Top tooltip" position="top">
      <Button variant="primary">Top</Button>
    </Tooltip>
    <Tooltip content="Bottom tooltip" position="bottom">
      <Button variant="primary">Bottom</Button>
    </Tooltip>
    <Tooltip content="Left tooltip" position="left">
      <Button variant="primary">Left</Button>
    </Tooltip>
    <Tooltip content="Right tooltip" position="right">
      <Button variant="primary">Right</Button>
    </Tooltip>
  </div>
);
