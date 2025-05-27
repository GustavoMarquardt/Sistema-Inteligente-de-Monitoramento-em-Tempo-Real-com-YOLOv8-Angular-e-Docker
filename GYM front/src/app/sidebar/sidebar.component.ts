import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SidebarService } from '../../services/SidebarService';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.less']
})
export class SidebarComponent {
  mostrarSidebar = true;
  permissoes: string[] = [];  // Armazena as permissões

  constructor(
    private router: Router,
    private sidebarService: SidebarService
  ) {}
  
  ngOnInit(): void {
    //this.simularLogin();  //QUANDO FOR TESTAR, DESCOMENTE ESSA LINHA E COMENTAR O RESTO PARA BAIXO
    // Inscrever-se para receber permissões do SidebarService
    this.sidebarService.permissoes$.subscribe((permissoes) => {
      if (permissoes && permissoes.length > 0) {
        this.permissoes = permissoes;
        console.log('Permissões carregadas:', permissoes);
      } else {
        const permissoesSalvas = localStorage.getItem('permissoes');
        if (permissoesSalvas) {
          this.permissoes = JSON.parse(permissoesSalvas);
          console.log('Permissões carregadas do localStorage:', this.permissoes);
        } else {
          console.error('Nenhuma permissão encontrada. Redirecionando para o login...');
          this.router.navigate(['/login']);
        }
      }
    });
  
    // Verificar visibilidade da sidebar
    this.sidebarService.sidebarVisibility$.subscribe((isVisible) => {
      this.mostrarSidebar = isVisible;
    });
  }

  simularLogin(): void {
    // Definir permissões diretamente (Adicionando as permissões que o usuário deve ter)
    this.permissoes = ['dashboard', 'mapa', 'simulacao', 'logout', 'academias', 'monitoramento']; // Permissões completas para teste
    
    // Simular o usuário com o formato desejado
    const usuarioSimulado = {
      mensagem: 'Acesso validado com sucesso',
      usuario: {
        id: 1,
        nivelAcesso: 1,
        academiaID: 3
      }
    };
    
    // Salva o objeto do usuário simulado e permissões no localStorage
    localStorage.setItem('permissoes', JSON.stringify(this.permissoes)); // Salva as permissões no localStorage
    localStorage.setItem('user', JSON.stringify(usuarioSimulado)); // Salva o usuário simulado no formato correto
  
    console.log('Usuário e permissões configurados para simulação de login');
    
    // Redireciona para a tela inicial após a simulação
    this.router.navigate(['/content1']);
  }

  logout() {
    // Remover itens do localStorage relacionados à autenticação
    localStorage.removeItem('user');
    localStorage.removeItem('permissoes');
    localStorage.removeItem('nivelAcesso'); // Caso esteja salvando o nível de acesso
  
    // Resetar permissões e ocultar a sidebar
    this.permissoes = [];
    this.sidebarService.limparPermissoes([]); // Resetar permissões no serviço
    this.sidebarService.hideSidebar(); // Ocultar a sidebar
  
    // Navegar para a página de login
    this.router.navigate(['/login']);
    
    // Mensagem de feedback no console (opcional)
    console.log('Logout realizado com sucesso. Redirecionando para o login...');
  }
}
