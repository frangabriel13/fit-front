import { describe, expect, it } from "vitest"

import { numStr, parseNum, round2, sanitizeDecimal, sanitizeInt } from "@/lib/num"

describe("parseNum", () => {
  it("acepta la coma decimal, que es como se tipea en el teclado del celular", () => {
    expect(parseNum("1,25")).toBe(1.25)
    expect(parseNum("57.5")).toBe(57.5)
  })

  it("acepta un decimal a medio escribir", () => {
    // El input no normaliza mientras escribís, así que "57." llega tal cual.
    expect(parseNum("57.")).toBe(57)
  })

  it("vacío es null, no 0", () => {
    // Un 0 se guardaría como "levanté 0 kg"; null es "no lo cargué".
    expect(parseNum("")).toBeNull()
    expect(parseNum("   ")).toBeNull()
  })

  it("un cero escrito sí es 0", () => {
    expect(parseNum("0")).toBe(0)
  })

  it("lo que no es número es null", () => {
    expect(parseNum("abc")).toBeNull()
    expect(parseNum("1.2.3")).toBeNull()
  })
})

describe("sanitizeDecimal", () => {
  it("pasa la coma a punto", () => {
    expect(sanitizeDecimal("57,5")).toBe("57.5")
  })

  it("tira todo lo que no sea dígito o separador", () => {
    expect(sanitizeDecimal("57kg")).toBe("57")
  })

  it("deja un solo separador: el primero", () => {
    expect(sanitizeDecimal("1.2.3")).toBe("1.23")
    expect(sanitizeDecimal("1,2,3")).toBe("1.23")
  })

  it("deja escribir el separador antes que los decimales", () => {
    // "57." es un estado intermedio válido: si se borrara, no se podría tipear.
    expect(sanitizeDecimal("57.")).toBe("57.")
  })

  it("no rompe con vacío", () => {
    expect(sanitizeDecimal("")).toBe("")
  })
})

describe("sanitizeInt", () => {
  it("solo dígitos: las reps y el RIR no llevan decimales", () => {
    expect(sanitizeInt("12a3")).toBe("123")
    expect(sanitizeInt("1.5")).toBe("15")
    expect(sanitizeInt("-3")).toBe("3")
  })
})

describe("numStr", () => {
  it("sin dato el campo queda vacío", () => {
    expect(numStr(null)).toBe("")
    expect(numStr(undefined)).toBe("")
  })

  it("el cero se escribe, no se esconde", () => {
    // RIR 0 es un dato real: llegaste al fallo o muy cerca.
    expect(numStr(0)).toBe("0")
  })
})

describe("round2", () => {
  it("corta en dos decimales", () => {
    expect(round2(57.456)).toBe(57.46)
    expect(round2(2.5)).toBe(2.5)
  })

  it("saca el ruido de sumar de a 2,5 kg", () => {
    expect(round2(0.1 + 0.2)).toBe(0.3)
  })
})
