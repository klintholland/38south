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
    {
      resolve: "gatsby-plugin-manifest",
      options: {
        name: "38 South",
        short_name: "38South",
        start_url: "/",
        background_color: "#000",
        theme_color: "#fff",
        display: "standalone",
        icon: "src/images/favicon.png",
        crossOrigin: `use-credentials`,
      },
    },
    {
      resolve: "gatsby-plugin-google-gtag",
      options: {
        trackingIds: ["G-5KHWNQ8QW0"],
      },
    },
    "gatsby-plugin-image",
    "gatsby-plugin-sitemap",
    "gatsby-plugin-sharp",
    "gatsby-transformer-sharp",
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        name: "images",
        path: "./src/images/",
      },
      __key: "images"
    },
    {
      resolve: 'gatsby-plugin-google-fonts',
      options: {
        fonts: [
          "Noto+Sans",
          "source sans pro\:300,400,400,700",
          "Raleway:200,400,500,700"
        ],
        display: 'swap'
      }
    },
    "gatsby-plugin-sass", // Add this line to use SCSS
    {
      resolve: "gatsby-plugin-postcss",
      options: {
        postCssPlugins: [
          require("tailwindcss"),
          require("autoprefixer"),
        ],
      },
    },
  ]
};
