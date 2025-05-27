import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Component, OnInit, ChangeDetectorRef, Injectable, Inject, PLATFORM_ID, Output, EventEmitter } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import { HttpClientModule } from '@angular/common/http';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatRadioModule } from '@angular/material/radio';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatSortModule } from '@angular/material/sort';
import { MatDialogModule } from '@angular/material/dialog';
import { AcademiaService } from '../../services/AcademiaService';

// Registrar o plugin


@Component({
  selector: 'app-academia-edit-dialog',
  imports: [
    FormsModule,
    CommonModule,
    NgApexchartsModule,
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    ReactiveFormsModule,
    MatSliderModule,
    MatIconModule,
    MatSlideToggleModule,
    MatCheckboxModule,
    MatCardModule,
    MatRadioModule,
    FormsModule,
    MatProgressBarModule,
    MatDialogModule
  ],
  templateUrl: './academia-edit-dialog.component.html',
  styleUrl: './academia-edit-dialog.component.less'
})
export class AcademiaEditDialogComponent {
 academiaForm: FormGroup;
  @Output() cameraUpdated = new EventEmitter<any>()
  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AcademiaEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public academiaService: AcademiaService
  ) {
    this.academiaForm = this.fb.group({
      id: [data.id || '', [Validators.required]],         // ID da academia
      nome: [data.nome || '', [Validators.required]],     // Nome da academia
      altura: [data.altura || '', [Validators.required]], // Altura da academia
      width: [data.width || '', [Validators.required]],   // Largura da academia
      height: [data.height || '', [Validators.required]], // Altura (corrigido para 'height')
      ip_publico_academia: [data.ip_publico_academia || '', [Validators.required]], // Use 'ip_academia' aqui
      port: [data.port || 0, [Validators.required, Validators.min(1)]], // Porta da academia
      telefone: [data.telefone || '', []], // Telefone não obrigatório, sem Validators
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    const cameraId = this.data.id;
    const cameraData = this.academiaForm.value;
    
    console.log('cameraId:', cameraId);
    console.log('cameraData:', cameraData);
  
    this.academiaService.updateAcademia(cameraId, cameraData).subscribe({
      next: (response) => {
        console.log('Câmera atualizada com sucesso:', response);
        this.cameraUpdated.emit(); // Emite o evento de atualização
        if (!this.dialogRef.disableClose) {
          this.dialogRef.close(response); // Fechar apenas uma vez
        }
      },
      error: (error) => {
        console.error('Erro ao atualizar câmera:', error);
      },
    });
  }
}
