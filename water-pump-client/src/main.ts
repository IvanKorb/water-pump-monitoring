import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { MqttModule, IMqttServiceOptions } from 'ngx-mqtt';
import { routes } from './app/app.routes';
import { environment } from './environments/environment';
import { AuthInterceptor } from './app/interceptors/auth.interceptor';
import { TranslateModule, TranslateLoader, TranslateService } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { HttpLoaderFactory } from './app/shared/i18n/translate-loader-factory';

export const MQTT_SERVICE_OPTIONS: IMqttServiceOptions = {
  hostname: environment.mqttHost,
  port: 8883,
  path: '/mqtt',
  protocol: 'wss',
};

bootstrapApplication(AppComponent, {
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    provideRouter(routes),
    importProvidersFrom(
      HttpClientModule,
      MqttModule.forRoot(MQTT_SERVICE_OPTIONS),
      TranslateModule.forRoot({
        defaultLanguage: 'ru',
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient]
        }
      })
    )
  ]
}).then(ref => {
  const translate = ref.injector.get(TranslateService);
  const savedLang = localStorage.getItem('lang') || 'ru';
  translate.use(savedLang);
  const titles: { [key: string]: string } = {
    ru: 'Комплексная система мониторинга и запуска гидронасосов',
    en: 'Integrated monitoring and control system for water pumps',
    kz: 'Гидронасостарды бақылау және іске қосу кешенді жүйесі'
  };
  document.title = titles[savedLang] || titles['ru'];
}).catch((err) => console.error(err));
