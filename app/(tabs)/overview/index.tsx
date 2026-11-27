import { useTranslation } from '@/core/i18n';
import { TabPlaceholder } from '@/core/ui';

export default function OverviewScreen() {
  const { t } = useTranslation();

  return <TabPlaceholder title={t('screens.overview.title')} body={t('screens.overview.body')} />;
}
