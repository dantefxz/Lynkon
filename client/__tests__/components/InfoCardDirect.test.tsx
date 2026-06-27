import React from 'react';
import { InfoCard } from '@/components/InfoCard';
import { renderWithTheme } from '../setup/testUtils';

describe('InfoCard (direct)', () => {
  describe('horizontal layout (default)', () => {
    it('renders the title', () => {
      const { getByText } = renderWithTheme(<InfoCard title="Partidas" />);
      expect(getByText('Partidas')).toBeTruthy();
    });

    it('renders the value when provided', () => {
      const { getByText } = renderWithTheme(<InfoCard title="Horas" value={120} />);
      expect(getByText('120')).toBeTruthy();
    });

    it('does not render value when not provided', () => {
      const { queryByText } = renderWithTheme(<InfoCard title="Logros" />);
      expect(queryByText('0')).toBeNull();
    });

    it('renders description when provided', () => {
      const { getByText } = renderWithTheme(
        <InfoCard title="Nivel" description="Tu nivel actual" />,
      );
      expect(getByText('Tu nivel actual')).toBeTruthy();
    });

    it('renders miniTitle when provided', () => {
      const { getByText } = renderWithTheme(
        <InfoCard title="Stats" miniTitle="ESTA SEMANA" />,
      );
      expect(getByText('ESTA SEMANA')).toBeTruthy();
    });

    it('renders emoji icon when provided', () => {
      const { getByText } = renderWithTheme(
        <InfoCard title="Trofeo" emoji="🏆" />,
      );
      expect(getByText('🏆')).toBeTruthy();
    });

    it('renders with icon name without errors', () => {
      const { getByText } = renderWithTheme(
        <InfoCard title="Logros" icon="star" />,
      );
      expect(getByText('Logros')).toBeTruthy();
    });
  });

  describe('vertical layout', () => {
    it('renders title in vertical mode', () => {
      const { getByText } = renderWithTheme(
        <InfoCard title="Conectado" layout="vertical" />,
      );
      expect(getByText('Conectado')).toBeTruthy();
    });

    it('renders value in vertical mode', () => {
      const { getByText } = renderWithTheme(
        <InfoCard title="Horas" value={50} layout="vertical" />,
      );
      expect(getByText('50')).toBeTruthy();
    });

    it('renders miniTitle in vertical mode', () => {
      const { getByText } = renderWithTheme(
        <InfoCard title="Título" miniTitle="SUBTITLE" layout="vertical" />,
      );
      expect(getByText('SUBTITLE')).toBeTruthy();
    });

    it('renders description in vertical mode', () => {
      const { getByText } = renderWithTheme(
        <InfoCard title="Plataforma" description="Steam conectado" layout="vertical" />,
      );
      expect(getByText('Steam conectado')).toBeTruthy();
    });

    it('renders emoji in vertical mode', () => {
      const { getByText } = renderWithTheme(
        <InfoCard title="Star" emoji="⭐" layout="vertical" />,
      );
      expect(getByText('⭐')).toBeTruthy();
    });
  });
});
