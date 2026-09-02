import { describe, expect, it } from "vitest"

import { changePasswordSchema, clientSchema } from "@/lib/schemas"

/** Los campos que quedaron marcados con error, en orden. */
function errorPaths(result: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) {
  return result.error?.issues.map((i) => i.path.join(".")) ?? []
}

const validClient = {
  email: "cliente@fitness.com",
  name: "Diamela",
  password: "fitdev1234",
}

describe("clientSchema", () => {
  it("acepta un alta completa", () => {
    expect(clientSchema.safeParse(validClient).success).toBe(true)
  })

  it("exige 8 caracteres de contraseña, igual que la API", () => {
    // El mínimo lo define MIN_PASSWORD del backend. Si allá sube y acá no, el
    // formulario deja mandar algo que vuelve 400.
    const short = clientSchema.safeParse({ ...validClient, password: "1234567" })
    expect(errorPaths(short)).toEqual(["password"])
    expect(clientSchema.safeParse({ ...validClient, password: "12345678" }).success).toBe(true)
  })

  it("rechaza un email que no lo es", () => {
    expect(errorPaths(clientSchema.safeParse({ ...validClient, email: "arroba" }))).toEqual([
      "email",
    ])
  })

  it("rechaza el nombre vacío", () => {
    expect(errorPaths(clientSchema.safeParse({ ...validClient, name: "" }))).toEqual(["name"])
  })
})

const validChange = {
  currentPassword: "fitdev1234",
  newPassword: "fitdev5678",
  confirmPassword: "fitdev5678",
}

describe("changePasswordSchema", () => {
  it("acepta un cambio válido", () => {
    expect(changePasswordSchema.safeParse(validChange).success).toBe(true)
  })

  it("marca la CONFIRMACIÓN cuando las nuevas no coinciden", () => {
    // El `path` del refine decide qué campo se pinta de rojo. Marcar
    // `newPassword` mandaría a corregir el campo equivocado.
    const r = changePasswordSchema.safeParse({ ...validChange, confirmPassword: "otracosa" })
    expect(errorPaths(r)).toEqual(["confirmPassword"])
  })

  it("marca la NUEVA cuando es igual a la actual", () => {
    const r = changePasswordSchema.safeParse({
      currentPassword: "fitdev1234",
      newPassword: "fitdev1234",
      confirmPassword: "fitdev1234",
    })
    expect(errorPaths(r)).toEqual(["newPassword"])
  })

  it("no deja mandar una nueva de menos de 8", () => {
    const r = changePasswordSchema.safeParse({
      currentPassword: "fitdev1234",
      newPassword: "corta",
      confirmPassword: "corta",
    })
    expect(errorPaths(r)).toContain("newPassword")
  })

  it("exige la actual: sin ella la API responde 400", () => {
    const r = changePasswordSchema.safeParse({ ...validChange, currentPassword: "" })
    expect(errorPaths(r)).toEqual(["currentPassword"])
  })
})
