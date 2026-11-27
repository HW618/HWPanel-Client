import { useTranslation } from '@/core/i18n';
import { TabPlaceholder } from '@/core/ui';

export default function MoreScreen() {
  const { t } = useTranslation();

  return <TabPlaceholder title={t('screens.more.title')} body={t('screens.more.body')} />;
}
