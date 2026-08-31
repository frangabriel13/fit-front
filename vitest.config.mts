import { defineConfig } from "vitest/config"

/**
 * Tests de los módulos PUROS (`lib/`): reglas de dominio que no dependen de
 * React ni de la red. No hay tests de componentes a propósito — lo que se
 * rompe en silencio es la traducción entre lo que guarda la API y lo que se
 * lee en la planilla.
 *
 * `.mts` para que Vite lo cargue como ESM; el resto del repo es CommonJS.
 */
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
})
