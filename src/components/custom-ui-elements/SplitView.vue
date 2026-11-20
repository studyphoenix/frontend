<script setup lang="ts">
    import {
        ref,
        useTemplateRef
    } from 'vue';

    const TARGET_SIZE_NORMAL = 20;
    const TARGET_SIZE_MOVING = 400;
    const splitPosition = ref( 50 );
    const isResizing = ref( false );
    const el = useTemplateRef( 'wrapper' );

    let startPos = -1;
    let originalPos = -1;
    let parentWidth = -1;

    const startResize = ( ev: MouseEvent ) => {
        isResizing.value = true;
        startPos = ev.x;
        originalPos = splitPosition.value;
        parentWidth = el.value!.getBoundingClientRect().width;
    };

    const moveHandler = ( ev: MouseEvent ) => {
        if ( !isResizing.value ) return;

        const offset = ( ev.x - startPos ) / parentWidth * 100;

        splitPosition.value = originalPos + offset;
    };

    const endResize = () => {
        isResizing.value = false;
        startPos = -1;
        originalPos = -1;
    };
</script>

<template>
    <div ref="wrapper" class="split-view">
        <div :style="`width: calc(${splitPosition}% - 10px);`" class="split-view-element">
            <slot name="left" />
        </div>
        <div
            class="grab-target"
            :style="`left: calc(${splitPosition}% - ${
                isResizing ? TARGET_SIZE_MOVING / 2 : TARGET_SIZE_NORMAL / 2
            }px); width: ${
                isResizing ? TARGET_SIZE_MOVING : TARGET_SIZE_NORMAL
            }px;`"
            @mousedown="startResize"
            @mousemove="moveHandler"
            @mouseup="endResize"
        >
            <span class="bg-surface-variant"></span>
        </div>
        <div :style="`width: calc(${100 - splitPosition}% - 10px);`" class="split-view-element">
            <slot name="right" />
        </div>
    </div>
</template>

<style lang="scss" scoped>
@use "@/styles/components/split-view.scss";
</style>
