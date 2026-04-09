import { auth, firebaseConfigError } from './firebase';

const BASE = process.env.NEXT_PUBLIC_PORTAL_API_BASE || '';

async function authHeader() {
  if (!auth) throw new Error(firebaseConfigError);
  const user = auth.currentUser;
  if (!user) throw new Error('로그인이 필요합니다.');
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

async function parseError(res: Response): Promise<string> {
  const text = await res.text();
  if (text.startsWith('<')) return `서버 오류 (${res.status})`;
  try { return JSON.parse(text).error || text; } catch { return text; }
}

export interface PatientData {
  age: string; gender: string; cc: string; nrs: string;
  symptom: string; associated: string; pmhx: string;
}

export interface DoctorReply {
  id: string; message: string; doctorName: string;
  createdAt: string; seen: boolean; seenAt?: string; doctorEmail?: string;
}

export interface FollowUpLog {
  action?: string;
  timestamp?: string;
  alertMessage?: string;
}

export interface ConsultationMediaItem {
  id?: string | null;
  kind?: string;
  source?: string | null;
  status?: string;
  contentType?: string | null;
  originalName?: string | null;
  size?: number | null;
  storagePath?: string | null;
  createdAt?: string | null;
  url?: string | null;
}

export interface Consultation {
  id: string;
  userId: string;
  patientData: PatientData;
  aiAction: string;
  doctorChart: string;
  chatbotReply: string;
  status: string;
  createdAt: string;
  closedAt?: string;
  closeReason?: string;
  followUpLogs?: FollowUpLog[];
  doctorReplies?: DoctorReply[];
  doctorRepliedAt?: string;
  mediaItems?: ConsultationMediaItem[];
}

export type ConsultationStatus = 'all' | 'active' | 'followup' | 'replied' | 'closed';

export interface ConsultationQueryOptions {
  status?: ConsultationStatus;
  search?: string;
  offset?: number;
  limit?: number;
}

export interface ConsultationPage {
  consultations: Consultation[];
  total: number;
}

export interface ConsultationSummary {
  pending: number;
  replied: number;
  closed: number;
  followUp: number;
}

function buildPortalPath(path: string, options?: ConsultationQueryOptions): string {
  if (!options) return `${BASE}${path}`;

  const params = new URLSearchParams();
  if (options.status && options.status !== 'all') params.set('status', options.status);
  if (options.search?.trim()) params.set('search', options.search.trim());
  if (typeof options.offset === 'number') params.set('offset', String(options.offset));
  if (typeof options.limit === 'number') params.set('limit', String(options.limit));

  const query = params.toString();
  return query ? `${BASE}${path}?${query}` : `${BASE}${path}`;
}

export async function getConsultationPage(options?: ConsultationQueryOptions): Promise<ConsultationPage> {
  const headers = await authHeader();
  const res = await fetch(buildPortalPath('/api/portal/consultations', options), { headers });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function getConsultations(options?: ConsultationQueryOptions): Promise<Consultation[]> {
  const data = await getConsultationPage(options);
  return data.consultations;
}

export async function getAllConsultations(
  options: Omit<ConsultationQueryOptions, 'offset' | 'limit'> = {},
): Promise<Consultation[]> {
  const consultations: Consultation[] = [];
  const limit = 100;
  let offset = 0;
  let total = Number.POSITIVE_INFINITY;

  while (offset < total) {
    const page = await getConsultationPage({
      ...options,
      status: options.status ?? 'all',
      offset,
      limit,
    });

    consultations.push(...page.consultations);
    total = page.total;

    if (page.consultations.length === 0) {
      break;
    }

    offset += page.consultations.length;
  }

  return consultations;
}

export async function getConsultationSummary(): Promise<ConsultationSummary> {
  const headers = await authHeader();
  const res = await fetch(`${BASE}/api/portal/consultations/summary`, { headers });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function getConsultation(id: string): Promise<Consultation> {
  const headers = await authHeader();
  const res = await fetch(`${BASE}/api/portal/consultations/${id}`, { headers });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function postReply(consultationId: string, message: string): Promise<void> {
  const headers = await authHeader();
  const res = await fetch(`${BASE}/api/portal/consultations/${consultationId}/reply`, {
    method: 'POST', headers, body: JSON.stringify({ message }),
  });
  if (!res.ok) throw new Error(await parseError(res));
}

export interface DoctorStats {
  email: string; name: string; hdt: number; totalReplies: number;
}

export interface DoctorAccessRequest {
  id: string
  email: string
  name: string
  status: 'pending' | 'approved' | string
  requestedAt?: string | null
  approvedAt?: string | null
  lastLoginAt?: string | null
  approvedByEmail?: string | null
  approvedByName?: string | null
}

export interface PortalAuthStatus {
  doctor: {
    uid: string
    email: string
    name: string
  }
  accessStatus: 'approved' | 'pending'
  isAdmin: boolean
  request: DoctorAccessRequest | null
  pendingRequests: DoctorAccessRequest[]
}

export async function getMyHDT(): Promise<DoctorStats> {
  const headers = await authHeader();
  const res = await fetch(`${BASE}/api/portal/hdt/me`, { headers });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function getLeaderboard(): Promise<DoctorStats[]> {
  const headers = await authHeader();
  const res = await fetch(`${BASE}/api/portal/hdt/leaderboard`, { headers });
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json();
  return data.leaderboard;
}

export async function getPortalAuthStatus(): Promise<PortalAuthStatus> {
  const headers = await authHeader();
  const res = await fetch(`${BASE}/api/portal/auth/status`, { headers });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function approveDoctorRequest(email: string): Promise<{
  ok: boolean
  approved: DoctorAccessRequest
  pendingRequests: DoctorAccessRequest[]
}> {
  const headers = await authHeader();
  const res = await fetch(`${BASE}/api/portal/admin/doctor-requests/${encodeURIComponent(email)}/approve`, {
    method: 'POST',
    headers,
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}
