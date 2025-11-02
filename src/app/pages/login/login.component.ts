import { Component, inject, OnInit } from '@angular/core';
import { HeaderComponent } from '../../shared/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    CommonModule,
    MatInputModule,
    MatFormFieldModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit {
  login!: FormGroup;
  loginError: string | null = null;

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    this.login = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  onSubmit(): void {
    this.loginError = null;
    if (this.login.valid) {
      this.authService.login(this.login.value).subscribe({
        next: (response) => {
          console.log('Login bem-sucedido', response);
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          if (err.status === 401 || err.status === 404) {
            this.loginError = 'Email ou senha incorretos.';
          } else {
            this.loginError = 'Ocorreu um erro. Tente novamente mais tarde.';
          }
          console.error('Erro no login', err);
        },
      });
    } else {
      this.login.markAllAsTouched();
    }
  }
}
