import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ReportDialog } from './report-dialog';

describe('ReportDialog', () => {
  let component: ReportDialog;
  let fixture: ComponentFixture<ReportDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportDialog],
      providers: [
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: { type: 'user', targetId: '123' } }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ReportDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
