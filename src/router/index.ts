import {
    createRouter,
    createWebHistory
} from 'vue-router';
import {
    auth
} from '@janishutz/oidc-login-sdk-browser';
import {
    useAuthStore
} from '@/stores/authstore';

const router = createRouter( {
    'history': createWebHistory( import.meta.env.BASE_URL ),
    'routes': [
        {
            'path': '/',
            'name': 'home',
            'component': () => import( '@/pages/StartPage.vue' ),
            'meta': {
                'title': 'Home',
                'auth': false
            }
        },
        {
            'path': '/app',
            'name': 'app',
            'component': () => import( '@/pages/AppPage.vue' ),
            'meta': {
                'title': 'App',
                'auth': true
            }
        },
        {
            'path': '/chat/:id?',
            'name': 'chat',
            'component': () => import( '@/pages/ChatPage.vue' ),
            'meta': {
                'title': 'Chat',
                'auth': true
            }
        }
    ]
} );

router.beforeEach( async to => {
    const store = useAuthStore();

    if ( to.meta.auth && !store.isAuth ) {
        try {
            store.isAuth = await auth.check();
        } catch {
            store.isAuth = false;
        }

        if ( !store.isAuth ) {
            return {
                'name': 'home'
            };
        }
    } else if ( to.name === 'home' && store.isAuth ) {
        return {
            'name': 'app'
        };
    }
} );

router.afterEach( to => {
    window.scrollTo( {
        'top': 0,
        'behavior': 'smooth'
    } );
    document.title = to.meta.title ? to.meta.title + ' - StudyPhoenix' : 'StudyPhoenix';
    // NProgress.done();
} );

export default router;
