import axios, { unwrap } from "./axios";

export interface HealthSection {
  status: string;
  enabled?: boolean;
  [key: string]: unknown;
}

export interface HealthResponse {
  status: "healthy" | "degraded" | "unhealthy" | string;
  overall: { up: number; total: number };
  timestamp: string;
  platform: {
    appName: string;
    logoUrl: string | null;
    supportEmail: string | null;
    supportPhone: string | null;
    timezone: string;
    currency: string;
  };
  server: HealthSection & {
    version: string;
    node: string;
    platform: string;
    hostname: string;
    url: string | null;
    uptimeSeconds: number;
    uptimeHuman: string;
    cpuCores: number;
    memoryRssMb: number;
    memoryHeapUsedMb: number;
    pid: number;
  };
  database: HealthSection & {
    type: string;
    host: string;
    database: string | null;
    collections: number;
    documents: number;
  };
  redis: HealthSection & {
    host: string | null;
    memoryUsed?: string | null;
    message?: string;
    error?: string;
  };
  email: HealthSection & {
    provider: string;
    from: string | null;
    fromMasked: string | null;
    sender: string | null;
  };
  sms: HealthSection & {
    provider: string;
    sender: string | null;
  };
  ai: HealthSection & {
    provider: string;
    baseUrl: string | null;
    model: string | null;
  };
  mpesa: HealthSection & {
    mode: string;
    transactionType: string;
    shortcode: string | null;
  };
  stripe: HealthSection & {
    currency: string | null;
  };
  storage: HealthSection & {
    type: string;
    cloud: string | null;
    path: string | null;
  };
  firebase: HealthSection & {
    project: string | null;
  };
  backups: HealthSection & {
    type: string;
    count: number;
    lastBackupAt: string | null;
    lastBackupSize: number | null;
    lastBackupFile: string | null;
  };
  cors: {
    client: string | null;
    admin: string | null;
    partner: string | null;
    website: string | null;
  };
}

export interface MetricsResponse {
  uptimeSeconds: number;
  uptimeHuman: string;
  memory: {
    rssMb: number;
    heapTotalMb: number;
    heapUsedMb: number;
    externalMb: number;
  };
  cpu: {
    cores: number;
    loadAvg: number[];
    model: string | null;
  };
  node: string;
  platform: string;
  pid: number;
}

const healthApi = {
  async get(): Promise<HealthResponse> {
    const res = await axios.get("/admin/health");
    return unwrap<HealthResponse>(res.data);
  },

  async ready(): Promise<{ ready: boolean }> {
    const res = await axios.get("/admin/health/ready", {
      skipAuth: true,
    } as never);
    return unwrap<{ ready: boolean }>(res.data);
  },

  async metrics(): Promise<MetricsResponse> {
    const res = await axios.get("/admin/health/metrics");
    return unwrap<MetricsResponse>(res.data);
  },
};

export default healthApi;