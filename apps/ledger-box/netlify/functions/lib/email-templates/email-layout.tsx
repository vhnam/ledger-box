import type { ReactNode } from 'react';

type EmailLayoutProps = {
  children: ReactNode;
};

/** Shared, content-free structural wrapper. Table-based for mail-client compatibility; no header/footer content. */
function EmailLayout({ children }: EmailLayoutProps) {
  return (
    <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} style={{ backgroundColor: '#f4f4f5' }}>
      <tbody>
        <tr>
          <td align="center" style={{ padding: '24px 16px' }}>
            <table
              role="presentation"
              width="100%"
              cellPadding={0}
              cellSpacing={0}
              style={{
                maxWidth: '480px',
                backgroundColor: '#ffffff',
                fontFamily: 'Arial, Helvetica, sans-serif',
                fontSize: '14px',
                lineHeight: 1.5,
                color: '#18181b',
              }}
            >
              <tbody>
                <tr>
                  <td style={{ padding: '24px' }}>{children}</td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

export { EmailLayout, type EmailLayoutProps };
