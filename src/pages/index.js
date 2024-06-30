import React from 'react';
import '../scss/global.scss';
import { StaticImage } from 'gatsby-plugin-image';
import { SEO } from '../components/seo';
import DiamondGrid from '../components/diamondGrid';

const IndexPage = () => {
  return (
    <>
      <main>
        <StaticImage
          src="../images/logo_38south.png" 
          alt="Logo"
          style={{
            width: "100%",
            height: "auto"
          }}
        />
        <button>Schedule a free 30-minute call</button>
      </main>
      <DiamondGrid />
    </>
  )
}

export default IndexPage;

export const Head = () => <SEO title="38 South - Elevating products and inspiring teams; leverage our experience to win." />
