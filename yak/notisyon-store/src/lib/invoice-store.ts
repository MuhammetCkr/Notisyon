import { issueInvoice } from "@/lib/admin-operations-store";
import { getDb } from "@/lib/db";

const escapeHtml = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character] || character));

export async function issueConfiguredInvoice(orderId: string) {
  const invoice = await issueInvoice(orderId);
  const settings = (await getDb().query(`SELECT value FROM store_settings WHERE key='control_invoice-design'`)).rows[0]?.value || {};
  const title = escapeHtml(settings.title || "FATURA"); const logo = String(settings.logo_url || "").trim(); const note = escapeHtml(settings.footer_note || "Bizi tercih ettiğiniz için teşekkür ederiz.");
  let html = String(invoice.content_html || "").replace("<h1>FATURA</h1>", `<h1>${title}</h1>`);
  if (logo && !html.includes("invoice-brand-logo")) html = html.replace("<header>", `<header><img class="invoice-brand-logo" src="${escapeHtml(logo)}" alt="Notisyon"/>`);
  if (note && !html.includes("invoice-footer-note")) html = html.replace("</article>", `<p class="invoice-footer-note">${note}</p></article>`);
  if (html !== invoice.content_html) return (await getDb().query(`UPDATE invoices SET content_html=$2,updated_at=now() WHERE id=$1 RETURNING *`, [invoice.id, html])).rows[0];
  return invoice;
}
