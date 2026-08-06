import { describe, expect, it } from 'vite-plus/test';

import { renderWalletInviteEmail } from './wallet-invite-email.tsx';

describe('renderWalletInviteEmail', () => {
  it('renders subject, html, and text for a named inviter (default en-US)', () => {
    const result = renderWalletInviteEmail({
      inviterName: 'Alice Nguyen',
      inviterEmail: 'alice@example.com',
      walletName: 'Family Fund',
      role: 'manager',
      acceptUrl: 'https://ledgerbox.example/invite/token123',
    });

    expect(result.subject).toBe('Alice Nguyen invited you to Family Fund on Ledger Box');
    expect(result.html).toContain(
      'Alice Nguyen (alice@example.com) invited you to the &quot;Family Fund&quot; wallet on Ledger Box as a Manager.',
    );
    expect(result.html).toContain('Full access: add, edit, delete transactions and invite others.');
    expect(result.html).toContain('<a href="https://ledgerbox.example/invite/token123">Accept the invite</a>');
    expect(result.html).toContain('If you weren&#x27;t expecting this invite, you can ignore this email.');
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

  it('localizes subject and body from the inviter locale', () => {
    const result = renderWalletInviteEmail({
      inviterName: 'Alice Nguyen',
      inviterEmail: 'alice@example.com',
      walletName: 'Family Fund',
      role: 'manager',
      acceptUrl: 'https://ledgerbox.example/invite/token123',
      locale: 'vi-VN',
    });

    expect(result.subject).toBe('Alice Nguyen đã mời bạn vào Family Fund trên Ledger Box');
    expect(result.html).toContain('với vai trò Quản lý');
    expect(result.html).toContain('Toàn quyền: thêm, sửa, xóa giao dịch và mời người khác.');
    expect(result.html).toContain('Chấp nhận lời mời');
    expect(result.text).toContain('Chấp nhận lời mời: https://ledgerbox.example/invite/token123');
  });
});
