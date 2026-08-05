import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ThemeProviderProps as NextThemesProviderProps } from 'next-themes';
import type { ComponentType, ReactNode } from 'react';

type ThemeProviderProps = Omit<NextThemesProviderProps, 'children'> & {
  children?: ReactNode;
};

const Provider = NextThemesProvider as ComponentType<ThemeProviderProps>;

function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <Provider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange {...props}>
      {children}
    </Provider>
  );
}

export { ThemeProvider };
