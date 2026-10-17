/** Home — todas las secciones del preview 10, en el mismo orden. */
import Page from '@/components/Page';
import Hero from '@/components/sections/Hero';
import Proof from '@/components/sections/Proof';
import Services from '@/components/sections/Services';
import Story from '@/components/sections/Story';
import Cases from '@/components/sections/Cases';
import Process from '@/components/sections/Process';
import Stack from '@/components/sections/Stack';
import Packs from '@/components/sections/Packs';
import Why from '@/components/sections/Why';
import Testimonials from '@/components/sections/Testimonials';
import Final from '@/components/sections/Final';

export default function Home() {
  return (
    <Page>
      <Hero />
      <Proof />
      <Services n={1} />
      <Story />
      <Cases n={2} />
      <Process n={3} />
      <Stack n={4} />
      <Packs n={5} />
      <Why n={6} />
      <Testimonials n={7} />
      <Final n={8} />
    </Page>
  );
}
