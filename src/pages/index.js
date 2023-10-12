import * as React from "react";
import "../scss/global.scss";
import { StaticImage } from "gatsby-plugin-image";

const IndexPage = () => {
  return (
    <main>
      <StaticImage
        src="../images/logo_38south.png" 
        alt="Logo"
        style={{
          width: "100%",
          height: "auto"
        }}
      />
    </main>
  )
}

export default IndexPage

export const Head = () => <title>Home Page</title>
