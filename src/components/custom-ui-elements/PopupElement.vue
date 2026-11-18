<script setup lang="ts">
    const isOpen = defineModel<boolean>( {
        'default': false
    } );

    withDefaults( defineProps<{
        'showClose'?: boolean;
        'maxWidth'?: number | string;
    }>(), {
        'showClose': true,
        'maxWidth': 860
    } );

    const closePopup = () => {
        isOpen.value = false;
    };
</script>

<template>
    <v-dialog
        v-model="isOpen"
        :max-width="maxWidth"
        scrollable
    >
        <v-sheet
            class="popup-sheet pa-6 position-relative"
            rounded="lg"
        >
            <v-btn
                v-if="showClose"
                aria-label="Close"
                class="popup-close-btn"
                color="medium-emphasis"
                density="comfortable"
                icon="mdi-close"
                size="small"
                variant="text"
                @click="closePopup"
            />

            <slot />
        </v-sheet>
    </v-dialog>
</template>

<style scoped lang="scss">
    .popup-sheet {
        width: 100%;
    }

    .popup-close-btn {
        position: absolute;
        top: 16px;
        right: 16px;
        z-index: 1;
    }
</style>
