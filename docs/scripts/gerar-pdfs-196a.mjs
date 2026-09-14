import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

const require = createRequire(
  path.resolve(import.meta.dirname, "../../integrations/superlogica-crawler/package.json")
);
const { chromium } = require("playwright");

const repo = path.resolve(import.meta.dirname, "../..");
const htmlDir = path.join(repo, "docs/html");
const pdfDir = path.join(repo, "docs/pdf");

const jobs = [
  {
    html: path.join(htmlDir, "documentacao-196a-pdf.html"),
    pdf: path.join(pdfDir, "documentacao-196a-integracao.pdf"),
  },
  {
    html: path.join(htmlDir, "tarefas-196a-pdf.html"),
    pdf: path.join(pdfDir, "tarefas-196a-integracao.pdf"),
  },
];

const browser = await chromium.launch();
const page = await browser.newPage();

for (const job of jobs) {
  await page.goto(pathToFileURL(job.html).href, { waitUntil: "networkidle" });
  await page.pdf({
    path: job.pdf,
    format: "A4",
    printBackground: true,
    margin: { top: "12mm", right: "10mm", bottom: "14mm", left: "10mm" },
    displayHeaderFooter: true,
    headerTemplate: `<div></div>`,
    footerTemplate: `
      <div style="width:100%;font-size:8px;color:#5c6f66;padding:0 16mm;display:flex;justify-content:space-between;font-family:sans-serif;">
        <span>CEMA Integração · 196A</span>
        <span>p. <span class="pageNumber"></span> / <span class="totalPages"></span></span>
      </div>`,
  });
  console.log("ok", path.relative(repo, job.pdf));
}

await browser.close();
