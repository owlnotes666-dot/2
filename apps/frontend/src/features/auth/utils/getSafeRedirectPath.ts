export function getSafeRedirectPath(path: string | null | undefined) {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return "/";
  }

  const url = new URL(path, "http://localhost");

  if (url.origin !== "http://localhost") {
    return "/";
  }

  if (url.pathname === "/signin" || url.pathname === "/signup") {
    return "/";
  }

  return `${url.pathname}${url.search}${url.hash}`;
}
