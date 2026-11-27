import { useTranslation } from '@/core/i18n';
import { TabPlaceholder } from '@/core/ui';

export default function ContainersScreen() {
  const { t } = useTranslation();

  return (
    <TabPlaceholder title={t('screens.containers.title')} body={t('screens.containers.body')} />
  );
}
