/**
 * Compliance email footer: table-based layout, MSO conditionals, merge tags.
 * Replace {{shopName}}, {{shopAddress}}, {{unsubscribeUrl}}, {{privacyUrl}} server-side before sending.
 */

const FOOTER_STYLES =
  "font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #999999; text-align: center;";
const LINK_STYLE = "color: #999999;";

/**
 * Returns the raw footer HTML template with merge tags.
 * Call replaceFooterMergeTags() with per-recipient values before sending.
 */
export function getEmailFooterTemplate(): string {
  return `
<!--[if mso]><table width="560" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: collapse;">
  <tr>
    <td style="border-top: 1px solid #e5e5e5; padding-top: 16px; padding-bottom: 8px; ${FOOTER_STYLES}">
      You received this because you're a customer of {{shopName}}.
    </td>
  </tr>
  <tr>
    <td style="padding-bottom: 8px; ${FOOTER_STYLES}">
      {{shopName}} &bull; {{shopAddress}}
    </td>
  </tr>
  <tr>
    <td style="padding-bottom: 16px; ${FOOTER_STYLES}">
      <a href="{{unsubscribeUrl}}" style="${LINK_STYLE}">Unsubscribe</a>
      &middot;
      <a href="{{privacyUrl}}" style="${LINK_STYLE}">Privacy Policy</a>
    </td>
  </tr>
</table>
<!--[if mso]></td></tr></table><![endif]-->
`.trim();
}

export interface FooterMergeContext {
  shopName: string;
  shopAddress: string;
  unsubscribeUrl: string;
  privacyUrl: string;
}

/**
 * Replaces footer merge tags with actual values. Use for each recipient.
 */
export function replaceFooterMergeTags(
  footerHtml: string,
  context: FooterMergeContext
): string {
  return footerHtml
    .replace(/\{\{shopName\}\}/g, context.shopName)
    .replace(/\{\{shopAddress\}\}/g, context.shopAddress)
    .replace(/\{\{unsubscribeUrl\}\}/g, context.unsubscribeUrl)
    .replace(/\{\{privacyUrl\}\}/g, context.privacyUrl);
}
