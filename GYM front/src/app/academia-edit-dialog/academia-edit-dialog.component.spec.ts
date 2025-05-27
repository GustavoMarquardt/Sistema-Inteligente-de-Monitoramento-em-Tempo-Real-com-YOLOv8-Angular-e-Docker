import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AcademiaEditDialogComponent } from './academia-edit-dialog.component';

describe('AcademiaEditDialogComponent', () => {
  let component: AcademiaEditDialogComponent;
  let fixture: ComponentFixture<AcademiaEditDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AcademiaEditDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AcademiaEditDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
