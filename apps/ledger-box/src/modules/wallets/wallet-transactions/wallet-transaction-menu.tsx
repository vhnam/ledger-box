import { FormattedMessage } from 'react-intl';

import { Icon } from '@vhnam/ui/components/icon';
import { Button } from '@vhnam/ui/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@vhnam/ui/components/ui/dropdown-menu';

type WalletTransactionMenuProps = {
  onEdit: () => void;
  onDelete: () => void;
};

function WalletTransactionMenu({ onEdit, onDelete }: WalletTransactionMenuProps) {
  return (
    <div className="flex items-center justify-end gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon">
              <Icon name="DotsThreeVerticalIcon" className="size-4" />
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={onEdit}>
              <Icon name="PencilLineIcon" className="size-4" />
              <FormattedMessage id="transaction.menu.edit" defaultMessage="Edit" />
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={onDelete}>
              <Icon name="TrashIcon" className="size-4" />
              <FormattedMessage id="transaction.menu.delete" defaultMessage="Delete" />
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export { WalletTransactionMenu };
