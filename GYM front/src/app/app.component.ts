import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from './sidebar/sidebar.component';
import { SidebarService } from '../services/SidebarService';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, SidebarComponent],
  template: `
    <div class="dashboard-layout" [class.sidebar-hidden]="!mostrarSidebar">
      <!-- Sidebar -->
      <app-sidebar *ngIf="mostrarSidebar"></app-sidebar>

      <!-- Main Content -->
      <div class="main-content" [ngClass]="{ 'no-margin': isLoginPage }">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styleUrls: ['./app.component.less'],
})
export class AppComponent implements OnInit {
  title = 'GYM';
  mostrarSidebar = true;
  isLoginPage = false;

  constructor(private router: Router, private sidebarService: SidebarService) {
    // Controla a visibilidade da sidebar com base na URL
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.mostrarSidebar = event.url !== '/login'; // Oculta a sidebar na tela de login
        this.isLoginPage = event.url === '/login'; // Verifica se está na tela de login
        if (this.mostrarSidebar) {
          this.sidebarService.showSidebar();
        } else {
          this.sidebarService.hideSidebar();
        }
      }
    });
  }

  ngOnInit(): void {
    // Lógica adicional no início da aplicação
  }
}
