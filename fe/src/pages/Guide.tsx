import React, { useMemo, useRef } from 'react';
import TopBar from '../components/Topbar';
import BottomNav from '../components/BottomNav';
import Button from '../components/Button';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import GrowthGraph from './GrowthHistory/Graph'; 

const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

type UserInfo = {
  name?: string;
  sex?: '남' | '여' | string;
  age?: number;
  birthDate?: string;
};

export type GrowthPoint = {
  date: string;   // YYYY-MM-DD
  height: number; // cm
  weight: number; // kg
};

const pickNum = (o: any, ks: string[]) =>
  ks.find(k => typeof o?.[k] === 'number')
    ? (o as any)[ks.find(k => typeof o?.[k] === 'number') as string]
    : undefined;

const pickStr = (o: any, ks: string[]) =>
  ks.find(k => typeof o?.[k] === 'string')
    ? (o as any)[ks.find(k => typeof o?.[k] === 'string') as string]
    : undefined;

const calcBMI = (wKg: number, hCm: number) => {
  const h = hCm / 100;
  return +(wKg / (h * h)).toFixed(1);
};

const calcAgeFromBirth = (birth?: string) => {
  if (!birth) return undefined;
  const b = new Date(birth);
  if (Number.isNaN(+b)) return undefined;
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
};

const wait = (ms: number) => new Promise(res => setTimeout(res, ms));

function loadInfoFromStorage(): Partial<UserInfo> {
  const candidates = ['aicare_information', 'information', 'childInfo', 'profile'];
  for (const key of candidates) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const j = JSON.parse(raw);
      const name = pickStr(j, ['name', 'childName', 'username']);
      const sex = pickStr(j, ['sex', 'gender']);
      const age = pickNum(j, ['age']);
      const birthDate = pickStr(j, ['birthDate', 'birth', 'birthday']);
      return { name, sex, age, birthDate };
    } catch {/* ignore */}
  }
  return {};
}

