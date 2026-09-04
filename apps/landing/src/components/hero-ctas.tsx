import { Button } from '@vhnam/ui/components/ui/button';

export function HeroCtas() {
  return (
    <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
      <Button size="lg" nativeButton={false} render={<a href="#how-it-works" />}>
        See how it works
      </Button>
      <Button size="lg" variant="outline" nativeButton={false} render={<a href="#situation" />}>
        The situation it solves
      </Button>
    </div>
  );
}
