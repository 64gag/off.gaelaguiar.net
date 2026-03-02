---
title: "First Test"
date: 2026-01-01T09:00:00Z
summary: "Readable article layout demo with links, image, and references."
---

This page is intentionally longer so typography and spacing are easy to judge on
desktop and phone.

## Why This Version Exists

The site should keep the blunt, plain, Apache-index tone, but reading should not
feel like scanning a raw terminal dump forever. The goal here is a middle ground:
minimal chrome, no decorative UI clutter, and text that is still comfortable
after several paragraphs.

The visual direction is influenced by old directory listings, but adapted for
long-form reading by controlling line length and vertical rhythm. Apache itself
documents the generated listing format in `mod_autoindex` [1], and this project
keeps that spirit while giving article pages a better reading experience.

## Example Links

- Hugo docs: <https://gohugo.io/documentation/>
- Apache `mod_autoindex`: <https://httpd.apache.org/docs/2.4/mod/mod_autoindex.html>
- MDN page on responsive images: <https://developer.mozilla.org/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images>

## Example Figure

![Wireframe of the responsive article layout](/img/terminal-reading.svg)

_Figure 1. Responsive layout sketch: metadata rail on desktop, single column on
small screens._

## Example Content Block

> Keep the interface plain, but do not punish people for reading.

```txt
Index of /articles/first-test/
Parent Directory
README.txt
Title: First Test
Date: 2026-01-01
URL: /articles/first-test/
```

## Quick Comparison

| Characteristic   | Before                   | Current target                          |
| ---------------- | ------------------------ | --------------------------------------- |
| Body readability | Barely noticeable change | Clearly larger, calmer line rhythm      |
| Desktop layout   | One narrow flow          | Two-column shell (metadata + text)      |
| Mobile layout    | Basic stack              | Single-column with larger readable text |

## References

1. Apache HTTP Server Project, "_mod_autoindex_".  
   <https://httpd.apache.org/docs/2.4/mod/mod_autoindex.html>
2. Hugo Documentation.  
   <https://gohugo.io/documentation/>
3. MDN Web Docs, "_Responsive images_".  
   <https://developer.mozilla.org/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images>
