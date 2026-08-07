import { FormattedMessage } from 'react-intl';

function SettingsHeader() {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b bg-sidebar transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <div className="flex flex-col">
          <h1 className="font-heading text-base font-medium">
            <FormattedMessage id="settings.page.title" defaultMessage="Settings" />
          </h1>
        </div>
      </div>
    </header>
  );
}

export { SettingsHeader };
