import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { HeroBanner } from '@/components/home/HeroBanner';
import { TrustBar } from '@/components/home/TrustBar';
import { PromoBanners } from '@/components/home/PromoBanners';
import { LeagueShortcuts } from '@/components/home/LeagueShortcuts';
import { FeaturedMatches } from '@/components/home/FeaturedMatches';
import { HowItWorks } from '@/components/home/HowItWorks';
import { PaymentMethods } from '@/components/home/PaymentMethods';
import { ResponsibleGaming } from '@/components/home/ResponsibleGaming';

export function Home() {
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return;
    document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
  }, [hash]);

  return (
    <>
      <HeroBanner />
      <TrustBar />
      <PromoBanners />
      <LeagueShortcuts />
      <FeaturedMatches />
      <HowItWorks />
      <PaymentMethods />
      <ResponsibleGaming />
    </>
  );
}
