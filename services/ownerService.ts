import dbConnect from '@/lib/db';
import Property from '@/models/Property';
import Rent from '@/models/Rent';
import RentPayment from '@/models/RentPayment';
import PropertyExpense from '@/models/PropertyExpense';
import MaintenanceRequest from '@/models/MaintenanceRequest';
import Application from '@/models/Application';

type FinancialBucket = {
  scheduledMonthlyRent: number;
  collectedThisMonth: number;
  overdueRent: number;
  expensesThisMonth: number;
  noiThisMonth: number;
};

function monthBounds(date = new Date()) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
  return { start, end };
}

function monthlyEquivalent(amount: number, frequency: string) {
  if (frequency === 'weekly') return amount * 52 / 12;
  if (frequency === 'yearly') return amount / 12;
  return amount;
}

function overduePeriods(nextDue: Date, frequency: string, now = new Date()) {
  if (nextDue >= now) return 0;
  const diffMs = now.getTime() - nextDue.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);
  if (frequency === 'weekly') return Math.floor(diffDays / 7) + 1;
  if (frequency === 'yearly') {
    return Math.max(1, now.getUTCFullYear() - nextDue.getUTCFullYear() + 1);
  }
  return Math.max(
    1,
    (now.getUTCFullYear() - nextDue.getUTCFullYear()) * 12 +
      (now.getUTCMonth() - nextDue.getUTCMonth()) + 1
  );
}

