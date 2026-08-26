// Esta función vive en el servidor (Vercel), nunca en el navegador del alumno.
// Por eso la clave de Resend puede estar aquí sin peligro: se lee de una variable
// de entorno configurada en el panel de Vercel, nunca queda escrita en el código.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { aviso } = req.body || {};
    if (!aviso) return res.status(400).json({ error: "Falta el aviso" });

    const contactosHtml = (aviso.contactos || [])
      .map((c) => `${c.nombre} — ${c.telefono}`)
      .join("<br>");

    const html = `
      <p><strong>${aviso.tipo}</strong></p>
      <p>${aviso.nombre || ""}${aviso.dia ? ` · ${aviso.dia}` : ""}${aviso.hora ? ` a las ${aviso.hora}` : ""}</p>
      ${contactosHtml ? `<p>${contactosHtml}</p>` : ""}
    `;

    const respuesta = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Baildanzas <onboarding@resend.dev>",
        to: "baildanzas@gmail.com",
        subject: `Baildanzas — ${aviso.tipo}`,
        html,
      }),
    });

    if (!respuesta.ok) {
      const detalle = await respuesta.text();
      return res.status(500).json({ error: detalle });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