function useUserInfo(): { data: UserInfo | null; loading: boolean } {
  const [data, setData] = React.useState<UserInfo | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/me`, { credentials: 'include' });
        const j: any = res.ok ? await res.json() : null;
        const me = j ? (j.data ?? j) : null;

        const fromMe: Partial<UserInfo> = me ? {
          name: pickStr(me, ['name', 'username', 'childName']),
          sex: pickStr(me, ['sex', 'gender']),
          age: pickNum(me, ['age']),
          birthDate: pickStr(me, ['birthDate', 'birth', 'birthday']),
        } : {};

        const fromStorage = loadInfoFromStorage();

        const merged: UserInfo = {
          name: fromStorage.name ?? fromMe.name,
          sex: fromStorage.sex ?? fromMe.sex,
          age:
            fromStorage.age ??
            fromMe.age ??
            calcAgeFromBirth(fromStorage.birthDate ?? fromMe.birthDate),
          birthDate: fromStorage.birthDate ?? fromMe.birthDate,
        };

        if (mounted) setData(merged);
      } catch {
        if (mounted) setData(loadInfoFromStorage() as UserInfo);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return { data, loading };
}

function useGrowth(): { data: GrowthPoint[]; loading: boolean } {
  const [data, setData] = React.useState<GrowthPoint[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/growth`, { credentials: 'include' });
        const j: any = await res.json().catch(() => null);
        const arr: any[] = Array.isArray(j) ? j : Array.isArray(j?.data) ? j.data : [];

        const norm: GrowthPoint[] = (arr || []).map(r => {
          const date = (
            pickStr(r, ['recorded_at', 'date', 'measuredAt', 'created_at', 'createdAt']) ??
            new Date().toISOString()
          ).slice(0, 10);
          const height = pickNum(r, ['height_cm', 'height', 'heightCm', 'cm']);
          const weight = pickNum(r, ['weight_kg', 'weight', 'weightKg', 'kg']);
          if (typeof height !== 'number' || typeof weight !== 'number') return null as any;
          return { date, height, weight };
        }).filter(Boolean) as GrowthPoint[];

        norm.sort((a, b) => (a.date > b.date ? 1 : -1));
        if (mounted) setData(norm);
      } catch {
        if (mounted) setData([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return { data, loading };
}


export default function Guide() {
  const NAV_H = 84;
  const { data: user } = useUserInfo();
  const { data: growth } = useGrowth();

  const latest = growth.length ? growth[growth.length - 1] : null;
  const bmi = latest ? calcBMI(latest.weight, latest.height) : undefined;

  const sheetRef = useRef<HTMLDivElement>(null);

  const downloadPDF = async () => {
    const el = sheetRef.current;
    if (!el) return;

    const filename = `aicare-report-${user?.name ?? 'user'}-${latest?.date ?? ''}.pdf`;

    await wait(120);

    el.classList.add('print-fill');

    try {
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        foreignObjectRendering: false,
        windowWidth: el.scrollWidth,
        windowHeight: el.scrollHeight,
      });

      const img = canvas.toDataURL('image/png');

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageW = pdf.internal.pageSize.getWidth();   // 210
      const pageH = pdf.internal.pageSize.getHeight();  // 297

      const s = Math.max(pageW / canvas.width, pageH / canvas.height);
      const w = canvas.width * s;
      const h = canvas.height * s;
      const x = (pageW - w) / 2;
      const y = (pageH - h) / 2;

      pdf.addImage(img, 'PNG', x, y, w, h, undefined, 'FAST');
      pdf.save(filename);
    } catch (e) {
      console.warn('[PDF] 캡처 실패 → 브라우저 인쇄 폴백:', e);

      const style = document.createElement('style');
      style.textContent = `
        @page { size: A4; margin: 0; }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          body * { visibility: hidden !important; }
          #report-sheet, #report-sheet * { visibility: visible !important; }
          #report-sheet {
            position: fixed; inset: 0;
            width: 210mm; height: 297mm;
            border: none !important; box-shadow: none !important; border-radius: 0 !important;
          }
        }
      `;
      document.head.appendChild(style);
      const prev = document.title;
      document.title = filename;
      window.print();
      setTimeout(() => { document.title = prev; style.remove(); }, 800);
    } finally {
      el.classList.remove('print-fill');
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col relative">
      <TopBar title="종합 성장 가이드" variant="light" />

      <main className="flex-1 flex justify-center px-4 pt-4">
        <ReportSheet ref={sheetRef} user={user} growth={growth} bmi={bmi} />
      </main>

      <div className="px-6 pb-3">
        <Button
          label="PDF 저장하기"
          onClick={downloadPDF}
          style={{ maxWidth: 'none', borderRadius: 12 }}
        />
      </div>

      <div style={{ height: NAV_H }} />
      <BottomNav activePage="/guide" />
    </div>
  );
}

const ReportSheet = React.forwardRef<HTMLDivElement, {
  user: UserInfo | null;
  growth: GrowthPoint[];
  bmi?: number;
}>(({ user, growth, bmi }, ref) => {
  const A4_WIDTH = 794;  
  const A4_HEIGHT = 1123; 
  const latest = growth.length ? growth[growth.length - 1] : null;

  const dateText = useMemo(
    () => (latest?.date ? latest.date.replace(/-/g, '.') : '-'),
    [latest]
  );

  const graphRecords = useMemo(
    () =>
      growth.length
        ? growth.map(g => ({
            id: g.date,
            child_id: '',
            recorded_at: g.date,
            height_cm: g.height,
            weight_kg: g.weight,
            bmi: 0,
            notes: null,
            created_at: g.date,
            updated_at: g.date,
          }))
        : undefined,
    [growth]
  );

  return (
    <div
      ref={ref}
      id="report-sheet"
      className="bg-white rounded-xl border border-gray-200 shadow-sm"
      style={{
        width: A4_WIDTH,
        minHeight: A4_HEIGHT,
        padding: 24,
        boxSizing: 'border-box',
      }}
    >
      {/* 헤더 */}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-2xl font-extrabold tracking-tight text-gray-900">
            aiCare <span className="text-gray-500 text-sm align-middle">성장 리포트</span>
          </div>

          <div className="mt-2 grid grid-cols-3 gap-x-6 gap-y-1 text-[13px] text-gray-600">
            <div><span className="text-gray-500">이름</span> : {user?.name ?? '-'}</div>
            <div><span className="text-gray-500">성별</span> : {user?.sex ?? '-'}</div>
            <div><span className="text-gray-500">나이</span> : {user?.age ?? '-'}</div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[12px] text-gray-600 whitespace-nowrap">최근 측정일</div>
          <div className="text-[15px] font-semibold text-gray-900 whitespace-nowrap leading-tight">
            {dateText}
          </div>
        </div>
      </div>

      <div className="my-4 h-px bg-gray-200" />

      <div className="grid grid-cols-1 gap-4">
        <Card title="핵심 지표">
          <div className="grid grid-cols-3 gap-3">
            <KPI label="키" value={latest ? `${latest.height.toFixed(1)} cm` : '-'} />
            <KPI label="체중" value={latest ? `${latest.weight.toFixed(1)} kg` : '-'} />
            <KPI label="BMI" value={bmi !== undefined ? String(bmi) : '-'} />
          </div>
        </Card>

        {/* 키 그래프 */}
        <GrowthGraph
          data={graphRecords as any}
          compact
          fixedMetric="height"
          title="키 추이"
          hideToggle
        />

        {/* 몸무게 그래프 */}
        <GrowthGraph
          data={graphRecords as any}
          compact
          fixedMetric="weight"
          title="몸무게 추이"
          hideToggle
        />
      </div>

      <div className="mt-5 text-[12px] text-gray-500">
        본 리포트는 정보 입력(information) 및 성장관리 기록을 바탕으로 산출된 참고 지표입니다.
      </div>
    </div>
  );
});
ReportSheet.displayName = 'ReportSheet';

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-gray-200 rounded-xl p-4">
      <h3 className="text-[15px] font-semibold text-gray-900 mb-2">{title}</h3>
      {children}
    </section>
  );
}

function KPI({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-50 px-3 py-3">
      <div className="text-[15px] text-gray-500 mb-1">{label}</div>
      <div className="text-[15px] font-semibold text-gray-900 leading-snug">{value}</div>
    </div>
  );
}
