import { Button } from '@vhnam/ui/components/button';

type NavLink = {
  href: string;
  label: string;
};

export function NavLinks({ links }: { links: NavLink[] }) {
  return (
    <nav className="hidden items-center gap-8 sm:flex">
      {links.map((item) => (
        <Button key={item.href} variant="link" nativeButton={false} render={<a href={item.href} />}>
          {item.label}
        </Button>
      ))}
    </nav>
  );
}
