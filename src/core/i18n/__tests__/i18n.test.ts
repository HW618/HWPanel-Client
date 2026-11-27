// i18n-allow-cjk-file -- asserts the zh-CN resource values.
import { i18n } from '@/core/i18n';

describe('i18n bootstrap', () => {
  it('initialises zh-CN synchronously', () => {
    expect(i18n.isInitialized).toBe(true);
    expect(i18n.language).toBe('zh-CN');
  });

  it('resolves the tab labels', () => {
    expect(i18n.t('tabs.overview')).toBe('概览');
    expect(i18n.t('tabs.containers')).toBe('容器');
    expect(i18n.t('tabs.apps')).toBe('应用');
    expect(i18n.t('tabs.tasks')).toBe('任务');
    expect(i18n.t('tabs.more')).toBe('更多');
  });

  it('keeps all five tab screen titles translated', () => {
    expect(i18n.t('screens.overview.title')).not.toBe('screens.overview.title');
    expect(i18n.t('screens.containers.title')).not.toBe('screens.containers.title');
    expect(i18n.t('screens.apps.title')).not.toBe('screens.apps.title');
    expect(i18n.t('screens.tasks.title')).not.toBe('screens.tasks.title');
    expect(i18n.t('screens.more.title')).not.toBe('screens.more.title');
  });
});
