import { describe, it, expect } from 'vitest';
import { offerableTemplates } from './offerableTemplates';
import { createProductTemplateId } from '@/shared/types';

const template = (id: string, category: string) => ({
  id: createProductTemplateId(id),
  category,
});

const WATER = 'water-beverages';
const COMMS = 'communication-info';

describe('offerableTemplates', () => {
  const all = [
    template('bottled-water', WATER),
    template('battery-radio', COMMS),
    template('hand-crank-radio', COMMS),
  ];

  it('keeps everything when nothing is switched off', () => {
    expect(offerableTemplates(all, [], [WATER, COMMS])).toHaveLength(3);
  });

  it('drops a product the household has turned off', () => {
    const offered = offerableTemplates(
      all,
      [createProductTemplateId('hand-crank-radio')],
      [WATER, COMMS],
    );
    expect(offered.map((tpl) => String(tpl.id))).toEqual([
      'bottled-water',
      'battery-radio',
    ]);
  });

  it('drops every product of a category the household has turned off', () => {
    // A disabled category is excluded from the dashboard and from the
    // coverage maths, so offering its products to add is a dead end.
    const offered = offerableTemplates(all, [], [WATER]);
    expect(offered.map((tpl) => String(tpl.id))).toEqual(['bottled-water']);
  });

  it('keeps products of custom categories, which are never disabled', () => {
    const custom = template('firewood', 'cat-custom-heating');
    const offered = offerableTemplates(
      [...all, custom],
      [],
      [WATER, 'cat-custom-heating'],
    );
    expect(offered.map((tpl) => String(tpl.id))).toContain('firewood');
  });
});
