import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
// import { LoadingController } from '@ionic/angular';

import { Config } from '../config';
import { LocationConfig, LocationType } from '../interfaces/location';

@Injectable({
  providedIn: 'root'
})
export class WeatherService {

  constructor(
    private http: HttpClient,
  ) {
    console.log('WeatherService: constructor()');
  }

  private makeWeatherURL(loc: LocationConfig, command: string): string {

    console.log('WeatherService: makeWeatherURL()');

    let uri = Config.weatherEndpoint + command;
    if (loc.type === LocationType.Geolocation) {
      console.log('makeWeatherURL: URL de pesquisa por localização de construçãoL');
      //@ts-ignore
      uri += `?lat=${loc.value.latitude}&lon=${loc.value.longitude}`;
    } else {
      console.log('makeWeatherURL: URL de pesquisa por cidade de construção');
      //@ts-ignore
      uri += `?q=${loc.value.PostalCode},` + 'BRA';
    }
    uri += '&units=metric';

    uri += `&APPID=${Config.weatherKey}`;
    console.log(`Service URL: ${uri}`);
    return uri;
  }

  getCurrent(loc: LocationConfig): Promise<any> {
    console.log('WeatherService: getCurrent()');
    const url: string = this.makeWeatherURL(loc, 'weather');
    return new Promise((resolve, reject) => {
      this.http.get(url).subscribe(data => {
        resolve(data);
      }, error => {
        console.error(error.message);
        reject(error.message);
      });
    });
  }

  getForecast(loc: LocationConfig): Promise<any> {
    console.log('WeatherService: getForecast()');
    const url: string = this.makeWeatherURL(loc, 'forecast');
    return new Promise((resolve, reject) => {
      this.http.get(url).subscribe(data => {
        resolve(data);
      }, error => {
        console.error(error.message);
        reject(error.message);
      });
    });
  }

}
