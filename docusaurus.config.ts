import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

const config: Config = {
  title: "Resonate",
  tagline: " dead simple programming model for modern applications",
  favicon: "img/favicon.ico",

  // Set the production url of your site here
  url: "https://blog.resonatehq.io",
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: "/",

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: "resonatehq", // Usually your GitHub org/user name.
  projectName: "blog", // Usually your repo name.

  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "@docusaurus/preset-classic",
      {
        blog: {
          routeBasePath: "/", // Serve the docs at the site's root (ref: https://docusaurus.io/docs/next/docs-introduction#home-page-docs)
          // sidebarPath: '',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          // editUrl: '',
          blogSidebarCount: "ALL",
          blogSidebarTitle: "Posts",
        },
        docs: false,
        theme: {
          customCss: [
            "./static/css/custom.css",
            "./static/css/boxicons.min.css",
          ],
        },
        gtag: {
          trackingID: "G-0660YY8LZF",
          anonymizeIP: true,
        },
      } satisfies Preset.Options,
    ],
  ],
  scripts: [
    {
      src: "/scripts/fullstory.js",
      async: true,
    },
    {
      src: "https://widget.kapa.ai/kapa-widget.bundle.js",
      "data-website-id": "0f3cf17e-47fa-427a-b0fd-464d33f0bb16",
      "data-project-name": "Ask Echo",
      "data-project-color": "#1b1b1b",
      "data-project-logo": "/img/echo-square.png",
      "data-user-analytics-fingerprint-enabled": "true",
      "data-button-text": "Ask Echo",
      "data-modal-override-open-class-ask-ai": "ask-echo",
      "data-modal-override-open-class-search": "search-echo",
      "data-modal-title-ask-ai": "Echo your Resonate HQ AI developer assistant",
      "data-modal-title-search": "Search Resonate HQ",
      "data-modal-disclaimer":
        "I am Echo, Resonate HQ's AI developer assistant. I have access to all of Resonate HQ's information corpus. Responses are generated by combining sources to provide the best possible answer. However, sometimes I may make a mistake, so please use your best judgement. Help me improve by providing a thumbs up or thumbs down after each response.",
      "data-modal-ask-ai-input-placeholder":
        "Ask me a question about Resonate HQ",
      "data-modal-open-on-command-k": "true",
      "data-modal-example-questions": [
        "What is Resonate HQ?",
        "How do I get started with Resonate?",
        "What is DST?",
        "Example application code in TypeScript?",
      ],
      "data-modal-example-questions-title": "For example...",
      "data-search-mode-enabled": "true",
      "data-switch-show-icons": "true",
      "data-switch-color": "#1b1b1b",
      "data-button-height": "7.5rem",
      "data-button-width": "5.7rem",
      "data-button-text-color": "#efefef",
      "data-button-image-height": "5.5rem",
      "data-button-image-width": "5.5rem",
      //"data-modal-full-screen": "true",
      async: true,
    },
    {
      src: "/scripts/cookiebanner.js",
      async: true,
    },
  ],

  themeConfig: {
    image: "img/echo.png", // used for link previews
    colorMode: {
      defaultMode: "light",
      disableSwitch: true,
      respectPrefersColorScheme: false,
    },
    announcementBar: {
      id: "python-sdk-waiting-list",
      content:
        '<div class="waiting-list-announcement"><a class="cta-link" href="https://forms.gle/BnFiDUQExseQcH8h9" target="_blank" rel="noopener noreferrer">Join the Resonate Python SDK wait list!</a> 🚀</div>',
      isCloseable: false,
      backgroundColor: "#121212",
      textColor: "#efefef",
    },
    navbar: {
      title: "Resonate",
      logo: {
        alt: "Resonate Logo",
        src: "img/echo-logo.svg",
        href: "https://www.resonatehq.io",
        target: "_self",
        width: 40,
      },
      items: [
        {
          to: "https://docs.resonatehq.io",
          label: "Docs",
          position: "right",
          target: "_self",
        },
        {
          to: "https://blog.resonatehq.io",
          label: "Blog",
          position: "right",
          target: "_self",
        },
        {
          href: "https://resonatehq.io/discord",
          html: '<i class="bx bx-md bxl-discord"></i>',
          position: "right",
        },
        {
          href: "https://github.com/resonatehq/resonate",
          html: '<i class="bx bx-md bxl-github"></i>',
          position: "right",
        },
        {
          to: "http://eepurl.com/iNagDk",
          html: '<a href="http://eepurl.com/iNagDk" target="_blank" class="subscribe-button">Subscribe</a>',
          position: "right",
        },
      ],
    },
    footer: {
      style: "light",
      links: [
        {
          html: `
            <a href="https://twitter.com/resonatehqio" target="_blank" rel="noopener noreferrer" aria-label="Resonate Twitter">
              <i class="bx bx-sm bxl-twitter"></i>
            </a>
          `,
        },
        {
          html: `
            <a href="https://resonatehq.io/discord" target="_blank" rel="noopener noreferrer" aria-label="Resonate HQ Discord">
              <i class="bx bx-sm bxl-discord"></i>
            </a>
          `,
        },
        {
          html: `
            <a href="https://github.com/resonatehq" target="_blank" rel="noopener noreferrer" aria-label="Resonate GitHub">
              <i class="bx bx-sm bxl-github"></i>
            </a>
          `,
        },
        {
          html: `
            <a href="https://www.linkedin.com/company/resonatehqio" target="_blank" rel="noopener noreferrer" aria-label="Resonate HQ LinkedIn">
              <i class="bx bx-sm bxl-linkedin"></i>
            </a>
          `,
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} ResonateHQ, Inc.`,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
