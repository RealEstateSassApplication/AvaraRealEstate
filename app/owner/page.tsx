'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  Home,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Users,
  Wrench,
} from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/ui/layout/Header';
import RecordExpenseDialog from '@/components/owner/RecordExpenseDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type FinancialBucket = {
  scheduledMonthlyRent: number;
  collectedThisMonth: number;
  overdueRent: number;
  expensesThisMonth: number;
  noiThisMonth: number;
};

type PortfolioItem = {
  propertyId: string;
  title: string;
  purpose: string;
  status: string;
  currency: string;
  address?: { city?: string; district?: string };
  trustScore: number;
  trustLevel: string;
  image?: string;
  occupancy: 'occupied' | 'vacant' | 'non-rental';
  tenant?: { id: string; name: string; email?: string; phone?: string } | null;
  rent?: {
    id: string;
    amount: number;
    currency: string;
    frequency: string;
    nextDue: string;
    leaseStartDate?: string;
    leaseEndDate?: string;
    securityDeposit: number;
    depositStatus: string;
    totalPaid: number;
    paymentsCount: number;
    overdue: boolean;
    outstandingAmount: number;
  } | null;
  collectedThisMonth: number;
  expensesThisMonth: number;
  noiThisMonth: number;
  openMaintenance: number;
};

type OwnerOverview = {
  generatedAt: string;
  metrics: {
    totalProperties: number;
    activeListings: number;
    rentableProperties: number;
    occupiedProperties: number;
    vacantProperties: number;
    occupancyRate: number;
    overdueAgreements: number;
    expiringLeases: number;
    openMaintenance: number;
    urgentMaintenance: number;
    pendingApplications: number;
  };
  financialsByCurrency: Record<string, FinancialBucket>;
  portfolio: PortfolioItem[];
  alerts: Array<{
    type: string;
    severity: 'critical' | 'warning' | 'info';
    title: string;
    description: string;
    propertyId?: string;
    rentId?: string;
    maintenanceId?: string;
    dueDate?: string;
  }>;
};

type Payment = {
  _id: string;
  amount: number;
  currency: string;
  dueDate: string;
  paidAt: string;
  method: string;
  providerReference?: string;
  property?: { _id: string; title: string; address?: { city?: string } };
  tenant?: { name?: string; email?: string };
  recordedBy?: { name?: string };
};

type Expense = {
  _id: string;
  category: string;
  amount: number;
  currency: string;
  incurredAt: string;
  description: string;
  vendor?: string;
  property?: { _id: string; title: string; address?: { city?: string } };
};

type TenantEntry = {
  rentId: string;
  status: string;
  tenant?: { name?: string; email?: string; phone?: string; verified?: boolean };
  property?: { _id?: string; title?: string; address?: { city?: string } };
  amount: number;
  currency: string;
  frequency: string;
  nextDue: string;
  overdue: boolean;
  leaseStartDate?: string;
  leaseEndDate?: string;
  securityDeposit: number;
  depositStatus: string;
  totalPaid: number;
  paymentsCount: number;
  lastPaidAt?: string;
};

const emptyFinancials: FinancialBucket = {
  scheduledMonthlyRent: 0,
  collectedThisMonth: 0,
  overdueRent: 0,
  expensesThisMonth: 0,
  noiThisMonth: 0,
};

function money(value: number, currency = 'LKR') {
  try {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(Number(value) || 0);
  } catch {
    return `${currency} ${(Number(value) || 0).toLocaleString()}`;
  }
}

function dateLabel(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: 'numeric' });
}

