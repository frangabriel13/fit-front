/** URLs internas que se arman con datos. Centralizadas para que no se dupliquen. */

/** El modo entrenamiento de un día, opcionalmente parado en un ejercicio. */
export function trainHref(dayId: string, exerciseId?: string): string {
  const params = new URLSearchParams({ dia: dayId })
  if (exerciseId) params.set("ej", exerciseId)
  return `/rutina/entrenar?${params}`
}
