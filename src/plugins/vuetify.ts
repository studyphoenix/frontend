/**
 * plugins/vuetify.ts
 *
 * Framework documentation: https://vuetifyjs.com`
 */

import '@mdi/font/css/materialdesignicons.css';
import 'vuetify/styles';
import {
    createVuetify
} from 'vuetify';
import {
    md3
} from 'vuetify/blueprints';

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify( {
    'defaults': {
        'VBtn': {
            'color': 'primary',
            'rounded': 'true'
        }
    },
    'blueprint': md3, // TODO: custom themes
    'theme': {
        'defaultTheme': 'system'
    }
} );
