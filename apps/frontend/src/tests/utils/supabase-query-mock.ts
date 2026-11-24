import { vi } from "vitest";

export interface SupabaseMockResult {
  data?: unknown;
  count?: number | null;
  error?: unknown | null;
}

export function createSupabaseQueryMock() {
  let results: SupabaseMockResult[] = [];

  const createBuilder = (result: SupabaseMockResult) => {
    const builder: Record<string, unknown> = {};
    for (const method of [
      "select",
      "insert",
      "update",
      "delete",
      "eq",
      "gte",
      "lte",
      "lt",
      "order",
    ]) {
      builder[method] = vi.fn().mockReturnValue(builder);
    }

    builder.single = vi.fn().mockResolvedValue(result);
    builder.maybeSingle = vi.fn().mockResolvedValue(result);
    Object.defineProperty(builder, "then", {
      value: (
        resolve: (value: SupabaseMockResult) => unknown,
        reject?: (reason: unknown) => unknown,
      ) => Promise.resolve(result).then(resolve, reject),
    });

    return builder;
  };

  const from = vi.fn(() => createBuilder(results.shift() ?? { data: null, error: null }));
  const client = {
    schema: vi.fn(() => ({ from })),
    from,
  };

  return {
    client,
    from,
    setResults: (...nextResults: SupabaseMockResult[]) => {
      results = [...nextResults];
    },
  };
}
