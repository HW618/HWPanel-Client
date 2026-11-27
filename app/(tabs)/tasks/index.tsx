import { useTranslation } from '@/core/i18n';
import { TabPlaceholder } from '@/core/ui';

export default function TasksScreen() {
  const { t } = useTranslation();

  return <TabPlaceholder title={t('screens.tasks.title')} body={t('screens.tasks.body')} />;
}
