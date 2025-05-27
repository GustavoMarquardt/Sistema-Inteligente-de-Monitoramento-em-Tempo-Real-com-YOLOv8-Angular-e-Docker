import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LoginService } from '../../services/LoginService';
import { Router } from '@angular/router';
import { SidebarService } from '../../services/SidebarService';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.less'],
  imports: [
    CommonModule,
    MatInputModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatIconModule
  ]
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  hide = true;
  constructor(
    private fb: FormBuilder,
    private loginService: LoginService,
    private router: Router,
    private sidebarService: SidebarService,
    private snackBar: MatSnackBar,
  ) {
    this.loginForm = this.fb.group({
      acesso: ['', Validators.required],
      senha: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    // Garantir que a sidebar esteja oculta ao entrar na tela de login
    console.log(localStorage.getItem('user'));
  }

  login() {
    console.log(this.loginForm.value);
    const login = this.loginForm.value.acesso;
  
    this.loginService.validarAcesso(this.loginForm.value.acesso, this.loginForm.value.senha).subscribe(
      (res: any) => {
        console.log('Resposta:', res);
        this.atualizaLogin(res);
  
        // Salvar o nível de acesso e o login no localStorage
        if (res && res.usuario) {
          const nivelAcesso = res.usuario.nivelAcesso;
          localStorage.setItem('nivelAcesso', nivelAcesso.toString());
          localStorage.setItem('login', login);
  
          console.log('Nível de Acesso:', nivelAcesso);
          console.log('Login salvo no localStorage:', login);
  
          // Definir permissões no SidebarService com base no nível de acesso
          this.sidebarService.definirPermissoes(nivelAcesso);
  
          // Só redireciona após definir permissões
          this.sidebarService.permissoes$.subscribe((permissoes) => {
            if (permissoes && permissoes.length > 0) {
              console.log('Permissões definidas:', permissoes);
              this.sidebarService.showSidebar();
              this.router.navigate(['/content1']);
            } else {
              console.error('Permissões não definidas. Verifique a lógica.');
            }
          });
        }
      },
      (err) => {
        console.error('Erro:', err);
        this.snackBar.open('Login ou senha incorretos!', 'Fechar', {
          duration: 3000,
          panelClass: ['mat-toolbar', 'mat-warn'],
        });
      }
    );
  }
  
  
  

  atualizaLogin(usuario: any) {
    // Salvar algum dado (ex: token) que indique que o usuário está autenticado
    console.log('usuario', usuario);
    localStorage.setItem('user', JSON.stringify(usuario));
    this.loginService.setIsLoggedIn(true);
  }

  getIsLoggedIn() {
    return this.loginService.getIsLoggedIn();
  }

  logout() {
    localStorage.removeItem('user');
    this.loginService.setIsLoggedIn(false);
  }
}
