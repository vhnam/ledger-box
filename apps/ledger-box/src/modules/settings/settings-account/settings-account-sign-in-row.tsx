import type { ReactNode } from 'react';

type SignInMethodRowProps = {
  icon: ReactNode;
  title: ReactNode;
  description: ReactNode;
  action?: ReactNode;
};

function SignInMethodRow({ icon, title, description, action }: SignInMethodRowProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-medium">{title}</span>
        <span className="text-sm text-muted-foreground">{description}</span>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export { SignInMethodRow };
