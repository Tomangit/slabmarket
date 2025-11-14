// Shared test utilities for Edge Functions

export interface MockSupabaseClient {
  from: (table: string) => MockQueryBuilder;
  auth: {
    getUser: (token: string) => Promise<{
      data: { user: any | null };
      error: any | null;
    }>;
  };
}

export interface MockQueryBuilder {
  select: (columns: string) => MockQueryBuilder;
  insert: (data: any) => MockQueryBuilder;
  update: (data: any) => MockQueryBuilder;
  eq: (column: string, value: any) => MockQueryBuilder;
  neq: (column: string, value: any) => MockQueryBuilder;
  gt: (column: string, value: any) => MockQueryBuilder;
  gte: (column: string, value: any) => MockQueryBuilder;
  lt: (column: string, value: any) => MockQueryBuilder;
  lte: (column: string, value: any) => MockQueryBuilder;
  like: (column: string, pattern: string) => MockQueryBuilder;
  ilike: (column: string, pattern: string) => MockQueryBuilder;
  in: (column: string, values: any[]) => MockQueryBuilder;
  is: (column: string, value: any) => MockQueryBuilder;
  not: (column: string, operator: string, value: any) => MockQueryBuilder;
  order: (column: string, options?: { ascending?: boolean }) => MockQueryBuilder;
  limit: (count: number) => MockQueryBuilder;
  range: (from: number, to: number) => MockQueryBuilder;
  single: () => Promise<{ data: any; error: any | null }>;
  then: (resolve: (value: any) => any) => Promise<any>;
}

export function createMockSupabaseClient(
  mocks: Record<string, any> = {}
): MockSupabaseClient {
  const defaultMocks: Record<string, any> = {
    getUser: { data: { user: null }, error: null },
    ...mocks,
  };

  return {
    from: (table: string) => createMockQueryBuilder(table, defaultMocks),
    auth: {
      getUser: async (token: string) => {
        return defaultMocks.getUser || { data: { user: null }, error: null };
      },
    },
  };
}

function createMockQueryBuilder(
  table: string,
  mocks: Record<string, any>
): MockQueryBuilder {
  let query: any = {
    table,
    selectColumns: "*",
    filters: [],
    orderBy: null,
    limitCount: null,
    rangeFrom: null,
    rangeTo: null,
    insertData: null,
    updateData: null,
    single: false,
  };

  const builder: MockQueryBuilder = {
    select: (columns: string) => {
      query.selectColumns = columns;
      return builder;
    },
    insert: (data: any) => {
      query.insertData = data;
      query.operation = "insert";
      return builder;
    },
    update: (data: any) => {
      query.updateData = data;
      query.operation = "update";
      return builder;
    },
    eq: (column: string, value: any) => {
      query.filters.push({ type: "eq", column, value });
      return builder;
    },
    neq: (column: string, value: any) => {
      query.filters.push({ type: "neq", column, value });
      return builder;
    },
    gt: (column: string, value: any) => {
      query.filters.push({ type: "gt", column, value });
      return builder;
    },
    gte: (column: string, value: any) => {
      query.filters.push({ type: "gte", column, value });
      return builder;
    },
    lt: (column: string, value: any) => {
      query.filters.push({ type: "lt", column, value });
      return builder;
    },
    lte: (column: string, value: any) => {
      query.filters.push({ type: "lte", column, value });
      return builder;
    },
    like: (column: string, pattern: string) => {
      query.filters.push({ type: "like", column, value: pattern });
      return builder;
    },
    ilike: (column: string, pattern: string) => {
      query.filters.push({ type: "ilike", column, value: pattern });
      return builder;
    },
    in: (column: string, values: any[]) => {
      query.filters.push({ type: "in", column, value: values });
      return builder;
    },
    is: (column: string, value: any) => {
      query.filters.push({ type: "is", column, value });
      return builder;
    },
    not: (column: string, operator: string, value: any) => {
      query.filters.push({ type: "not", column, operator, value });
      return builder;
    },
    order: (column: string, options?: { ascending?: boolean }) => {
      query.orderBy = { column, ascending: options?.ascending !== false };
      return builder;
    },
    limit: (count: number) => {
      query.limitCount = count;
      return builder;
    },
    range: (from: number, to: number) => {
      query.rangeFrom = from;
      query.rangeTo = to;
      return builder;
    },
    single: async () => {
      query.single = true;
      return executeQuery(query, mocks);
    },
    then: async (resolve: (value: any) => any) => {
      const result = await executeQuery(query, mocks);
      return resolve(result);
    },
  };

  return builder;
}

async function executeQuery(
  query: any,
  mocks: Record<string, any>
): Promise<{ data: any; error: any | null }> {
  const mockKey = `${query.table}_${query.operation || "select"}`;
  const mockHandler = mocks[mockKey] || mocks[query.table];

  if (mockHandler) {
    if (typeof mockHandler === "function") {
      return await mockHandler(query);
    }
    return { data: mockHandler, error: null };
  }

  // Default empty response
  if (query.operation === "insert" || query.operation === "update") {
    return { data: null, error: null };
  }

  return { data: query.single ? null : [], error: null };
}

export function createMockRequest(
  method: string = "POST",
  body: any = {},
  headers: Record<string, string> = {}
): Request {
  return new Request("http://localhost:54321/functions/v1/test", {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: method !== "GET" && method !== "OPTIONS" ? JSON.stringify(body) : undefined,
  });
}

export function createMockEnv(overrides: Record<string, string> = {}): Record<string, string> {
  return {
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_ANON_KEY: "test-anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
    CRON_SECRET: "test-cron-secret",
    SITE_URL: "https://test.slabmarket.com",
    ...overrides,
  };
}

