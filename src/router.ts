import {
    createRouter,
    createWebHistory
} from 'vue-router';

const router = createRouter( {
    'history': createWebHistory( import.meta.env.BASE_URL ),
    'routes': [
        {
            'path': '/',
            'redirect': '/subjects'
        },
        {
            'path': '/subjects',
            'name': 'subject-picker',
            'component': () => import( '@/views/SubjectPicker.vue' ),
            'meta': {
                'title': 'Subjects'
            }
        },
        {
            'path': '/subjects/tree',
            'name': 'subject-tree',
            'component': () => import( '@/views/SubjectTree.vue' ),
            'meta': {
                'title': 'Subject Tree'
            }
        }
    ]
} );

export default router;
