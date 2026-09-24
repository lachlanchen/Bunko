[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner](https://github.com/lachlanchen/lachlanchen/raw/main/figs/banner.png)](https://github.com/lachlanchen/lachlanchen/blob/main/figs/banner.png)

# Bunko 文庫

*Una biblioteca serena de clásicos en tres idiomas, con lecturas sobre el texto.*

[![Reader](https://img.shields.io/badge/Open-Bunko-303F68?style=for-the-badge)](https://lachlan.lazying.art/Bunko/) [![Sponsor](https://img.shields.io/badge/GitHub-Sponsor-EA4AAA?style=for-the-badge&logo=githubsponsors)](https://github.com/sponsors/lachlanchen)

Bunko es un lector de clásicos de dominio público en chino, japonés e inglés. Elige los idiomas y el diseño, lee pinyin o furigana sobre los caracteres y conserva los capítulos descargados para leer sin conexión. La interfaz está en inglés, chino simplificado, chino tradicional y japonés. El catálogo está en [bunko-books](https://github.com/lachlanchen/bunko-books); este repositorio no almacena los textos de los libros.

[![Captura del lector Bunko](../store/assets/play-phone-01.png)](../store/assets/play-phone-01.png)

## Contenido del repositorio

| Ruta | Descripción |
| --- | --- |
| [`src/`](../src/) | Lector, diseño con ruby, caché sin conexión y temas |
| [`docs/catalogue.md`](../docs/catalogue.md) | Auditoría de derechos y guía de publicación |
| [`store/`](../store/) | Estado en tiendas y traspaso operativo |

## Ejecutar el lector

Instala las dependencias, ejecuta las comprobaciones y abre el servidor de desarrollo Vite. Las versiones nativas usan Capacitor y material de firma privado fuera de Git.

```sh
npm ci
npm run check
npm run dev
```

## Biblioteca y versiones

El catálogo público contiene 150 ediciones autorizadas. Los nuevos libros se publican por GitHub sin reconstruir la app; los cambios en el lector sí requieren una nueva versión web o nativa. La primera versión de pago está en revisión; consulta el registro enlazado para conocer su estado actual.

[store/release.yaml](../store/release.yaml)

## Apoya Bunko

Bunko es un proyecto de LazyingArt. Si te sirve para leer o investigar, puedes apoyar su desarrollo:

| Donate | PayPal | Stripe |
| --- | --- | --- |
| [![Donate](https://img.shields.io/badge/Donate-LazyingArt-0EA5E9?style=for-the-badge&logo=kofi&logoColor=white)](https://chat.lazying.art/donate) | [![PayPal](https://img.shields.io/badge/PayPal-RongzhouChen-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen) | [![Stripe](https://img.shields.io/badge/Stripe-Donate-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400) |

## Cita

Si usas Bunko en investigación, cita este repositorio. GitHub lee [CITATION.cff](../CITATION.cff) y muestra la opción de citarlo.

```bibtex
@software{chen_bunko_2026,
  author = {Chen, Lachlan},
  title = {Bunko: Classics with Ruby},
  year = {2026},
  url = {https://github.com/lachlanchen/Bunko}
}
```

## Alcance y comentarios

Las versiones de estudio generadas por IA pueden contener errores. El catálogo solo publica ediciones completas y auditadas; el dominio público varía según el territorio. Informa de fallos del lector en [Bunko issues](https://github.com/lachlanchen/Bunko/issues) y de problemas de libros o derechos en [bunko-books issues](https://github.com/lachlanchen/bunko-books/issues).
