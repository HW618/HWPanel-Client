import Svg, { Circle, Path, Rect } from 'react-native-svg';

export const TAB_ICON_NAMES = ['overview', 'containers', 'apps', 'tasks', 'more'] as const;

export type TabIconName = (typeof TAB_ICON_NAMES)[number];

interface TabIconProps {
  name: TabIconName;
  size: number;
  color: string;
}

/**
 * Minimal line icons for the 5-tab bar. Geometry lives inside a 24x24 viewBox;
 * size and color always come from the theme.
 */
export function TabIcon({ name, size, color }: TabIconProps) {
  const strokeProps = {
    stroke: color,
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none' as const,
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {name === 'overview' ? (
        <>
          <Path d="M3.5 13a8.5 8.5 0 0 1 17 0" {...strokeProps} />
          <Path d="M12 13l3.5-3.5" {...strokeProps} />
          <Circle cx={12} cy={13} r={1.4} {...strokeProps} />
          <Path d="M4 17.5h16" {...strokeProps} />
        </>
      ) : null}

      {name === 'containers' ? (
        <>
          <Path d="M12 3.2 19.8 7.6v8.8L12 20.8 4.2 16.4V7.6L12 3.2Z" {...strokeProps} />
          <Path d="M4.2 7.6 12 12l7.8-4.4M12 12v8.8" {...strokeProps} />
        </>
      ) : null}

      {name === 'apps' ? (
        <>
          <Rect x={4} y={4} width={6.4} height={6.4} rx={1.6} {...strokeProps} />
          <Rect x={13.6} y={4} width={6.4} height={6.4} rx={1.6} {...strokeProps} />
          <Rect x={4} y={13.6} width={6.4} height={6.4} rx={1.6} {...strokeProps} />
          <Rect x={13.6} y={13.6} width={6.4} height={6.4} rx={1.6} {...strokeProps} />
        </>
      ) : null}

      {name === 'tasks' ? (
        <>
          <Circle cx={12} cy={12} r={8.4} {...strokeProps} />
          <Path d="M12 7.4V12l3.1 2" {...strokeProps} />
        </>
      ) : null}

      {name === 'more' ? (
        <>
          <Path d="M4 7h16M4 12h16M4 17h16" {...strokeProps} />
        </>
      ) : null}
    </Svg>
  );
}
