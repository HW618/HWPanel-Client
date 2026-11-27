import { render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { TabPlaceholder } from '../TabPlaceholder';

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function renderWithSafeArea(element: ReactElement) {
  return render(<SafeAreaProvider initialMetrics={metrics}>{element}</SafeAreaProvider>);
}

describe('TabPlaceholder', () => {
  it('renders the translated title and body passed by the screen', () => {
    renderWithSafeArea(<TabPlaceholder title="Overview" body="Coming in a later slice." />);

    expect(screen.getByRole('header')).toHaveTextContent('Overview');
    expect(screen.getByText('Coming in a later slice.')).toBeOnTheScreen();
  });

  it('renders alongside other children', () => {
    const { toJSON } = renderWithSafeArea(
      <>
        <TabPlaceholder title="Tasks" body="Nothing here yet." />
        <Text>sentinel</Text>
      </>,
    );

    expect(toJSON()).toBeTruthy();
  });
});
