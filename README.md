# didizhu-judy.github.io

Personal homepage of Didi Zhu, served by GitHub Pages at <https://didizhu-judy.github.io>.

It is a small Jekyll site with no theme and no JavaScript dependencies. All content
lives in YAML files under `_data/`, so everyday updates never touch HTML.

## Everyday updates

| To change… | Edit |
| --- | --- |
| News | `_data/news.yml`, add an item at the top |
| Publications | `_data/publications.yml`, add an entry (newest first) |
| Research themes (the four-step arc) | `_data/research.yml` |
| Experience, honors, service | `_data/cv.yml` |

**Experience timeline.** `experience` in `_data/cv.yml` is one list, oldest first; the
last entry is shown as "Now". Each entry has `kind` (`education`, `industry` or
`position`), `period`, `role`, `org`, an optional `note` (Markdown) and `logo`, a small
image in `images/logos/` (square; add `logo_wide: true` for a wordmark).

**Business card.** The hero card reads name, role, organisation, department, email and
location from `author` in `_config.yml`. Its back shows a QR code for the site
(`_includes/qr-home.svg`) and a "Save contact" link to `didi-zhu.vcf`, which is filled in
from the same settings. If the site address ever changes, regenerate the QR code.
| Name, links, email | `_config.yml` |
| Hero text and bio | `index.html`, the `hero` section |

### Add a news item

```yaml
- date: 2026-09-26
  kind: paper            # paper | release | career | travel
  text: "[AdaViG](https://arxiv.org/abs/2607.10004) accepted to **NeurIPS 2026**: …"
```

Items from the last 90 days get a "New" badge automatically. Only the six newest show
until a visitor clicks "Show all".

### Add a publication

```yaml
- id: zhu2027example            # also the BibTeX key
  title: "Paper Title"
  authors: "Didi Zhu, Co Author, Another Author"   # use * for equal contribution
  venue: "ICLR 2027"
  venue_full: "International Conference on Learning Representations (ICLR)"
  type: conference              # conference | workshop | journal | preprint | report
  year: 2027
  themes: [reason]              # align | compose | reason | generate
  first_author: true            # only if first or co-first author
  role: first                   # optional badge: first | cofirst | core
  short: "Example"              # optional short name, used under the research themes
  arxiv: "2701.00000"
  links:
    - { label: Paper, url: "https://arxiv.org/abs/2701.00000" }
    - { label: Code, url: "https://github.com/…" }
```

BibTeX is generated from these fields. To feature a paper as a card with a figure, add
`selected: true` (Publications > Selected, for first-author papers) or `project: true`
(the Projects section, for open model releases), plus `image`, `image_w`, `image_h`,
`image_alt` and a one-line `tldr`.
Figures go in `images/pubs/` as WebP, about 1200 px wide.

## Preview locally

```bash
bundle exec jekyll serve
```

Then open <http://127.0.0.1:4000>. On macOS with the system Ruby, prefix the command
with `LANG=en_US.UTF-8` if the build complains about US-ASCII characters.

## Layout

```
_config.yml            site settings and profile links
_data/                 content (news, publications, research, cv)
_includes/             page pieces: head, header, footer, publication card/row, BibTeX
_layouts/default.html  page shell
index.html             the homepage
404.html               not-found page
assets/css/main.css    all styles (light and dark themes)
assets/js/main.js      theme toggle, filters, BibTeX copy, scroll-spy
images/                photo, favicons, publication figures, social preview image
```
