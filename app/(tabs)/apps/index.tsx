import { useTranslation } from '@/core/i18n';
import { TabPlaceholder } from '@/core/ui';

export default function AppsScreen() {
  const { t } = useTranslation();

  return <TabPlaceholder title={t('screens.apps.title')} body={t('screens.apps.body')} />;
}
