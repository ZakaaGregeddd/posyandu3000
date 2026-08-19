export async function dbQuery(sql: string, params: any[] = []): Promise<any> {
  if (typeof window !== "undefined" && (window as any).electronAPI) {
    return (window as any).electronAPI.query(sql, params);
  }
  return [];
}
