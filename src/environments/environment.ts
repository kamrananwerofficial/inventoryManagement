// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api', // 🟡 like: http://localhost:5000/api
  firebase: {
    apiKey: "AIzaSyAmUagsLYOfHBCR9mxID3k8IxsgQNiUh6U",
    authDomain: "inventorymanagementsoft.firebaseapp.com",
    projectId: "inventorymanagementsoft",
    storageBucket: "inventorymanagementsoft.appspot.com",
    messagingSenderId: "1007899983499",
    appId: "1:1007899983499:web:d7e4b90b6df559d6f19e8e",
    measurementId: "G-BJ630Q2Q3Z"
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