function MetricCard({ label, value, helper, icon: Icon }: { label: string; value: string; helper?: string; icon: any }) {
  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{value}</p>
            {helper && <p className="mt-1 text-xs text-slate-500">{helper}</p>}
          </div>
          <div className="rounded-xl bg-slate-950 p-2.5 text-white">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function OwnerWorkspace() {
  const [overview, setOverview] = useState<OwnerOverview | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [tenants, setTenants] = useState<TenantEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('LKR');

  const fetchJson = async (url: string) => {
    const response = await fetch(url, { cache: 'no-store' });
    if (response.status === 401) {
      const next = encodeURIComponent('/owner');
      window.location.href = `/auth/login?next=${next}`;
      throw new Error('Authentication required');
    }
    const json = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(json.error || 'Request failed');
    return json;
  };

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setRefreshing(true);
    try {
      const [overviewJson, paymentsJson, expensesJson, tenantsJson] = await Promise.all([
        fetchJson('/api/owner/overview'),
        fetchJson('/api/owner/payments?limit=100'),
        fetchJson('/api/owner/expenses?limit=100'),
        fetchJson('/api/owner/tenants'),
      ]);

      const nextOverview = overviewJson.data as OwnerOverview;
      setOverview(nextOverview);
      setPayments(paymentsJson.data || []);
      setExpenses(expensesJson.data || []);
      setTenants(tenantsJson.data || []);

      const currencies = Object.keys(nextOverview?.financialsByCurrency || {});
      if (currencies.length && !currencies.includes(selectedCurrency)) {
        setSelectedCurrency(currencies.includes('LKR') ? 'LKR' : currencies[0]);
      }
    } catch (error: any) {
      if (error?.message !== 'Authentication required') {
        toast.error(error?.message || 'Failed to load Owner OS');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCurrency]);

  useEffect(() => {
    void load();
  }, [load]);

  const financials = overview?.financialsByCurrency?.[selectedCurrency] || emptyFinancials;
  const currencies = Object.keys(overview?.financialsByCurrency || {});
  const portfolio = overview?.portfolio || [];

  const occupied = useMemo(() => portfolio.filter((item) => item.occupancy === 'occupied').length, [portfolio]);

  const voidExpense = async (expenseId: string) => {
    if (!window.confirm('Void this expense? It will remain in the audit trail but stop affecting portfolio financials.')) return;
    try {
      const response = await fetch(`/api/owner/expenses/${expenseId}`, { method: 'DELETE' });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(json.error || 'Failed to void expense');
      toast.success('Expense voided');
      await load(true);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to void expense');
    }
  };

  if (loading && !overview) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="h-40 animate-pulse rounded-3xl bg-slate-200" />
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {[0, 1, 2, 3, 4, 5].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl bg-slate-200" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-3xl bg-slate-950 p-7 text-white shadow-xl md:p-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/75">
                <ShieldCheck className="h-4 w-4" /> Avara Owner OS
              </div>
              <h1 className="text-3xl font-bold tracking-tight md:text-5xl">Operate your property portfolio from one place.</h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/65 md:text-base">
                Listings, tenants, rent collection, expenses, maintenance and portfolio health use the same Avara property graph—so operations stay connected to the marketplace instead of living in another app.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <RecordExpenseDialog
                properties={portfolio.map((item) => ({ propertyId: item.propertyId, title: item.title, currency: item.currency }))}
                onCreated={() => load(true)}
              />
              <Button asChild variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                <Link href="/host/rents/create">Create lease</Link>
              </Button>
              <Button asChild variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                <Link href="/host/listings/create">Add property</Link>
              </Button>
            </div>
          </div>
        </section>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {currencies.length > 0 ? currencies.map((currency) => (
              <Button
                key={currency}
                size="sm"
                variant={selectedCurrency === currency ? 'default' : 'outline'}
                onClick={() => setSelectedCurrency(currency)}
              >
                {currency}
              </Button>
            )) : <Badge variant="outline">No financial activity yet</Badge>}
          </div>
          <Button variant="ghost" size="sm" onClick={() => load(true)} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <section className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <MetricCard label="Portfolio" value={String(overview?.metrics.totalProperties || 0)} helper={`${overview?.metrics.activeListings || 0} active listings`} icon={Building2} />
          <MetricCard label="Occupancy" value={`${overview?.metrics.occupancyRate || 0}%`} helper={`${occupied} occupied · ${overview?.metrics.vacantProperties || 0} vacant`} icon={Home} />
          <MetricCard label="Collected this month" value={money(financials.collectedThisMonth, selectedCurrency)} helper={`Scheduled ${money(financials.scheduledMonthlyRent, selectedCurrency)}`} icon={CircleDollarSign} />
          <MetricCard label="NOI this month" value={money(financials.noiThisMonth, selectedCurrency)} helper={`${money(financials.expensesThisMonth, selectedCurrency)} operating expenses`} icon={TrendingUp} />
          <MetricCard label="Overdue rent" value={money(financials.overdueRent, selectedCurrency)} helper={`${overview?.metrics.overdueAgreements || 0} agreements`} icon={AlertTriangle} />
          <MetricCard label="Maintenance" value={String(overview?.metrics.openMaintenance || 0)} helper={`${overview?.metrics.urgentMaintenance || 0} urgent`} icon={Wrench} />
        </section>

        <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.35fr_.65fr]">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Portfolio pulse</CardTitle>
                <p className="mt-1 text-sm text-slate-500">The properties that need attention right now.</p>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/host/dashboard">Operations <ArrowUpRight className="ml-1 h-4 w-4" /></Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {portfolio.slice(0, 6).map((item) => (
                <div key={item.propertyId} className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/listings/${item.propertyId}`} className="truncate font-semibold hover:underline">{item.title}</Link>
                      <Badge variant={item.occupancy === 'occupied' ? 'default' : 'outline'} className="capitalize">{item.occupancy.replace('-', ' ')}</Badge>
                      <Badge variant="outline">Trust {item.trustScore}/100</Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{item.address?.city || 'Sri Lanka'}{item.tenant?.name ? ` · ${item.tenant.name}` : ''}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-5 text-right text-sm">
                    <div><p className="text-xs text-slate-400">Collected</p><p className="font-semibold">{money(item.collectedThisMonth, item.rent?.currency || item.currency)}</p></div>
                    <div><p className="text-xs text-slate-400">NOI</p><p className="font-semibold">{money(item.noiThisMonth, item.rent?.currency || item.currency)}</p></div>
                    <div><p className="text-xs text-slate-400">Issues</p><p className="font-semibold">{item.openMaintenance}</p></div>
                  </div>
                </div>
              ))}
              {!portfolio.length && (
                <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center">
                  <Building2 className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-3 font-medium">Your Owner OS is ready for its first property.</p>
                  <Button asChild className="mt-4"><Link href="/host/listings/create">Add property</Link></Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> Attention</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(overview?.alerts || []).slice(0, 7).map((alert, index) => (
                <div key={`${alert.type}-${index}`} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${alert.severity === 'critical' ? 'bg-red-500' : alert.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                    <p className="text-sm font-semibold">{alert.title}</p>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{alert.description}</p>
                </div>
              ))}
              {!overview?.alerts?.length && (
                <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4 text-emerald-800">
                  <CheckCircle2 className="h-5 w-5" />
                  <p className="text-sm font-medium">Nothing urgent in the portfolio.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <Tabs defaultValue="portfolio" className="mt-8">
          <TabsList className="h-auto flex-wrap justify-start">
            <TabsTrigger value="portfolio"><Building2 className="mr-2 h-4 w-4" />Portfolio</TabsTrigger>
            <TabsTrigger value="tenants"><Users className="mr-2 h-4 w-4" />Tenants</TabsTrigger>
            <TabsTrigger value="payments"><CircleDollarSign className="mr-2 h-4 w-4" />Payments</TabsTrigger>
            <TabsTrigger value="expenses"><ReceiptText className="mr-2 h-4 w-4" />Expenses</TabsTrigger>
          </TabsList>

          <TabsContent value="portfolio" className="mt-4">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader><CardTitle>Property operations</CardTitle></CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Property</TableHead><TableHead>Occupancy</TableHead><TableHead>Rent / due</TableHead><TableHead>This month</TableHead><TableHead>Lease</TableHead><TableHead>Maintenance</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {portfolio.map((item) => (
                      <TableRow key={item.propertyId}>
                        <TableCell>
                          <div className="font-medium">{item.title}</div>
                          <div className="text-xs text-slate-500">{item.address?.city || 'Sri Lanka'} · Trust {item.trustScore}</div>
                        </TableCell>
                        <TableCell><Badge variant={item.occupancy === 'occupied' ? 'default' : 'outline'} className="capitalize">{item.occupancy}</Badge>{item.tenant?.name && <div className="mt-1 text-xs text-slate-500">{item.tenant.name}</div>}</TableCell>
                        <TableCell>
                          {item.rent ? <><div className="font-medium">{money(item.rent.amount, item.rent.currency)} / {item.rent.frequency}</div><div className={`text-xs ${item.rent.overdue ? 'font-medium text-red-600' : 'text-slate-500'}`}>{item.rent.overdue ? `Overdue ${money(item.rent.outstandingAmount, item.rent.currency)}` : `Due ${dateLabel(item.rent.nextDue)}`}</div></> : <span className="text-sm text-slate-400">No active lease</span>}
                        </TableCell>
                        <TableCell><div className="font-medium">NOI {money(item.noiThisMonth, item.rent?.currency || item.currency)}</div><div className="text-xs text-slate-500">Collected {money(item.collectedThisMonth, item.rent?.currency || item.currency)}</div></TableCell>
                        <TableCell>{item.rent?.leaseEndDate ? <><div>{dateLabel(item.rent.leaseEndDate)}</div><div className="text-xs text-slate-500">Deposit: {item.rent.depositStatus}</div></> : '—'}</TableCell>
                        <TableCell><Badge variant={item.openMaintenance ? 'destructive' : 'outline'}>{item.openMaintenance} open</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tenants" className="mt-4">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader><CardTitle>Tenant directory</CardTitle></CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Tenant</TableHead><TableHead>Property</TableHead><TableHead>Rent</TableHead><TableHead>Next due</TableHead><TableHead>Lease ends</TableHead><TableHead>Collected</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {tenants.map((entry) => (
                      <TableRow key={entry.rentId}>
                        <TableCell><div className="font-medium">{entry.tenant?.name || 'Tenant'}</div><div className="text-xs text-slate-500">{entry.tenant?.email || entry.tenant?.phone || '—'}</div></TableCell>
                        <TableCell>{entry.property?.title || 'Property'}<div className="text-xs text-slate-500">{entry.property?.address?.city || ''}</div></TableCell>
                        <TableCell>{money(entry.amount, entry.currency)} / {entry.frequency}</TableCell>
                        <TableCell><span className={entry.overdue ? 'font-semibold text-red-600' : ''}>{dateLabel(entry.nextDue)}</span></TableCell>
                        <TableCell>{dateLabel(entry.leaseEndDate)}</TableCell>
                        <TableCell>{money(entry.totalPaid, entry.currency)}<div className="text-xs text-slate-500">{entry.paymentsCount} payments</div></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="mt-4">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader><CardTitle>Rent payment ledger</CardTitle></CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Paid</TableHead><TableHead>Property</TableHead><TableHead>Tenant</TableHead><TableHead>Period due</TableHead><TableHead>Amount</TableHead><TableHead>Method</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment._id}>
                        <TableCell>{dateLabel(payment.paidAt)}</TableCell>
                        <TableCell>{payment.property?.title || 'Property'}</TableCell>
                        <TableCell>{payment.tenant?.name || 'Tenant'}</TableCell>
                        <TableCell>{dateLabel(payment.dueDate)}</TableCell>
                        <TableCell className="font-semibold">{money(payment.amount, payment.currency)}</TableCell>
                        <TableCell className="capitalize">{payment.method.replace('-', ' ')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expenses" className="mt-4">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Expense ledger</CardTitle><RecordExpenseDialog properties={portfolio.map((item) => ({ propertyId: item.propertyId, title: item.title, currency: item.currency }))} onCreated={() => load(true)} /></CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Property</TableHead><TableHead>Category</TableHead><TableHead>Description</TableHead><TableHead>Amount</TableHead><TableHead /></TableRow></TableHeader>
                  <TableBody>
                    {expenses.map((expense) => (
                      <TableRow key={expense._id}>
                        <TableCell>{dateLabel(expense.incurredAt)}</TableCell>
                        <TableCell>{expense.property?.title || 'Property'}</TableCell>
                        <TableCell><Badge variant="outline" className="capitalize">{expense.category}</Badge></TableCell>
                        <TableCell><div className="max-w-sm truncate">{expense.description}</div>{expense.vendor && <div className="text-xs text-slate-500">{expense.vendor}</div>}</TableCell>
                        <TableCell className="font-semibold">{money(expense.amount, expense.currency)}</TableCell>
                        <TableCell><Button size="sm" variant="ghost" onClick={() => voidExpense(expense._id)}>Void</Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="border-slate-200"><CardContent className="p-5"><CalendarClock className="h-5 w-5" /><p className="mt-3 text-2xl font-bold">{overview?.metrics.expiringLeases || 0}</p><p className="text-sm text-slate-500">leases expiring in 60 days</p></CardContent></Card>
          <Card className="border-slate-200"><CardContent className="p-5"><ClipboardList className="h-5 w-5" /><p className="mt-3 text-2xl font-bold">{overview?.metrics.pendingApplications || 0}</p><p className="text-sm text-slate-500">applications awaiting action</p></CardContent></Card>
          <Card className="border-slate-200"><CardContent className="p-5"><Wrench className="h-5 w-5" /><p className="mt-3 text-2xl font-bold">{overview?.metrics.urgentMaintenance || 0}</p><p className="text-sm text-slate-500">urgent maintenance cases</p></CardContent></Card>
        </section>
      </main>
    </div>
  );
}
