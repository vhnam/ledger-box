import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming/create';

const brandStyles = document.createElement('style');
brandStyles.textContent = `
  .sidebar-header img {
    display: block;
    width: auto;
    max-width: 168px !important;
    max-height: 28px !important;
  }
`;
document.head.appendChild(brandStyles);

addons.setConfig({
  theme: create({
    base: 'dark',
    brandTitle: 'Ledger Box',
    brandImage: '/brand.svg',
    brandTarget: '_self',
  }),
});
