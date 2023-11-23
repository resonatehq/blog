import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/__docusaurus/debug',
    component: ComponentCreator('/__docusaurus/debug', 'b02'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/config',
    component: ComponentCreator('/__docusaurus/debug/config', '608'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/content',
    component: ComponentCreator('/__docusaurus/debug/content', 'ca7'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/globalData',
    component: ComponentCreator('/__docusaurus/debug/globalData', '129'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/metadata',
    component: ComponentCreator('/__docusaurus/debug/metadata', 'a09'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/registry',
    component: ComponentCreator('/__docusaurus/debug/registry', 'ed0'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/routes',
    component: ComponentCreator('/__docusaurus/debug/routes', '41f'),
    exact: true
  },
  {
    path: '/archive',
    component: ComponentCreator('/archive', 'e1c'),
    exact: true
  },
  {
    path: '/first-blog-post',
    component: ComponentCreator('/first-blog-post', 'd68'),
    exact: true
  },
  {
    path: '/markdown-page',
    component: ComponentCreator('/markdown-page', 'b83'),
    exact: true
  },
  {
    path: '/tags',
    component: ComponentCreator('/tags', 'ae2'),
    exact: true
  },
  {
    path: '/tags/docusaurus',
    component: ComponentCreator('/tags/docusaurus', '72a'),
    exact: true
  },
  {
    path: '/tags/facebook',
    component: ComponentCreator('/tags/facebook', '427'),
    exact: true
  },
  {
    path: '/tags/hello',
    component: ComponentCreator('/tags/hello', '939'),
    exact: true
  },
  {
    path: '/tags/hola',
    component: ComponentCreator('/tags/hola', 'c52'),
    exact: true
  },
  {
    path: '/welcome',
    component: ComponentCreator('/welcome', 'd34'),
    exact: true
  },
  {
    path: '/',
    component: ComponentCreator('/', '79b'),
    exact: true
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
