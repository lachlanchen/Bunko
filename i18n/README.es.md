[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner](https://github.com/lachlanchen/lachlanchen/raw/main/figs/banner.png)](https://github.com/lachlanchen/lachlanchen/blob/main/figs/banner.png)

# Bunko 文庫

*Una biblioteca serena de clásicos en tres idiomas, con lecturas sobre el texto.*

[![Reader](https://img.shields.io/badge/Open-Bunko-303F68?style=for-the-badge)](https://lachlan.lazying.art/Bunko/) [![Sponsor](https://img.shields.io/badge/GitHub-Sponsor-EA4AAA?style=for-the-badge&logo=githubsponsors)](https://github.com/sponsors/lachlanchen)

Bunko es un lector de clásicos de dominio público en chino, japonés e inglés. Elige los idiomas y el diseño, lee pinyin o furigana sobre los caracteres y conserva los capítulos descargados para leer sin conexión. La interfaz está en inglés, chino simplificado, chino tradicional y japonés. El catálogo está en [bunko-books](https://github.com/lachlanchen/bunko-books); este repositorio no almacena los textos de los libros.

<p align="center"><a href="../store/assets/play-phone-01.png"><img src="../store/assets/play-phone-01.png" alt="Captura del lector Bunko" width="300"></a></p>

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

El catálogo público contiene 183 ediciones autorizadas. Los nuevos libros se publican por GitHub sin reconstruir la app; los cambios en el lector sí requieren una nueva versión web o nativa. El registro siguiente muestra la disponibilidad y las revisiones de cada plataforma.

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
## Leer en Bunko

La biblioteca reúne 150 clásicos de dominio público y 33 ediciones autorizadas por su autor: apuntes de física, una guía de aprendizaje, libros de finanzas y tres guías de viaje multilingües. Cada libro puede tener uno o varios idiomas; el lector móvil conserva las ecuaciones y figuras.

[App Store de Apple](https://apps.apple.com/app/id6815137919) · [Google Play · publicación pendiente](https://play.google.com/store/apps/details?id=art.lazying.bunko) · [Web reader](https://lachlan.lazying.art/Bunko/)

## Bunko para Mac

La versión 1.0.2 (4) se ha enviado a revisión en Mac App Store y está disponible en TestFlight interno. Incluye menús nativos, atajos de teclado y lectura sin conexión en macOS 12 o posterior. El binario admite Intel y Apple silicon; las pruebas de ejecución se realizaron en equipos Intel.

[macOS — build & test](../docs/macos.md) · [App Store — review status](../store/macos/submission.md)

## Actualizaciones de la aplicación

Bunko busca actualizaciones automáticamente y muestra un aviso que puedes posponer cuando hay una versión pública disponible. También puedes comprobarlo desde Ajustes. La web espera a que decidas recargar; las aplicaciones nativas abren su tienda. Se conservan la lectura, las descargas y los datos guardados. Consulta la [guía de actualizaciones](../docs/app-updates.md).

## Controles de lectura

Mantén pulsada una palabra, ajusta los controles de selección y elige Diccionario. La opción Oración amplía la selección; los toques normales mantienen la página abierta. Desliza hacia la derecha desde el borde izquierdo para volver. Ajustes ofrece tamaños independientes para el texto y las lecturas ruby, con vista previa. Tema y Ajustes caben junto al título en teléfonos estrechos.

[docs/reading-controls.md](../docs/reading-controls.md)

## Conversaciones en Bunko

Lee y escribe comentarios públicos sobre pasajes dentro de Bunko, iniciando sesión con GitHub. Los borradores y las notas privadas permanecen en tu dispositivo hasta que decidas publicarlos. Un pequeño servicio en la nube gestiona la autorización sin depender del ordenador del propietario; GitHub almacena la conversación pública. La interfaz está disponible en inglés, chino simplificado, chino tradicional y japonés. La versión 1.0.6 (8) mantiene la sesión con almacenamiento seguro y renovación automática de tokens, y se recupera de cortes breves de conexión. Se distribuye mediante las pruebas internas de Google Play y TestFlight para iOS y Mac; las revisiones de producción de 1.0.4 siguen su curso.

[Implementación y verificación de las conversaciones](../docs/github-discussions-2026-09-26.md).
