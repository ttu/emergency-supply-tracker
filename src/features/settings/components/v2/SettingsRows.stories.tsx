import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  SectionHeader,
  PanelHeader,
  Caption,
  Toggle,
  ToggleRow,
  StepperRow,
  ReadField,
} from './SettingsRows';
import { DesignV2Story } from '@/shared/components/design-v2/storybook';

const wrap = (children: React.ReactNode) => (
  <div style={{ maxWidth: 520, display: 'grid', gap: 14 }}>{children}</div>
);

const meta = {
  title: 'Design V2/Settings/SettingsRows',
  component: SectionHeader,
  args: { code: '§1', title: 'TITLE' },
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <DesignV2Story>
        <Story />
      </DesignV2Story>
    ),
  ],
} satisfies Meta<typeof SectionHeader>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Header: Story = {
  render: () =>
    wrap(<SectionHeader code="§1" title="APPEARANCE" sub="Tweak the look" />),
};

export const PanelHeading: Story = {
  render: () => wrap(<PanelHeader>THEME · §1.1</PanelHeader>),
};

export const Captions: Story = {
  render: () => wrap(<Caption>SECTIONS</Caption>),
};

export const Toggles: Story = {
  render: () =>
    wrap(
      <>
        <Toggle on={false} onChange={() => {}} ariaLabel="Off" />
        <Toggle on={true} onChange={() => {}} ariaLabel="On" />
      </>,
    ),
};

export const ToggleRows: Story = {
  render: () =>
    wrap(
      <>
        <ToggleRow
          label="Notifications"
          hint="Email me"
          on={false}
          onChange={() => {}}
        />
        <ToggleRow
          label="High contrast"
          hint="WCAG AAA"
          on={true}
          onChange={() => {}}
          last
        />
      </>,
    ),
};

export const Steppers: Story = {
  render: () =>
    wrap(
      <>
        <StepperRow label="Adults" value={2} min={1} onChange={() => {}} />
        <StepperRow
          label="Water"
          value={2.5}
          decimals={1}
          suffix="L"
          onChange={() => {}}
          last
        />
      </>,
    ),
};

export const ReadFields: Story = {
  render: () =>
    wrap(
      <>
        <ReadField label="Location" value="Browser" hint="LOCAL" />
        <ReadField
          label="Last sync"
          value="—"
          hint="REFRESH"
          onAction={() => {}}
          last
        />
      </>,
    ),
};
