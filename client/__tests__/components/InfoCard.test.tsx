import React from 'react';
import { InfoCard } from '@/components';
import { renderWithTheme } from '../setup/testUtils';

describe('InfoCard', () => {
  describe('vertical layout (default)', () => {
    it('renders the title', () => {
      const { getByText } = renderWithTheme(<InfoCard title="Logros" />);
      expect(getByText('Logros')).toBeTruthy();
    });

    it('renders the value when provided', () => {
      const { getByText } = renderWithTheme(
        <InfoCard title="Partidas" value={42} />,
      );
      expect(getByText('42')).toBeTruthy();
    });

    it('does not render value when not provided', () => {
      const { queryByText } = renderWithTheme(<InfoCard title="Logros" />);
      // value is undefined, should not render a random number
      expect(queryByText('0')).toBeNull();
    });

    it('renders description when provided', () => {
      const { getByText } = renderWithTheme(
        <InfoCard title="Nivel" description="Tu nivel actual de habilidad" />,
      );
      expect(getByText('Tu nivel actual de habilidad')).toBeTruthy();
    });

    it('renders miniTitle when provided', () => {
      const { getByText } = renderWithTheme(
        <InfoCard title="Stats" miniTitle="ESTA SEMANA" />,
      );
      expect(getByText('ESTA SEMANA')).toBeTruthy();
    });

    it('renders emoji icon when provided', () => {
      const { getByText } = renderWithTheme(
        <InfoCard title="Trophy" emoji="🏆" />,
      );
      expect(getByText('🏆')).toBeTruthy();
    });
  });

  describe('horizontal layout', () => {
    it('renders title in horizontal mode', () => {
      const { getByText } = renderWithTheme(
        <InfoCard title="Conectado" layout="horizontal" />,
      );
      expect(getByText('Conectado')).toBeTruthy();
    });

    it('renders miniTitle in horizontal mode', () => {
      const { getByText } = renderWithTheme(
        <InfoCard title="Estado" miniTitle="ONLINE" layout="horizontal" />,
      );
      expect(getByText('ONLINE')).toBeTruthy();
    });

    it('renders description in horizontal mode', () => {
      const { getByText } = renderWithTheme(
        <InfoCard
          title="Plataforma"
          description="Steam vinculado"
          layout="horizontal"
        />,
      );
      expect(getByText('Steam vinculado')).toBeTruthy();
    });
  });
});
