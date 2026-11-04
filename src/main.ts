import 'unfonts.css';
import App from './App.vue';
import {
    configure
} from '@janishutz/oidc-login-sdk-browser';
import {
    createApp
} from 'vue';
import {
    registerPlugins
} from '@/plugins';

// Detect backend URL
let backendURL: string;

if ( import.meta.env.PROD ) {
    backendURL = import.meta.env.VITE_BACKEND_URL ?? ( location.protocol + '//api.' + location.host );
} else {
    console.warn( '[BACKEND] Development backend enabled' );
    backendURL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8080';
}

configure( {
    'backendURL': new URL( backendURL ),
    'defaultAuthErrorResolution': 'resolve',
    'authErrorEvent': 'autherror'
} );

const app = createApp( App );

registerPlugins( app );

app.mount( '#app' );
