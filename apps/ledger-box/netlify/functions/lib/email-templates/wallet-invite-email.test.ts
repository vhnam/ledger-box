import { describe, expect, it } from 'vite-plus/test';

import { renderWalletInviteEmail } from './wallet-invite-email.tsx';

describe('renderWalletInviteEmail', () => {
  it('renders subject, html, and text for a named inviter', () => {
    const result = renderWalletInviteEmail({
      inviterName: 'Alice Nguyen',
      inviterEmail: 'alice@example.com',
      walletName: 'Family Fund',
      role: 'manager',
      acceptUrl: 'https://ledgerbox.example/invite/token123',
    });

    expect(result.subject).toBe('Alice Nguyen invited you to Family Fund on Ledger Box');
    expect(result.html).toBe(
      '<table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style="background-color:#f4f4f5"><tbody><tr><td align="center" style="padding:24px 16px"><table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style="max-width:480px;background-color:#ffffff;font-family:Arial, Helvetica, sans-serif;font-size:14px;line-height:1.5;color:#18181b"><tbody><tr><td style="padding:24px"><p style="margin:0 0 16px">Alice Nguyen (alice@example.com) invited you to the &quot;Family Fund&quot; wallet on Ledger Box as a <strong>Manager</strong>.</p><p style="margin:0 0 16px">Full access: add, edit, delete transactions and invite others.</p><p style="margin:0 0 16px"><a href="https://ledgerbox.example/invite/token123">Accept the invite</a></p><p style="margin:0 0 16px;margin-bottom:0">If you weren&#x27;t expecting this invite, you can ignore this email.</p></td></tr></tbody></table></td></tr></tbody></table>',
    );
    expect(result.text).toBe(
      [
        'Alice Nguyen (alice@example.com) invited you to the "Family Fund" wallet on Ledger Box as a Manager.',
        'Full access: add, edit, delete transactions and invite others.',
        'Accept the invite: https://ledgerbox.example/invite/token123',
        "If you weren't expecting this invite, you can ignore this email.",
      ].join('\n\n'),
    );
  });

  it('falls back to the inviter email when the display name is blank', () => {
    const result = renderWalletInviteEmail({
      inviterName: '   ',
      inviterEmail: 'bob@example.com',
      walletName: 'Trip Wallet',
      role: 'viewer',
      acceptUrl: 'https://ledgerbox.example/invite/token456',
    });

    expect(result.subject).toBe('bob@example.com invited you to Trip Wallet on Ledger Box');
    expect(result.html).toContain('bob@example.com (bob@example.com)');
    expect(result.text).toContain('bob@example.com (bob@example.com)');
  });
});
