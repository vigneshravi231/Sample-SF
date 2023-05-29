

import { LightningElement, api } from "lwc";
import { NavigationMixin } from "lightning/navigation";
import { loadScript, loadStyle } from 'lightning/platformResourceLoader';

import chartjs from '@salesforce/resourceUrl/chartJs';

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

export default class MapFundsRedeemedGauge extends NavigationMixin(LightningElement) {
  @api availableFunds;
  @api fundsRedeemed;

  error;
  chart;
  scriptsInitialized = false;

  get cardSubTitle() {
    let d = new Date();
    return 'As of ' + months[d.getMonth()] + ' ' + d.getFullYear();
  }

  get totalPotentialFunds() {
    return this.fundsRedeemed + this.availableFunds;
  }

  navigateToAssetsWithoutWarranties() {
    this[NavigationMixin.Navigate]({
      type: "standard__webPage",
      attributes: {
        url: 'warranty-registration-list?tabset-5a055=2'
      }
    });
  }

  config = {
    type: "doughnut",
    data: {
      labels : ["Redeemed MAP Credits", "Redeemable MAP Credits Left"],
      datasets: [{
        label: "Gauge",
        data : [1, 1],
        backgroundColor: [
          "rgb(0, 99, 190)",
          "#f48249"
        ]
      }]
    },
    options: {
      circumference: Math.PI,
      rotation : Math.PI,
      cutoutPercentage : 80, // percent
      plugins: {
        datalabels: {
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          borderColor: '#ffffff',
          color: function(context) {
            return context.dataset.backgroundColor;
          },
          font: function(context) {
            var w = context.chart.width;
            return {
              size: w < 512 ? 18 : 20
            }
          },
          align: 'start',
          anchor: 'start',
          offset: 10,
          borderRadius: 4,
          borderWidth: 1,
          formatter: function(value, context) {
            var i = context.dataIndex;
            var len = context.dataset.data.length - 1;
            if(i === len){ return null; }
            return value+' mph';
          }
        }
      },
      legend: {
        display: false
      },
      tooltips: {
        enabled: true
      }
    }
  };

  renderedCallback() {
    if (this.scriptsInitialized) {
      return;
    }
    this.scriptsInitialized = true;
    this.config.data.datasets[0].data = [this.fundsRedeemed, this.availableFunds];

    Promise.all([
      loadScript(this, chartjs + '/Chart_min.js'),
      loadStyle(this, chartjs + '/Chart_min.css')
    ])
      .then(() => {
        // disable Chart.js CSS injection
        window.Chart.platform.disableCSSInjection = true;

        const canvas = document.createElement('canvas');
        this.template.querySelector('div.chart').appendChild(canvas);
        const ctx = canvas.getContext('2d');
        this.chart = new window.Chart(ctx, this.config);
      })
      .catch((error) => {
        this.error = error;
      });
  }
}