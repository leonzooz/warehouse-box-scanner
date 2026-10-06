/* Add a company here. Use its company subdomain as the key, for example anling.loginai.space. */
window.LOGINAI_TENANTS = {
  anling: {
    id: "anling",
    companyName: "Anling",
    appName: "倉庫紙箱拍照",
    appsScriptUrl: "https://script.google.com/macros/s/AKfycbzEbxUhdMFg6cpiL58oN71q46_41T_rne2Sh1OjPTbQV1gJzzi2bb_4tN0HSq_14j0NCA/exec",
    primaryColor: "#22b8ff",
    enabledModules: ["warehouse"]
  }
};

window.resolveLoginAiTenant = function resolveLoginAiTenant() {
  var queryTenant = new URLSearchParams(window.location.search).get("tenant");
  var hostname = window.location.hostname.toLowerCase();
  var hostTenant = hostname.endsWith(".loginai.space") ? hostname.split(".")[0] : "";
  var tenantId = String(queryTenant || hostTenant || "anling").toLowerCase();
  return window.LOGINAI_TENANTS[tenantId] || window.LOGINAI_TENANTS.anling;
};
