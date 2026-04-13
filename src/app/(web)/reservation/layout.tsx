import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reservation - Maihak',
  description:
    'Découvrez le menu de Maihak, restaurant indien authentique à Paris 10 (36 rue de Chabrol). Entrées, plats principaux, desserts et boissons — à déguster du mardi au dimanche de 11h00 à 14h30 et de 18h00 à 22h30.',
};

export default function Menu({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
