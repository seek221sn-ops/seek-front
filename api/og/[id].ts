import type { VercelRequest, VercelResponse } from "@vercel/node";

const BACKEND = "https://seek-back-79vo.onrender.com";
const FRONTEND = "https://seek-front-plum.vercel.app";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query as { id: string };

  let titre = "Annonce immobilière";
  let description = "Découvrez cette annonce immobilière sur Seek.";
  let image = "";
  let prix = "";

  try {
    const r = await fetch(`${BACKEND}/api/public/${id}`);
    if (r.ok) {
      const json = await r.json();
      const b = json.data ?? json;
      titre = b.titre ?? titre;
      description = b.description
        ? b.description.slice(0, 160)
        : `${b.typeLogement?.nom ?? "Bien"} à ${b.ville ?? ""} sur Seek`;
      image = (b.photos ?? [])[0] ?? "";
      if (b.prix) {
        prix = new Intl.NumberFormat("fr-SN", {
          style: "currency",
          currency: "XOF",
        }).format(b.prix);
      }
    }
  } catch {
    // silently fallback to defaults
  }

  const pageUrl = `${FRONTEND}/annonce/${id}`;
  const ogTitle = prix ? `${titre} — ${prix}` : titre;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");
  res.status(200).send(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(ogTitle)}</title>

  <!-- Open Graph -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${escapeHtml(pageUrl)}" />
  <meta property="og:title" content="${escapeHtml(ogTitle)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  ${image ? `<meta property="og:image" content="${escapeHtml(image)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />` : ""}
  <meta property="og:site_name" content="Seek Immobilier" />
  <meta property="og:locale" content="fr_SN" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(ogTitle)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  ${image ? `<meta name="twitter:image" content="${escapeHtml(image)}" />` : ""}

  <!-- WhatsApp lit og:image -->

  <!-- Redirect vers le vrai frontend -->
  <meta http-equiv="refresh" content="0; url=${escapeHtml(pageUrl)}" />
  <script>window.location.replace("${pageUrl.replace(/"/g, '\\"')}");</script>
</head>
<body>
  <p>Redirection en cours… <a href="${escapeHtml(pageUrl)}">Cliquez ici</a></p>
</body>
</html>`);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
