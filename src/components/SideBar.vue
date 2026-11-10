<script setup lang="ts">
    import {
        useAuthStore
    } from '@/stores/authstore';
    import {
        useTheme
    } from 'vuetify';

    const theme = useTheme();
    const store = useAuthStore();
</script>

<template>
    <v-navigation-drawer
        expand-on-hover
        permanent
        rail
    >
        <v-list nav>
            <v-list-item
                prepend-avatar="https://randomuser.me/api/portraits/women/84.jpg"
                subtitle="jane.doe@example.ccom"
                :title="store.username"
                link
                href="/account"
            />
        </v-list>

        <v-divider />

        <v-list density="compact" nav>
            <v-list-item
                prepend-icon="mdi-home"
                title="Home"
                value="home"
                link
                href="/"
            />
            <v-list-item
                prepend-icon="mdi-chat"
                title="Chats"
                value="chats"
                link
                href="/chat"
            />
            <v-list-item
                prepend-icon="mdi-school"
                title="Subjects"
                value="subjects"
                link
                href="/subjects"
            />
        </v-list>
        <template #append>
            <v-list density="compact">
                <v-list-item
                    prepend-icon="mdi-cog"
                    title="Settings"
                    value="settings"
                    link
                    href="/settings"
                />
                <v-list-item
                    prepend-icon="mdi-theme-light-dark"
                    title="Theme"
                    @click="theme.toggle()"
                />
            </v-list>
        </template>
    </v-navigation-drawer>
</template>
