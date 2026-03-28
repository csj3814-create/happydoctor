import { auth } from './firebase';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'https://happydoctor.onrender.com';

async function authHeader() {
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
  createdAt: string; seen: boolean;
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
  followUpLogs?: object[];
  doctorReplies?: DoctorReply[];
  doctorRepliedAt?: string;
}

export async function getConsultations(): Promise<Consultation[]> {
  const headers = await authHeader();
  const res = await fetch(`${BASE}/api/portal/consultations`, { headers });
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json();
  return data.consultations;
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
