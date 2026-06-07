import { Component, signal, inject, OnInit } from '@angular/core';
import { LucideLoaderCircle, LucideAlertCircle, LucideRefreshCw, LucideMapPin, LucideCheck, LucideClock, LucideSend, LucideArrowLeft, LucideFileText, LucideLandmark, LucideCalendar, LucideBadgeCheck, LucideX, LucideBan } from '@lucide/angular';
import { PayoutService, PayoutTrip, PayoutRequest, PayoutRecord } from '../../../core/services/payout/payout.service';
import { toArabicNumerals, formatArabicDate } from '../../../pipes/arabic-number/arabic-number.util';

@Component({
  selector: 'app-payout',
  standalone: true,
  imports: [LucideLoaderCircle, LucideAlertCircle, LucideRefreshCw, LucideMapPin, LucideCheck, LucideClock, LucideSend, LucideArrowLeft, LucideFileText, LucideLandmark, LucideCalendar, LucideBadgeCheck, LucideX, LucideBan],
  templateUrl: './payout.html',
})
export class PayoutComponent implements OnInit {
  private svc = inject(PayoutService);

  trips = signal<PayoutTrip[]>([]);
  requests = signal<PayoutRequest[]>([]);
  history = signal<PayoutRecord[]>([]);
  stats = signal<{ totalUnpaidAmount: number; totalPaidAmount: number; pendingRequestCount: number } | null>(null);

  isLoading = signal(true);
  error = signal('');
  requestingTrip = signal<string | null>(null);
  requestingAll = signal(false);

  ngOnInit() { this.load(); }

  totalUnpaid = () => this.trips().reduce((sum, t) => sum + (t.paidOut ? 0 : t.unpaidAmount), 0);

  allDisabled = () => this.trips().length === 0 || this.trips().every(t => t.paidOut || t.hasPendingRequest);

  load() {
    this.isLoading.set(true);
    this.error.set('');
    this.svc.getTrips().subscribe({
      next: r => this.trips.set(r.data),
      error: () => {},
    });
    this.svc.getRequests().subscribe({
      next: r => this.requests.set(r.data),
      error: () => {},
    });
    this.svc.getHistory().subscribe({
      next: r => this.history.set(r.data),
      error: () => {},
    });
    this.svc.getDashboardStats().subscribe({
      next: r => { this.stats.set(r.data); this.isLoading.set(false); },
      error: e => { this.error.set(e?.error?.message ?? 'حدث خطأ'); this.isLoading.set(false); },
    });
  }

  requestSingle(tripId: string) {
    this.requestingTrip.set(tripId);
    this.svc.requestPayout(tripId).subscribe({
      next: () => {
        this.requestingTrip.set(null);
        this.load();
      },
      error: () => {
        this.requestingTrip.set(null);
      },
    });
  }

  requestAll() {
    this.requestingAll.set(true);
    this.svc.requestPayout().subscribe({
      next: () => {
        this.requestingAll.set(false);
        this.load();
      },
      error: () => {
        this.requestingAll.set(false);
      },
    });
  }

  statusClass(status: string): string {
    switch (status) {
      case 'PENDING': return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'APPROVED': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'REJECTED': return 'bg-red-50 text-red-600 border-red-200';
      case 'CANCELLED': return 'bg-gray-50 text-gray-500 border-gray-200';
      default: return 'bg-gray-50 text-gray-500 border-gray-200';
    }
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'PENDING': return 'قيد الانتظار';
      case 'APPROVED': return 'تمت الموافقة';
      case 'REJECTED': return 'مرفوض';
      case 'CANCELLED': return 'ملغي';
      default: return status;
    }
  }

  toArabic(n: number | string): string { return toArabicNumerals(n); }
  fmtDate(d: string): string { return formatArabicDate(d); }
  fmtPrice(n: number): string { return `${toArabicNumerals(n)} ج.س`; }
}
