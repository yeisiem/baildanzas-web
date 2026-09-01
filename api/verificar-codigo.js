// Esta función vive en el servidor (Vercel), nunca en el navegador de quien entra a la web.
// Por eso el código de acceso puede vivir aquí sin peligro: se lee de una variable de entorno
// configurada en el panel de Vercel, y nunca queda escrito en el código público de la app.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Método no permitido" });
  }

  try {
    const { codigo } = req.body || {};
    const correcto = process.env.CODIGO_PANEL_GESTION;

    if (!correcto) {
      // Si todavía no se ha configurado la variable en Vercel, no dejamos pasar a nadie por error
      return res.status(500).json({ ok: false, error: "No configurado" });
    }

    const acierto = typeof codigo === "string" && codigo.length > 0 && codigo === correcto;
    return res.status(200).json({ ok: acierto });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "Error interno" });
  }
}
