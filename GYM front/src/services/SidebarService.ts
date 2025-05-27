import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class SidebarService {
    private sidebarVisibilitySubject = new BehaviorSubject<boolean>(false); // Define o estado inicial da sidebar
    sidebarVisibility$ = this.sidebarVisibilitySubject.asObservable(); // Observar o estado
    private permissoesSubject = new BehaviorSubject<string[]>([]);  // Para as permissões de botões
    private userLevelSubject = new BehaviorSubject<number | null>(null); // Nível do usuário
    userLevel$ = this.userLevelSubject.asObservable();
    permissoes$ = this.permissoesSubject.asObservable();
    constructor() { }

    // Método para mostrar a sidebar
    showSidebar(): void {
        this.sidebarVisibilitySubject.next(true);
        // console.log('Sidebar exibida');
    }

    // Método para ocultar a sidebar
    hideSidebar(): void {
        this.sidebarVisibilitySubject.next(false);
        // console.log('Sidebar ocultada');
    }

    definirPermissoes(nivelAcesso: number) {
        let permissoes: string[] = [];

        if (nivelAcesso === 1) {
            permissoes = ['dashboard', 'mapa', 'simulacao', 'logout','monitoramento','academias'];
        } else if (nivelAcesso === 2) {
            permissoes = ['dashboard', 'mapa', 'logout'];
        } else {
            permissoes = ['dashboard', 'logout'];
        }

        this.permissoesSubject.next(permissoes);  // Emite as permissões
    }

    limparPermissoes(permissoes: string[] = []) {
        this.permissoesSubject.next(permissoes);
      }

}
