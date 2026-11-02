// Microsoft Clarity is injected by Google Tag Manager. This stops that tag
// on every hostname except the production site, including Netlify deploy previews.

const GUARD = `<script>(function(){var h=location.hostname;if(h==="jonathanwallace.ca"||h==="www.jonathanwallace.ca")return;function bad(u){return typeof u==="string"&&/clarity\\.ms/i.test(u);}try{var d=Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype,"src");if(d&&d.set&&d.get){Object.defineProperty(HTMLScriptElement.prototype,"src",{configurable:true,enumerable:d.enumerable,get:function(){return d.get.call(this);},set:function(v){if(!bad(String(v)))d.set.call(this,v);}});}}catch(e){}var sa=Element.prototype.setAttribute;Element.prototype.setAttribute=function(n,v){if(this&&this.tagName==="SCRIPT"&&String(n).toLowerCase()==="src"&&bad(String(v)))return;return sa.apply(this,arguments);};})();</script>`;

export function productionHost(hostname) {
  const host = String(hostname || "").toLowerCase();
  return host === "jonathanwallace.ca" || host === "www.jonathanwallace.ca";
}

export function guardScript() {
  return GUARD;
}

export default async function clarityProductionOnly(request, context) {
  const host = new URL(request.url).hostname;
  if (productionHost(host)) return;

  const response = await context.next();
  const type = response.headers.get("content-type") || "";
  if (!type.includes("text/html")) return response;

  const html = await response.text();
  let next = html;
  if (html.includes("<!-- Google Tag Manager -->")) {
    next = html.replace("<!-- Google Tag Manager -->", GUARD + "<!-- Google Tag Manager -->");
  } else if (html.includes("<head>")) {
    next = html.replace("<head>", "<head>" + GUARD);
  }

  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.delete("content-encoding");
  return new Response(next, {
    status: response.status,
    statusText: response.statusText,
    headers: headers,
  });
}

export const config = {
  path: "/*",
  onError: "bypass",
};
