// import { Routes } from '@angular/router';
// import { Content1Component } from './content1/content1.component';
// import { Content2Component } from './content2/content2.component';
// import { Content3Component } from './content3/content3.component';
// import { LoginComponent } from './login/login.component';
// import { authGuard } from './auth.guard';
// import { Content4Component } from './content4/content4.component';
// import { Content5Component } from './content5/content5.component';

// export const routes: Routes = [
//   // { path: 'login', component: LoginComponent },
//   { path: 'content1', component: Content1Component,  }, // Protege a rota
//   { path: 'content2', component: Content2Component, }, // Protege a rota
//   { path: 'content3', component: Content3Component, }, // Protege a rota
//   { path: 'content4', component: Content4Component, }, // Protege a rota
//   { path: 'content5', component: Content5Component, }, // Protege a rota
//   { path: '**', redirectTo: 'content1', pathMatch: 'full' } // Redireciona para login se a rota não for encontrada
// ];


import { Routes } from '@angular/router';
import { Content1Component } from './content1/content1.component';
import { Content2Component } from './content2/content2.component';
import { Content3Component } from './content3/content3.component';
import { LoginComponent } from './login/login.component';
import { authGuard } from './auth.guard';  // O guarda de rota
import { Content4Component } from './content4/content4.component';
import { Content5Component } from './content5/content5.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'content1', component: Content1Component, canActivate: [authGuard] }, // Protege a rota
  { path: 'content2', component: Content2Component, canActivate: [authGuard] }, // Protege a rota
  { path: 'content3', component: Content3Component, canActivate: [authGuard] }, // Protege a rota
  { path: 'content4', component: Content4Component, canActivate: [authGuard] }, // Protege a rota
  { path: 'content5', component: Content5Component, canActivate: [authGuard] }, // Protege a rota
  { path: '**', redirectTo: 'login', pathMatch: 'full' } // Redireciona para login se a rota não for encontrada
];
