import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { EDUCATION, HERO_META, IDENTITY, PROFILE, PROJECTS, ROLES, SKILL_CLUSTERS } from './src/content'

const escape = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const list = (items: readonly string[]) => `<ul>${items.map((item) => `<li>${escape(item)}</li>`).join('')}</ul>`

/*
 * the page is a canvas and a scroll timeline, so nothing in the body is text until react
 * mounts. google renders scripts and reads the real thing; bing and the model crawlers
 * largely do not, and they are how a growing share of readers arrive. so the same content
 * goes out as markup for them, generated from content.ts rather than written twice, which
 * is the only version that cannot drift from the page.
 */
function noscriptMirror(): string {
  const sections = [
    `<h1>${escape(IDENTITY.name)}</h1>`,
    `<p>${escape(IDENTITY.role)}, ${escape(IDENTITY.org)}. ${escape(IDENTITY.tagline)}</p>`,
    list(HERO_META.map((meta) => `${meta.label}: ${meta.value}`)),
    ...PROFILE.map((paragraph) => `<p>${escape(paragraph)}</p>`),

    '<h2>Experience</h2>',
    ...ROLES.map(
      (role) =>
        `<h3>${escape(role.title)}, ${escape(role.org)}</h3>` +
        `<p>${escape(role.place)}. ${escape(role.period)}.</p>` +
        list(role.points),
    ),

    '<h2>Skills</h2>',
    ...SKILL_CLUSTERS.map((cluster) => `<h3>${escape(cluster.label)}</h3>${list(cluster.items)}`),

    '<h2>Projects</h2>',
    ...PROJECTS.map(
      (project) =>
        `<h3>${escape(project.name)}</h3>` +
        `<p>${escape(project.kind)}, ${escape(project.updated)}. ${escape(project.stack.join(', '))}.</p>` +
        `<p>${escape(project.body)}</p>` +
        (project.site ? `<p><a href="${escape(project.site)}">${escape(project.site)}</a></p>` : '') +
        `<p><a href="${escape(project.repo)}">${escape(project.repo)}</a></p>`,
    ),

    '<h2>Education</h2>',
    ...EDUCATION.map(
      (entry) =>
        `<h3>${escape(entry.qualification)}</h3>` +
        `<p>${escape(entry.school)}. ${escape(entry.period)}. ${escape(entry.detail)}</p>`,
    ),

    '<h2>Contact</h2>',
    `<ul>${[IDENTITY.github, IDENTITY.linkedin, IDENTITY.x]
      .map((url) => `<li><a href="${escape(url)}">${escape(url)}</a></li>`)
      .join('')}<li><a href="mailto:${escape(IDENTITY.email)}">${escape(IDENTITY.email)}</a></li></ul>`,
  ]

  return `<noscript>${sections.join('')}</noscript>`
}

function contentMirror(): Plugin {
  return {
    name: 'portfolio-content-mirror',
    transformIndexHtml(html) {
      return html.replace('</body>', `    ${noscriptMirror()}\n  </body>`)
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), contentMirror()],
})
