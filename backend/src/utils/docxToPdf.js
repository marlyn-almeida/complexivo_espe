const fs = require("fs");
const path = require("path");
const mammoth = require("mammoth");
const puppeteer = require("puppeteer");

async function docxToPdf({ docxPath, pdfPath, cssPath }) {
  if (!fs.existsSync(docxPath)) throw new Error("DOCX no existe: " + docxPath);

  const { value: html } = await mammoth.convertToHtml(
    { path: docxPath },
    {
      // opcional: puedes mapear estilos de Word si lo necesitas luego
      // styleMap: []
    }
  );

  const css = cssPath && fs.existsSync(cssPath) ? fs.readFileSync(cssPath, "utf-8") : "";

  const finalHtml = `
<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>${css}</style>
</head>
<body>
${html}
</body>
</html>
  `;

  const browser = await puppeteer.launch({
    headless: "new",
  });

  try {
    const page = await browser.newPage();
    await page.setContent(finalHtml, { waitUntil: "networkidle0" });

    await page.pdf({
      path: pdfPath,
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
    });
  } finally {
    await browser.close();
  }

  return pdfPath;
}

module.exports = { docxToPdf };
