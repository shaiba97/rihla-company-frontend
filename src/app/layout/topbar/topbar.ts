import { Component, output, inject, computed, signal, HostListener, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs/operators';
import { LucideLayoutDashboard, LucideBus, LucideRoute, LucideTicket, LucideCalendar, LucideWallet, LucideUser, LucideBell, LucideBellOff, LucideSun, LucideMoon, LucideLogOut, LucideMenu, LucideChevronDown, LucideCheck, LucideX } from '@lucide/angular';
import { ThemeService } from '../../core/services/theme';
import { AuthService } from '../../core/services/auth';
import { WsService } from '../../core/services/ws.service';
import { NotificationService, NotificationItem } from '../../core/services/notification.service';

@Component({
  selector:    'app-topbar',
  standalone:  true,
  imports:     [LucideLayoutDashboard, LucideBus, LucideRoute, LucideTicket, LucideCalendar, LucideWallet, LucideUser, LucideBell, LucideBellOff, LucideSun, LucideMoon, LucideLogOut, LucideMenu, LucideChevronDown, LucideCheck, LucideX],
  templateUrl: './topbar.html',
})
export class TopbarComponent implements OnInit, OnDestroy {
  toggleSidebar  = output<void>();
  themeService   = inject(ThemeService);
  authService    = inject(AuthService);
  private router = inject(Router);
  private ws = inject(WsService);
  private notificationSvc = inject(NotificationService);
  private wsCleanups: (() => void)[] = [];

  showNotifications = signal<boolean>(false);
  showUserMenu      = signal<boolean>(false);
  unreadCount       = signal<number>(0);
  notifications     = signal<NotificationItem[]>([]);
  loadingNotifs     = signal(false);

  private pageMap: Record<string, { title: string }> = {
    '/dashboard':  { title: 'الرئيسية' },
    '/buses':      { title: 'الحافلات' },
    '/trips':      { title: 'الرحلات' },
    '/tickets':    { title: 'التذاكر' },
    '/bookings':   { title: 'الحجوزات' },
    '/financials': { title: 'التقارير المالية' },
    '/payout':     { title: 'المدفوعات' },
    '/profile':    { title: 'الملف الشخصي' },
  };

  private currentUrl = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map((e: NavigationEnd) => e.urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  currentPageTitle = computed(() => {
    const url = this.currentUrl() ?? '/dashboard';
    const key = Object.keys(this.pageMap).find(k => url.startsWith(k)) ?? '/dashboard';
    return this.pageMap[key].title;
  });

  currentPageKey = computed(() => {
    const url = this.currentUrl() ?? '/dashboard';
    return Object.keys(this.pageMap).find(k => url.startsWith(k)) ?? '/dashboard';
  });

  companyName = computed(() => this.authService.companyName());

  ngOnInit() {
    this.loadNotifications();
    this.wsCleanups.push(this.ws.on('notification:new', () => this.loadNotifications()));
  }

  ngOnDestroy() { this.wsCleanups.forEach(fn => fn()); }

  loadNotifications() {
    this.notificationSvc.findAll().subscribe({
      next: r => {
        this.notifications.set(r.notifications);
        this.unreadCount.set(r.unreadCount);
        this.loadingNotifs.set(false);
      },
    });
  }

  markRead(id: string) {
    this.notificationSvc.markRead(id).subscribe(() => this.loadNotifications());
  }

  markAllRead() {
    this.notificationSvc.markAllRead().subscribe(() => this.loadNotifications());
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent): void {
    const t = e.target as HTMLElement;
    if (!t.closest('[data-dropdown]')) {
      this.showNotifications.set(false);
      this.showUserMenu.set(false);
    }
  }
}