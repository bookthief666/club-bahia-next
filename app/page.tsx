import { HeroSection } from '@/components/sections/HeroSection';
import { TonightSection } from '@/components/sections/TonightSection';
import { ReservationCTASection } from '@/components/sections/ReservationCTASection';
import { HistorySection } from '@/components/sections/HistorySection';
import { HoursSection } from '@/components/sections/HoursSection';
import { DressCodeSection } from '@/components/sections/DressCodeSection';
import { LocationSection } from '@/components/sections/LocationSection';
import { ContactSection } from '@/components/sections/ContactSection';

export default function Home() {
  return <main><HeroSection /><TonightSection /><ReservationCTASection /><HistorySection /><HoursSection /><DressCodeSection /><LocationSection /><ContactSection /></main>;
}
