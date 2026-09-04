import { EyeIcon, EyeClosedIcon } from '@phosphor-icons/react';
import { useState, type ComponentProps } from 'react';

import { Button } from '#/components/ui/button';
import { ButtonGroup } from '#/components/ui/button-group';
import { Input } from '#/components/ui/input';

type PasswordInputProps = Omit<ComponentProps<'input'>, 'type'>;

export const PasswordInput = (props: PasswordInputProps) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <ButtonGroup>
      <Input {...props} type={showPassword ? 'text' : 'password'} />
      <Button nativeButton variant="outline" size="icon" onClick={() => setShowPassword(!showPassword)}>
        {showPassword ? <EyeIcon /> : <EyeClosedIcon />}
      </Button>
    </ButtonGroup>
  );
};
