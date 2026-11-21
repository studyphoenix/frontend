<script setup lang="ts">
    import SplitView from '@/components/custom-ui-elements/SplitView.vue';

</script>

<template>
    <div>
        <SplitView>
            <template #left>
                <h1>LEFT</h1>
            </template>
            <template #right>
                <h1>RIGHT</h1>
            </template>
        </SplitView>
    </div>
</template>
