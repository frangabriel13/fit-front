import { defineConfig } from "vitest/config"

/**
 * Tests de los módulos PUROS: reglas de dominio que no dependen de React ni de
 * la red. La mayoría vive en `lib/`, pero dos —`entrenar/slots.ts` y
 * `sheet/set-delta.ts`— viven junto a los componentes que los consumen, así
 * que se recogen por patrón de nombre y no por carpeta.
 *
 * No hay tests de componentes a propósito: lo que se rompe en silencio es la
 * traducción entre lo que guarda la API y lo que se lee en la planilla.
 *
 * `.mts` para que Vite lo cargue como ESM; el resto del repo es CommonJS.
 */
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["{lib,components}/**/*.test.ts"],
  },
})
