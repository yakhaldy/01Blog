import { Component, signal, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Toast } from './components/toast/toast';
import { ToastService } from './toast-service';
@Component({
  standalone: true,
  selector: 'app-root',
  imports: [RouterOutlet ,Toast],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  @ViewChild(Toast) toast!: Toast;

  constructor(private toastSrevice: ToastService ){}

  ngAfterViewInit(){
    this.toastSrevice.register(this.toast)
  }
  protected readonly title = signal('01Blog');
}
