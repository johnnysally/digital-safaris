import axios, { unwrap } from "./axios";
import type {
  SystemSetting,
  PaymentMethodConfig,
  PaymentMethodName,
  CommissionSettings,
  BackupSettings,
  PartnerType,
  LegalType,
  LegalDocument,
} from "../types";

const settingApi = {
  async list(): Promise<SystemSetting[]> {
    const res = await axios.get("/admin/settings");
    const body = unwrap<SystemSetting[] | { settings: SystemSetting[] }>(
      res.data
    );
    if (Array.isArray(body)) return body;
    return body.settings ?? [];
  },

  async getOne(key: string): Promise<SystemSetting> {
    const res = await axios.get(`/admin/settings/${key}`);
    const body = unwrap<SystemSetting | { setting: SystemSetting }>(res.data);
    return "setting" in (body as object)
      ? (body as { setting: SystemSetting }).setting
      : (body as SystemSetting);
  },

  async upsert(payload: {
    key: string;
    value: unknown;
  }): Promise<SystemSetting> {
    const res = await axios.post("/admin/settings", payload);
    const body = unwrap<SystemSetting | { setting: SystemSetting }>(res.data);
    return "setting" in (body as object)
      ? (body as { setting: SystemSetting }).setting
      : (body as SystemSetting);
  },

  async paymentMethods(): Promise<PaymentMethodConfig[]> {
    const res = await axios.get("/admin/payment-methods");
    const body = unwrap<
      PaymentMethodConfig[] | { methods: PaymentMethodConfig[] }
    >(res.data);
    if (Array.isArray(body)) return body;
    return body.methods ?? [];
  },

  async togglePaymentMethod(
    name: PaymentMethodName,
    enabled: boolean
  ): Promise<PaymentMethodConfig> {
    const res = await axios.post(`/admin/payment-methods/${name}/toggle`, {
      enabled,
    });
    return unwrap<PaymentMethodConfig>(res.data);
  },

  async updatePaymentMethodUsedFor(
    name: PaymentMethodName,
    usedFor: Array<PartnerType | "dinein">
  ): Promise<PaymentMethodConfig> {
    const res = await axios.post(
      `/admin/payment-methods/${name}/used-for`,
      { usedFor }
    );
    return unwrap<PaymentMethodConfig>(res.data);
  },

  async updatePaymentMethodConfig(
    name: PaymentMethodName,
    config: Record<string, unknown>
  ): Promise<PaymentMethodConfig> {
    const res = await axios.post(`/admin/payment-methods/${name}/config`, {
      config,
    });
    return unwrap<PaymentMethodConfig>(res.data);
  },

  async getCommission(): Promise<CommissionSettings> {
    const res = await axios.get("/admin/commissions");
    const body = unwrap<CommissionSettings | { commission: CommissionSettings }>(
      res.data
    );
    return "commission" in (body as object)
      ? (body as { commission: CommissionSettings }).commission
      : (body as CommissionSettings);
  },

  async updateCommission(
    payload: Partial<CommissionSettings>
  ): Promise<CommissionSettings> {
    const res = await axios.post("/admin/commissions", payload);
    const body = unwrap<CommissionSettings | { commission: CommissionSettings }>(
      res.data
    );
    return "commission" in (body as object)
      ? (body as { commission: CommissionSettings }).commission
      : (body as CommissionSettings);
  },

  async getBackupSettings(): Promise<BackupSettings> {
    const res = await axios.get("/admin/backups/settings");
    const body = unwrap<BackupSettings | { settings: BackupSettings }>(
      res.data
    );
    return "settings" in (body as object)
      ? (body as { settings: BackupSettings }).settings
      : (body as BackupSettings);
  },

  async updateBackupSettings(
    payload: Partial<BackupSettings>
  ): Promise<BackupSettings> {
    const res = await axios.post("/admin/backups/settings", payload);
    const body = unwrap<BackupSettings | { settings: BackupSettings }>(
      res.data
    );
    return "settings" in (body as object)
      ? (body as { settings: BackupSettings }).settings
      : (body as BackupSettings);
  },

  async listLegal(): Promise<LegalDocument[]> {
    const res = await axios.get("/admin/legal");
    const body = unwrap<LegalDocument[] | { items: LegalDocument[] }>(
      res.data
    );
    if (Array.isArray(body)) return body;
    return (body as { items: LegalDocument[] }).items ?? [];
  },

  async getLegal(type: LegalType): Promise<LegalDocument> {
    const res = await axios.get(`/admin/legal/${type}`);
    const body = unwrap<LegalDocument | { document: LegalDocument }>(
      res.data
    );
    return "document" in (body as object)
      ? (body as { document: LegalDocument }).document
      : (body as LegalDocument);
  },

  async upsertLegal(payload: {
    type: LegalType;
    title: string;
    content: string;
    status?: string;
  }): Promise<LegalDocument> {
    const res = await axios.post("/admin/legal", payload);
    const body = unwrap<LegalDocument | { document: LegalDocument }>(
      res.data
    );
    return "document" in (body as object)
      ? (body as { document: LegalDocument }).document
      : (body as LegalDocument);
  },
};

export default settingApi;