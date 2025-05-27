import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Component, OnInit, ChangeDetectorRef, Injectable, Inject, PLATFORM_ID, Output, EventEmitter } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import Chart from 'chart.js/auto';
import { ObjectService } from '../../services/ObjectService';
import Objeto from '../../objects/Objeto';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { DivisoesDeTreino } from '../../objects/divisoes_de_treino.enum';
import { HistoricoAparelhoService } from '../../services/HistoricoAparelhoService';
import HistoricoAparelho from '../../objects/HistoricoAparelho';
import { firstValueFrom } from 'rxjs';
import ApexCharts from 'apexcharts';
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
import { CameraService } from '../../services/CameraServices';

// Registrar o plugin

@Component({
  selector: 'app-camera-dialog',
  templateUrl: './camera-dialog.component.html',
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
  ]

})



export class CameraDialogComponent {
  cameraForm: FormGroup;
  @Output() cameraUpdated = new EventEmitter<any>()
  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<CameraDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public cameraService: CameraService
  ) {
    this.cameraForm = this.fb.group({
      ip_camera: [data.ip_camera || '', [Validators.required]],
      port: [data.port || 0, [Validators.required, Validators.min(1)]],
      login_camera: [data.login_camera || '', [Validators.required]],
      senha_camera: [data.senha_camera || '', [Validators.required]],
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    const cameraId = this.data.id;
    const cameraData = this.cameraForm.value;
    
    console.log('cameraId:', cameraId);
    console.log('cameraData:', cameraData);
  
    this.cameraService.updateCamera(cameraId, cameraData).subscribe({
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
