import { Component } from '@angular/core';
import { AlertController, LoadingController, NavController, Platform } from '@ionic/angular';
import { Geolocation, Plugins } from '@capacitor/core';

import { Config } from '../config';
import { WeatherService } from '../services/weather.service';
import { LocationConfig, LocationType } from '../interfaces/location';

const { Keyboard } = Plugins;

enum TempScale { Fahrenheit, Celsius }

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  currentMode: string = 'current';

  displayMode: string = this.currentMode;

  locationConfig: LocationConfig;

  searchInput: string = '';

  currentItems: Array<any> = [];

  forecastItems: Array<any> = [];

  DAYS: Array<string> = ['Domigo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  constructor(
    public alertController: AlertController,
    public loadingCtrl: LoadingController,
    public nav: NavController,
    public platform: Platform,
    public weather: WeatherService
  ) {
  }

  ionViewDidEnter() {
    console.log('HomePage: ionViewDidEnter()');

    console.log('Verificando a configuração do aplicativo');
    if (Config.weatherKey.length < 1) {
      const msg = 'Valor de Config.weatherKey ausente';
      console.warn(msg);
      this.showAlert(msg, 'Erro', 'Tente Novamente');
    } else {
      this.getLocalWeather();
    }
  }

  getLocalWeather() {
    console.log('HomePage: getLocalWeather()');
    this.loadingCtrl.create({ message: 'Recuperando localização' })
      .then(loader => {

        loader.present();

        const locOptions = { maximumAge: 3000, timeout: 5000, enableHighAccuracy: true };
        Geolocation.getCurrentPosition(locOptions)
          //@ts-ignore
          .then((position: GeolocationCoordinates) => {

            loader.dismiss();

            if (position) {

              this.locationConfig = {
                type: LocationType.Geolocation,
                value: {
                  longitude: position.coords.longitude,
                  latitude: position.coords.latitude
                }
              };
              this.updatePage();
            } else {
              const msg = 'Posicionar objeto vazio.';
              console.error(msg);
              this.showAlert(msg, 'Erro');
            }
          })
          .catch(e => {

            loader.dismiss();
            console.error(e.message);
            this.showAlert(e.message, 'Erro');
          });
      });
  }

  setPostalCode() {

    console.log(`HomePage: setPostalCode(${this.searchInput})`);

    Keyboard.hide();

    if (this.searchInput.length > 0) {
      let padrao = '/^[A-Za-záàâãéèêíïóôõöúçñÁÀÂÃÉÈÍÏÓÔÕÖÚÇÑ ]+$/';
      const re = RegExp(padrao);
      if (!re.test(this.searchInput)) {

        this.locationConfig = {
          type: LocationType.PostalCode,
          value: { PostalCode: this.searchInput }
        }
        this.searchInput = '';

        this.displayMode = this.currentMode;

        this.updatePage();
      } else {
        const msg = 'A entrada não é um código postal válido.';
        console.log(`HomePage: ${msg}`);
        this.showAlert(msg, 'Erro', 'Tente Novamente');
      }
    } else {
      const msg = 'O campo de entrada do CEP está vazio.';
      console.log(`HomePage: ${msg}`);
      this.showAlert(msg, 'Erro', 'Tente Novamente');
    }
  }

  updatePage() {
    console.log('HomePage: updatePage()');

    if (this.locationConfig) {

      this.updateCurrentWeather();
      this.updateForecast();
    } else {
      console.log('HomePage: Skipping page update, no location set');
    }
  }

  makeDegreeString(temperatureValue: number) {
    return `${temperatureValue} graus (C°)`;
  }

  private formatWeatherData(data: any): any {

    console.log('HomePage: formatWeatherData()');

    const tmpArray = [];

    if (data.name) {

      tmpArray.push({ name: 'Localização', value: data.name });
    }
    tmpArray.push({ name: 'Temperatura', value: this.makeDegreeString(data.main.temp) });
    tmpArray.push({ name: 'Miníma', value: this.makeDegreeString(data.main.temp_min) });
    tmpArray.push({ name: 'Máxima', value: this.makeDegreeString(data.main.temp_max) });
    tmpArray.push({ name: 'Umidade', value: `${data.main.humidity} %` });
    tmpArray.push({ name: 'Pressão', value: `${data.main.pressure} hPa` });
    tmpArray.push({ name: 'Vento', value: `${data.wind.speed} mph` });

    if (data.visibility) {
      tmpArray.push({ name: 'Visibilidade', value: `${data.visibility} metros` });
    }

    if (data.sys.sunrise) {
      const sunriseDate = new Date(data.sys.sunrise * 1000);
      tmpArray.push({ name: 'Nascer do Sol', value: sunriseDate.toLocaleTimeString() });
    }
    if (data.sys.sunset) {
      const sunsetDate = new Date(data.sys.sunset * 1000);
      tmpArray.push({ name: 'Pór do Sol', value: sunsetDate.toLocaleTimeString() });
    }

    if (data.coord) {

      tmpArray.push({ name: 'Latitude', value: data.coord.lat });
      tmpArray.push({ name: 'Longitude', value: data.coord.lon });
    }

    return tmpArray;
  }

  updateCurrentWeather() {
    console.log('HomePage: updateCurrentWeather()');

    this.currentItems = [];

    this.loadingCtrl.create({ message: 'Recuperando as condições atuais ...' })
      .then(loader => {

        loader.present();

        this.weather.getCurrent(this.locationConfig)
          .then(data => {

            loader.dismiss();

            if (data) {

              this.currentItems = this.formatWeatherData(data);
            }
          },
            error => {

              loader.dismiss();
              console.error('Erro ao recuperar dados meteorológicos');
              console.dir(error);
              this.showAlert(error);
            }
          );
      });
  }

  updateForecast() {
    console.log('HomePage: updateForecast()');

    this.forecastItems = [];

    this.loadingCtrl.create({ message: 'Recuperando previsão...' })
      .then(loader => {

        loader.present();

        this.weather.getForecast(this.locationConfig).then(
          data => {

            loader.dismiss();

            if (data) {

              for (let period of data.list) {

                const weatherValues: any = this.formatWeatherData(period);

                const d = new Date(period.dt_txt.replace(' ', 'T'));

                const day = this.DAYS[d.getDay()];

                const tm = d.toLocaleTimeString();

                this.forecastItems.push({ period: `${day} às ${tm}`, values: weatherValues });
              }
            } else {

              console.error('Erro ao exibir dados meteorológicos: o objeto de dados está vazio');
            }
          },
          error => {
  
            loader.dismiss();
            console.error('Erro ao recuperar dados meteorológicos');
            console.dir(error);
            this.showAlert(error);
          }
        );
      });
  }

  viewForecast(item: any) {
    console.log('HomePage: viewForecast()');

    this.nav.navigateForward('/weather', { state: { forecast: item } });
  }

  showAlert(theMessage: string, theHeader: string = 'Erro', theButton: string = 'Desculpe') {
    this.alertController.create({
      header: theHeader,
      message: theMessage,
      buttons: [{ text: theButton }]
    }).then((alert) => alert.present());
  }

}
