/**
 * @type {import('gatsby').GatsbyConfig}
 */
module.exports = {
  siteMetadata: {
    title: `38 South`,
    description: `Elevating products and inspiring teams - leverage our experience to win.`,
    siteUrl: `https://thirtyeight.so`,
  },
  plugins: [
    "gatsby-plugin-sass",
    {
      resolve: "gatsby-plugin-manifest",
      options: {
        name: "38 South",
        short_name: "38South",
        start_url: "/",
        background_color: "#000",
        theme_color: "#fff",
        // Enables "Add to Homescreen" prompt and disables browser UI (including back button)
        // see https://developers.google.com/web/fundamentals/web-app-manifest/#display
        display: "standalone",
        icon: "src/images/favicon.png", // This path is relative to the root of the site.
        // An optional attribute which provides support for CORS check.
        // If you do not provide a crossOrigin option, it will skip CORS for manifest.
        // Any invalid keyword or empty string defaults to `anonymous`
        crossOrigin: `use-credentials`,
      },
    },
    {
      resolve: "gatsby-plugin-google-gtag",
      options: {
        trackingIds: ["G-5KHWNQ8QW0"], // Replace with your actual tracking ID(s)
        // Other plugin options go here
      },
    },
    "gatsby-plugin-image",
    "gatsby-plugin-sitemap",
    "gatsby-plugin-sharp",
    "gatsby-transformer-sharp",
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        "name": "images",
        "path": "./src/images/"
      },
      __key: "images"
    },
    {
      resolve: 'gatsby-plugin-google-fonts',
      options: {
        fonts: [
          "Noto+Sans",
          "source sans pro\:300,400,400,700" // you can also specify font weights and styles
        ],
        display: 'swap'
      }
    },
  ]  
};