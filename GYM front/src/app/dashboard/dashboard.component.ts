import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.less']
})
export class DashboardComponent implements OnInit {
  mostrarSidebar: boolean = true; // A sidebar é visível por padrão

  constructor(private router: Router) {}

  ngOnInit() {
    // Verifica se o usuário está logado e ajusta a visibilidade da sidebar
    const usuario = localStorage.getItem('user');
    if (!usuario) {
      this.mostrarSidebar = false; // Se não estiver logado, oculta a sidebar
    }
  }

  logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('nivelAcesso'); // Remove o nível de acesso ao fazer logout
    this.mostrarSidebar = false; // Garante que a sidebar seja escondida
    this.router.navigate(['/login']);
  }
}
