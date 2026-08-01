import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { renderToStaticMarkup } from 'react-dom/server';

import {
  renderWalletInviteEmail,
  WalletInviteEmailBody,
} from '../netlify/functions/lib/email-templates/wallet-invite-email.tsx';

function main(): void {
  const fixture = {
    inviterName: 'Alice Nguyen',
    inviterEmail: 'alice@example.com',
    walletName: 'Family Fund',
    role: 'manager' as const,
    acceptUrl: 'https://ledgerbox.example/invite/preview-token',
  };

  const { subject, text } = renderWalletInviteEmail(fixture);
  const html = renderToStaticMarkup(<WalletInviteEmailBody {...fixture} />);

  const outputPath = join(tmpdir(), 'ledger-box-email-preview.html');
  writeFileSync(outputPath, html);

  console.log(`Subject: ${subject}\n`);
  console.log('Text body:\n');
  console.log(text);
  console.log(`\nHTML written to: ${outputPath}`);
}

main();