function emptyFinancials(): FinancialBucket {
  return {
    scheduledMonthlyRent: 0,
    collectedThisMonth: 0,
    overdueRent: 0,
    expensesThisMonth: 0,
    noiThisMonth: 0,
  };
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export default class OwnerService {
  static async getOverview(ownerId: string) {
    await dbConnect();
    const now = new Date();
    const { start: monthStart, end: monthEnd } = monthBounds(now);
    const sixtyDays = new Date(now.getTime() + 60 * 86_400_000);

    const properties = await Property.find({ owner: ownerId })
      .select('_id title purpose status price currency address trustScore trustLevel verified images')
      .sort({ createdAt: -1 })
      .lean();
    const propertyIds = properties.map((property: any) => property._id);

    const [rents, payments, expenses, maintenance, pendingApplications] = await Promise.all([
      Rent.find({ property: { $in: propertyIds }, status: { $in: ['active', 'paused'] } })
        .populate('tenant', 'name email phone')
        .lean(),
      RentPayment.find({
        host: ownerId,
        status: 'paid',
        paidAt: { $gte: monthStart, $lt: monthEnd },
      }).lean(),
      PropertyExpense.find({
        owner: ownerId,
        status: 'recorded',
        incurredAt: { $gte: monthStart, $lt: monthEnd },
      }).lean(),
      MaintenanceRequest.find({
        host: ownerId,
        status: { $in: ['pending', 'acknowledged', 'in-progress'] },
      }).select('_id property title priority status scheduledDate estimatedCost').lean(),
      Application.countDocuments({ host: ownerId, status: { $in: ['pending', 'more_info'] } }),
    ]);

    const rentByProperty = new Map<string, any>();
    for (const rent of rents as any[]) {
      if (rent.status === 'active') rentByProperty.set(String(rent.property), rent);
    }

    const paymentsByProperty = new Map<string, number>();
    for (const payment of payments as any[]) {
      const key = String(payment.property);
      paymentsByProperty.set(key, (paymentsByProperty.get(key) || 0) + Number(payment.amount || 0));
    }

    const expensesByProperty = new Map<string, number>();
    for (const expense of expenses as any[]) {
      const key = String(expense.property);
      expensesByProperty.set(key, (expensesByProperty.get(key) || 0) + Number(expense.amount || 0));
    }

    const maintenanceByProperty = new Map<string, number>();
    for (const request of maintenance as any[]) {
      const key = String(request.property);
      maintenanceByProperty.set(key, (maintenanceByProperty.get(key) || 0) + 1);
    }

    const financialsByCurrency: Record<string, FinancialBucket> = {};
    const ensureBucket = (currency: string) => {
      const key = (currency || 'LKR').toUpperCase();
      if (!financialsByCurrency[key]) financialsByCurrency[key] = emptyFinancials();
      return financialsByCurrency[key];
    };

    let overdueAgreements = 0;
    let expiringLeases = 0;
    const alerts: any[] = [];

    for (const rent of rents as any[]) {
      if (rent.status !== 'active') continue;
      const currency = String(rent.currency || 'LKR').toUpperCase();
      const bucket = ensureBucket(currency);
      bucket.scheduledMonthlyRent += monthlyEquivalent(Number(rent.amount || 0), rent.frequency);

      const due = new Date(rent.nextDue);
      const periods = overduePeriods(due, rent.frequency, now);
      if (periods > 0) {
        overdueAgreements += 1;
        const outstanding = Number(rent.amount || 0) * periods;
        bucket.overdueRent += outstanding;
        alerts.push({
          type: 'rent-overdue',
          severity: (now.getTime() - due.getTime()) / 86_400_000 > 7 ? 'critical' : 'warning',
          title: 'Rent overdue',
          description: `${currency} ${roundMoney(outstanding).toLocaleString()} outstanding`,
          propertyId: String(rent.property),
          rentId: String(rent._id),
          dueDate: due,
        });
      }

      if (rent.leaseEndDate) {
        const leaseEnd = new Date(rent.leaseEndDate);
        if (leaseEnd >= now && leaseEnd <= sixtyDays) {
          expiringLeases += 1;
          alerts.push({
            type: 'lease-expiry',
            severity: 'warning',
            title: 'Lease expiring soon',
            description: `Lease ends ${leaseEnd.toLocaleDateString()}`,
            propertyId: String(rent.property),
            rentId: String(rent._id),
            dueDate: leaseEnd,
          });
        }
      }
    }

    for (const payment of payments as any[]) {
      ensureBucket(String(payment.currency || 'LKR')).collectedThisMonth += Number(payment.amount || 0);
    }
    for (const expense of expenses as any[]) {
      ensureBucket(String(expense.currency || 'LKR')).expensesThisMonth += Number(expense.amount || 0);
    }
    for (const bucket of Object.values(financialsByCurrency)) {
      bucket.scheduledMonthlyRent = roundMoney(bucket.scheduledMonthlyRent);
      bucket.collectedThisMonth = roundMoney(bucket.collectedThisMonth);
      bucket.overdueRent = roundMoney(bucket.overdueRent);
      bucket.expensesThisMonth = roundMoney(bucket.expensesThisMonth);
      bucket.noiThisMonth = roundMoney(bucket.collectedThisMonth - bucket.expensesThisMonth);
    }

    for (const request of maintenance as any[]) {
      if (request.priority === 'urgent' || request.priority === 'high') {
        alerts.push({
          type: 'maintenance',
          severity: request.priority === 'urgent' ? 'critical' : 'warning',
          title: `${request.priority === 'urgent' ? 'Urgent' : 'High priority'} maintenance`,
          description: request.title,
          propertyId: String(request.property),
          maintenanceId: String(request._id),
          dueDate: request.scheduledDate,
        });
      }
    }

    const rentableProperties = properties.filter((property: any) => property.purpose === 'rent');
    const occupiedPropertyIds = new Set(
      (rents as any[]).filter((rent) => rent.status === 'active').map((rent) => String(rent.property))
    );
    const occupiedProperties = rentableProperties.filter((property: any) => occupiedPropertyIds.has(String(property._id))).length;
    const vacantProperties = Math.max(0, rentableProperties.length - occupiedProperties);

    const portfolio = properties.map((property: any) => {
      const propertyId = String(property._id);
      const rent = rentByProperty.get(propertyId);
      const collected = paymentsByProperty.get(propertyId) || 0;
      const spent = expensesByProperty.get(propertyId) || 0;
      const due = rent?.nextDue ? new Date(rent.nextDue) : null;
      const periods = due ? overduePeriods(due, rent.frequency, now) : 0;
      const outstanding = rent ? Number(rent.amount || 0) * periods : 0;

      return {
        propertyId,
        title: property.title,
        purpose: property.purpose,
        status: property.status,
        currency: property.currency || rent?.currency || 'LKR',
        address: property.address,
        trustScore: property.trustScore || 0,
        trustLevel: property.trustLevel || 'unverified',
        image: property.images?.[0],
        occupancy: property.purpose !== 'rent' ? 'non-rental' : rent ? 'occupied' : 'vacant',
        tenant: rent?.tenant ? {
          id: String(rent.tenant._id),
          name: rent.tenant.name,
          email: rent.tenant.email,
          phone: rent.tenant.phone,
        } : null,
        rent: rent ? {
          id: String(rent._id),
          amount: Number(rent.amount),
          currency: rent.currency || 'LKR',
          frequency: rent.frequency,
          nextDue: rent.nextDue,
          leaseStartDate: rent.leaseStartDate,
          leaseEndDate: rent.leaseEndDate,
          securityDeposit: Number(rent.securityDeposit || 0),
          depositStatus: rent.depositStatus,
          totalPaid: Number(rent.totalPaid || 0),
          paymentsCount: Number(rent.paymentsCount || 0),
          overdue: periods > 0,
          outstandingAmount: roundMoney(outstanding),
        } : null,
        collectedThisMonth: roundMoney(collected),
        expensesThisMonth: roundMoney(spent),
        noiThisMonth: roundMoney(collected - spent),
        openMaintenance: maintenanceByProperty.get(propertyId) || 0,
      };
    });

    alerts.sort((a, b) => {
      const severity = { critical: 0, warning: 1, info: 2 } as Record<string, number>;
      return (severity[a.severity] ?? 9) - (severity[b.severity] ?? 9);
    });

    return {
      generatedAt: now,
      metrics: {
        totalProperties: properties.length,
        activeListings: properties.filter((property: any) => property.status === 'active').length,
        rentableProperties: rentableProperties.length,
        occupiedProperties,
        vacantProperties,
        occupancyRate: rentableProperties.length ? Math.round((occupiedProperties / rentableProperties.length) * 1000) / 10 : 0,
        overdueAgreements,
        expiringLeases,
        openMaintenance: maintenance.length,
        urgentMaintenance: (maintenance as any[]).filter((request) => request.priority === 'urgent').length,
        pendingApplications,
      },
      financialsByCurrency,
      portfolio,
      alerts: alerts.slice(0, 20),
    };
  }
}
