const apiUrl = import.meta.env.VITE_API_BASE_URL;
export async function getJson(url: string, params?: Record<string, any>) {
  // 构造查询参数
  const query = params ? "?" + new URLSearchParams(params).toString() : "";

  const resp = await fetch(apiUrl + url + query, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!resp.ok) {
    throw new Error(`HTTP error! status: ${resp.status}`);
  }

  return resp.json();
}
