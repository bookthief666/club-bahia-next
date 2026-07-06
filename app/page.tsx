import { HomeHeroV2 } from '@/components/sections/HomeHeroV2';
import { QuickActions } from '@/components/sections/QuickActions';
import { TonightPoster } from '@/components/sections/TonightPoster';
import { ReservationPreview } from '@/components/sections/ReservationPreview';
import { HistoryFeature } from '@/components/sections/HistoryFeature';
import { InfoGrid } from '@/components/sections/InfoGrid';
import { LocationContact } from '@/components/sections/LocationContact';

export default function Home() {
  return (
    <main className="bahia-bg overflow-hidden pb-8 md:pb-0">
      <HomeHeroV2 />
      <QuickActions />
      <TonightPoster />
      <ReservationPreview />
      <HistoryFeature />
      <InfoGrid />
      <LocationContact />
    </main>
  );
}
