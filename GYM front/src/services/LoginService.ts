import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from '../app/config.service';

@Injectable({
  providedIn: 'root',
})

export class LoginService {
  private isLoggedIn = new BehaviorSubject<boolean>(false);
  rota!: string; // Declare a variável rota sem inicializá-la imediatamente

  constructor(private http: HttpClient,private configService: ConfigService) {
     // Verifica se o código está sendo executado no navegador
     if (typeof window !== 'undefined' && window.localStorage) {
        const user = localStorage.getItem('user');
        if (user) {
          this.isLoggedIn.next(true);
        }
      }
         // Inicialize a variável rota dentro do construtor
    this.rota = this.configService.rota;
  }
  // Método para validar o login
  validarAcesso(login: string, senha: string) {
    return this.http.post(`${this.rota}validar-acesso`, { login, senha });
  }

  // Método para verificar se o usuário está logado
  getIsLoggedIn() {
    return this.isLoggedIn.asObservable();
  }

  // Método para atualizar o status de login
  setIsLoggedIn(status: boolean) {
    this.isLoggedIn.next(status);
  }

  // Método para fazer logout
  logout() {
    localStorage.removeItem('user');
    this.isLoggedIn.next(false);
  }
}
