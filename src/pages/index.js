import React from 'react';
import '../scss/global.scss';
import { StaticImage } from 'gatsby-plugin-image';
import { SEO } from '../components/seo';
import DiamondGrid from '../components/diamondGrid';
import DiamondBackground from "../components/DiamondBackground";

const IndexPage = () => {
  return (
    <>
      <DiamondBackground
        diamondSize={20}
        gap={24}
        speed={10}
        diamondColor="#121212"
        accentColor="#ff7a00"
        highlightCount={16}
        highlightEveryMs={10000}
        opacity={1}
        targetFps={0}
        direction="SW_NE"   // flip to "NE_SW" if you want the opposite diagonal
      />
      <main>
        <StaticImage
          src="../images/38.svg" 
          alt="Logo"
          style={{
            width: "100%",
            height: "auto"
          }}
        />
      </main>
      {/*<DiamondGrid />*/}
    </>
  )
}

export default IndexPage;

export const Head = () => <SEO title="38 South - Elevating products and inspiring teams; leverage our experience to win." />
