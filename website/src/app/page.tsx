import { Audit } from "@/components/Audit";
import { Calibration } from "@/components/Calibration";
import { Cite, Footer, Takeaways, Team } from "@/components/Closing";
import { Demo } from "@/components/Demo";
import { GradCam } from "@/components/GradCam";
import { Hero } from "@/components/Hero";
import { Method } from "@/components/Method";
import { Nav } from "@/components/Nav";
import { BackToTop, ScrollProgress } from "@/components/PageChrome";
import { Problem } from "@/components/Problem";
import { Results } from "@/components/Results";

export default function Home() {
  return (
    <>
      <ScrollProgress />
      <Nav />
      <main>
        <Hero />
        <Problem />
        <Audit />
        <Method />
        <Results />
        <Demo />
        <Calibration />
        <GradCam />
        <Takeaways />
        <Cite />
        <Team />
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
