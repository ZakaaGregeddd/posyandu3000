export async function dbQuery(sql: string, params: any[] = []): Promise<any> {
  if (typeof window !== "undefined" && (window as any).electronAPI) {
    return (window as any).electronAPI.query(sql, params);
  }

  // Fallback untuk Mode Web / Maestro Testing melalui Next.js API Route
  try {
    const res = await fetch("/api/db", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sql, params }),
    });
    const json = await res.json();
    if (!json.ok) {
      throw new Error(json.error || "Database query failed");
    }
    return json.data;
  } catch (err) {
    console.error("Web DB Fallback Error:", err);
    return [];
  }
}
