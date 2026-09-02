import type { MetadataRoute } from "next"

/**
 * Manifest de PWA: la app se usa desde el celular, en el gimnasio, y agregarla
 * a la pantalla de inicio tiene que verse como una app y no como una pestaña.
 *
 * `display: "standalone"` saca la barra del navegador, que en la pantalla de
 * entrenamiento se come espacio que hace falta.
 *
 * Los colores son los mismos tokens de `app/globals.css` (`--background` y
 * `--primary`) pasados a hex: el manifest no acepta `oklch` en todos lados y
 * tampoco puede leer variables CSS.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FitFront",
    short_name: "FitFront",
    description: "Tu rutina y modo entrenamiento, pensado para el gym.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0a1014",
    theme_color: "#0a1014",
    lang: "es",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        // `maskable`: Android recorta el ícono a la forma del sistema. El
        // dibujo entra en el 80% central para que no le corte la mancuerna.
        purpose: "maskable",
      },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  }
}
