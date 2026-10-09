[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner](https://github.com/lachlanchen/lachlanchen/raw/main/figs/banner.png)](https://github.com/lachlanchen/lachlanchen/blob/main/figs/banner.png)

# Bunko 文庫

*Una biblioteca multilingüe tranquila, con lecturas sobre el texto.*

[![Reader](https://img.shields.io/badge/Open-Bunko-303F68?style=for-the-badge)](https://lachlan.lazying.art/Bunko/) [![Sponsor](https://img.shields.io/badge/GitHub-Sponsor-EA4AAA?style=for-the-badge&logo=githubsponsors)](https://github.com/sponsors/lachlanchen)

Bunko es un lector de clásicos de dominio público en chino, japonés e inglés. Elige los idiomas y el diseño, lee pinyin o furigana sobre los caracteres y conserva los capítulos descargados para leer sin conexión. La interfaz está en inglés, chino simplificado, chino tradicional y japonés. El catálogo está en [bunko-books](https://github.com/lachlanchen/bunko-books); este repositorio no almacena los textos de los libros.

Los libros pueden incluir cualquier número de idiomas mediante etiquetas estándar, incluido el árabe y otras escrituras de derecha a izquierda. Elige los idiomas que quieres ver; los pasajes correspondientes permanecen juntos. Los idiomas de los libros son independientes de las traducciones de la interfaz.

<p align="center"><a href="../store/assets/play-phone-01.png"><img src="../store/assets/play-phone-01.png" alt="Captura del lector Bunko" width="300"></a></p>

## Último envío · 9 de octubre de 2026

Bunko 1.0.11 (18) se envió a revisión para iOS/Watch, Mac y Android. Apple: Waiting for Review; Google: Changes in review. Se reemplazó la revisión anterior de Mac. Incluye el icono redondeado aprobado y mejoras de descarga. Se publicará automáticamente tras la aprobación.

[Envío y verificación](../docs/latest-review-20261009.md)

## Estado actual · 4 de octubre de 2026

iOS/Watch 1.0.10 (16) está publicado con el icono aprobado y las correcciones de lectura multilingüe. Mac 1.0.10 (16) sigue en revisión y se publicará automáticamente tras la aprobación; la versión pública para Mac continúa siendo 1.0.8 (10). Android 1.0.10 (17) está disponible en 172 países tras corregir la política de privacidad, con un enlace en Ajustes y descargas de libros más fiables. Los revisores usan la cuenta de demostración Bunko independiente, sin códigos de correo de GitHub; Google aceptó las instrucciones de acceso aclaradas.

Se preparan planes opcionales de nube para convertir PDF y obtener respuestas de IA por 2,99 / 14,99 / 29,99 USD al mes. La página de planes está disponible, pero las compras están desactivadas. Los libros, diccionarios y la lectura sin conexión siguen incluidos en la compra de la aplicación. Las descargas prueban GitHub, después el CDN público y, como último recurso, nuestra caché de capacidad limitada.

[Registro de publicación](../store/artifacts/distribution-apple-20261004.json) · [Planes de nube](../docs/cloud-subscriptions.md)

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

El catálogo público contiene 185 ediciones autorizadas. Los nuevos libros se publican por GitHub sin reconstruir la app; los cambios en el lector sí requieren una nueva versión web o nativa. El registro siguiente muestra la disponibilidad y las revisiones de cada plataforma.

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

La biblioteca reúne 185 ediciones autorizadas: clásicos, notas de física, libros de aprendizaje y finanzas, y guías de viaje multilingües. Los libros pueden tener uno o varios idiomas; las ecuaciones y figuras se conservan en el lector móvil.


La web y la PWA instalada ofrecen enlaces opcionales a la tienda según el dispositivo. Puedes seguir leyendo aquí; los botones se activan solo tras verificar la disponibilidad pública.

[App Store de Apple](https://apps.apple.com/app/id6815137919) · [Google Play](https://play.google.com/store/apps/details?id=art.lazying.bunko) · [Web reader](https://lachlan.lazying.art/Bunko/)

## Bunko para Mac

La versión 1.0.8 (10) está disponible en Mac App Store. Incluye menús nativos, atajos de teclado y lectura sin conexión en macOS 12 o posterior. El binario universal admite Intel y Apple silicon, con pruebas de ejecución en ambos tipos de Mac. [Mac App Store](https://apps.apple.com/us/app/bunko-classics-with-ruby/id6815137919?platform=mac)

[macOS — build & test](../docs/macos.md) · [App Store — review status](../store/macos/submission.md)

## Actualizaciones de la aplicación

Bunko busca actualizaciones automáticamente y muestra un aviso que puedes posponer cuando hay una versión pública disponible. También puedes comprobarlo desde Ajustes. La web espera a que decidas recargar; las aplicaciones nativas abren su tienda. Se conservan la lectura, las descargas y los datos guardados. Consulta la [guía de actualizaciones](../docs/app-updates.md).

## Controles de lectura

Mantén pulsada una palabra, ajusta los controles de selección y elige Diccionario. La opción Oración amplía la selección; los toques normales mantienen la página abierta. Desliza hacia la derecha sobre la página para volver; también funciona desde el borde izquierdo. Ajustes ofrece tamaños independientes para el texto y las lecturas ruby, con vista previa. Tema y Ajustes caben junto al título en teléfonos estrechos.

[docs/reading-controls.md](../docs/reading-controls.md)

## Conversaciones en Bunko

Lee y escribe comentarios públicos sobre pasajes dentro de Bunko, iniciando sesión con GitHub. Los borradores y las notas privadas permanecen en tu dispositivo hasta que decidas publicarlos. Un pequeño servicio en la nube gestiona la autorización sin depender del ordenador del propietario; GitHub almacena la conversación pública. La interfaz está disponible en inglés, chino simplificado, chino tradicional y japonés. La versión 1.0.6 (8) mantiene la sesión con almacenamiento seguro y renovación automática de tokens, y se recupera de cortes breves de conexión. iOS **1.0.8 (10)**, incluido el complemento para Apple Watch, está disponible públicamente desde el 29 de septiembre de 2026. Mac **1.0.8 (10)** también está disponible públicamente desde el 30 de septiembre de 2026, hora de Hong Kong. Android 1.0.9 (14) continúa disponible en las pruebas internas de Google Play; consulta su estado de producción en los registros de publicación.

[Implementación y verificación de las conversaciones](../docs/github-discussions-2026-09-26.md).

## Mac y Apple Watch

La versión **1.0.8 (10)** añade un complemento nativo para Apple Watch y actualiza la app para Mac. Envía un fragmento de texto multilingüe desde el lector del iPhone al reloj enlazado. Los tres últimos fragmentos quedan disponibles sin conexión, con navegación entre párrafos y tamaño de letra ajustable. Las figuras y ecuaciones permanecen en el lector completo del teléfono y del Mac.

El icono renovado y el asistente privado admiten PDF, Word (.docx), Markdown, texto y TeX, búsqueda de artículos y preguntas sobre documentos. Se superaron diez comprobaciones nativas en un Mac mini M5 Pro, incluida la reapertura sin conexión, la posición de lectura, las ecuaciones y las figuras. El simulador de Watch superó la transferencia real desde la app del iPhone y el reinicio desconectado; no se ha probado un reloj físico.

[macOS](../docs/macos.md) · [watchOS](../docs/watchos.md) · [1.0.8](../store/artifacts/release-1.0.8.json)

## Historial de pruebas · 30 de septiembre de 2026

**2026-09-30 · 1.0.9 (14)** usa el icono aprobado, con más blanco abajo a la derecha y trazos azules más claros arriba a la izquierda de 文. Los diseños anteriores siguen archivados. El icono web está publicado; el build 14 está disponible en TestFlight para iPhone/iPad, el complemento Watch y Mac, y en las pruebas internas de Google Play.

El build 14 se ha enviado a Apple y Google para su publicación automática tras la aprobación. La aprobación sigue pendiente; Apple 1.0.8 (10) continúa como versión pública. Las instrucciones para Google ahora usan la cuenta demo independiente de Bunko, con comentarios y conversaciones sobre documentos reales, sin códigos de correo del propietario. También se actualizaron las declaraciones de privacidad del asistente de documentos.

Los extractos de Watch conservan pinyin chino, furigana japonés y alineación de idiomas por oración, con tamaños separados para texto y lecturas. Reenvía los extractos antiguos desde la app de iPhone actualizada. Las verificaciones de transferencia entre simuladores enlazados y reinicio sin conexión del build 13 siguen siendo aplicables a este cambio de icono; no se probó un Watch físico. Pasaron las 58 pruebas de cliente y las 35 de servidor.

[Registro de publicación](../store/artifacts/icon-release-1.0.9-14.json) · [Acceso para revisión](../store/reviewer-access.md) · [Verificación Watch](../evidence/watch-ruby-20260930/qa.json)
