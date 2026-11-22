<script setup lang="ts">
    import type {
        ModelAsset,
        ModelSubject
    } from '@/ts/types/api';
    import {
        computed,
        ref,
        watch
    } from 'vue';
    import {
        generateTechTree,
        isMockAiEnabled
    } from '@/ts/ai/techtree-generator';
    import type {
        GeneratedTechTree
    } from '@/ts/util/techtree-validator';
    import {
        request
    } from '@janishutz/oidc-login-sdk-browser';

    const isBackendless = import.meta.env.VITE_BACKENDLESS === 'true';
    const isOpen = defineModel<boolean>( {
        'default': false
    } );
    const props = defineProps<{
        'subject': ModelSubject | null;
        'bulkCreateTechTree': ( subjectId: number, tree: GeneratedTechTree ) => Promise<boolean>;
        'externalError'?: string | null;
    }>();
    const syllabusContext = ref( '' );
    const attachedAssets = ref<ModelAsset[]>( [] );
    const loadingAssets = ref( false );
    const generating = ref( false );
    const saving = ref( false );
    const dialogError = ref<string | null>( null );
    const previewTree = ref<GeneratedTechTree | null>( null );
    const usedMockPreview = ref( false );
    const mockMode = computed( () => isMockAiEnabled() );
    const hasGenerationInput = computed( () => {
        return attachedAssets.value.length > 0 || syllabusContext.value.trim().length > 0;
    } );
    const previewLayers = computed( () => {
        if ( !previewTree.value ) {
            return [];
        }

        const nameById = new Map( previewTree.value.subtopics.map( st => [
            st.id,
            st.name
        ] ) );
        const prereqsById = new Map<number, string[]>();

        for ( const edge of previewTree.value.edges ) {
            const parentName = nameById.get( edge.from );

            if ( parentName ) {
                prereqsById.set( edge.to, [
                    ...prereqsById.get( edge.to ) ?? [],
                    parentName
                ] );
            }
        }

        const grouped = new Map<number, Array<{
            'id': number;
            'name': string;
            'prereqs': string[];
        }>>();

        for ( const st of previewTree.value.subtopics ) {
            grouped.set( st.layer, [
                ...grouped.get( st.layer ) ?? [],
                {
                    'id': st.id,
                    'name': st.name,
                    'prereqs': prereqsById.get( st.id ) ?? []
                }
            ] );
        }

        return Array.from( grouped.entries() )
            .sort( ( a, b ) => a[0] - b[0] )
            .map( ( [
                layer,
                nodes
            ] ) => ( {
                layer,
                nodes
            } ) );
    } );

    const loadSubjectAssetsContext = async ( subjectId: number ) => {
        attachedAssets.value = [];

        if ( isBackendless ) {
            return;
        }

        loadingAssets.value = true;

        try {
            const res = await request.get( `/subjects/get/${ subjectId }` );

            if ( res.ok ) {
                const data = await res.json() as ModelSubject;

                if ( Array.isArray( data.assets ) ) {
                    attachedAssets.value = data.assets;
                }
            }
        } catch {
            // Optional context only; ignore errors if assets cannot be preloaded yet
        } finally {
            loadingAssets.value = false;
        }
    };

    watch( isOpen, open => {
        if ( open ) {
            syllabusContext.value = '';
            dialogError.value = null;
            previewTree.value = null;
            usedMockPreview.value = false;

            if ( props.subject?.id ) {
                loadSubjectAssetsContext( props.subject.id );
            }
        }
    } );

    const handleGenerate = async () => {
        if ( !props.subject ) {
            dialogError.value = 'Select a subject first.';

            return;
        }

        if ( !hasGenerationInput.value ) {
            dialogError.value = 'Attach course materials or enter a syllabus/topic list first.';

            return;
        }

        dialogError.value = null;
        generating.value = true;

        try {
            const result = await generateTechTree( {
                'subjectName': props.subject.name,
                'syllabusContext': syllabusContext.value,
                'assetNames': attachedAssets.value.map( a => a.name )
            } );

            previewTree.value = result.tree;
            usedMockPreview.value = result.usedMock;
        } catch ( err ) {
            dialogError.value = err instanceof Error ? err.message : 'Failed to generate tech tree.';
        } finally {
            generating.value = false;
        }
    };

    const handleSave = async () => {
        if ( !props.subject || !previewTree.value ) {
            return;
        }

        dialogError.value = null;
        saving.value = true;

        try {
            const saved = await props.bulkCreateTechTree( props.subject.id, previewTree.value );

            if ( saved ) {
                isOpen.value = false;
            } else {
                dialogError.value = props.externalError ?? 'Failed to save generated tech tree.';
            }
        } finally {
            saving.value = false;
        }
    };
</script>

<template>
    <v-dialog
        v-model="isOpen"
        max-width="640"
    >
        <v-sheet
            class="pa-5"
            rounded="lg"
        >
            <div class="d-flex align-center justify-space-between ga-2 mb-2">
                <h3 class="text-h6 font-weight-bold">
                    Generate Tech Tree
                </h3>

                <v-chip
                    v-if="mockMode || usedMockPreview"
                    color="primary"
                    size="small"
                    variant="tonal"
                >
                    Mock AI mode
                </v-chip>
            </div>

            <p class="text-body-2 text-medium-emphasis mb-4">
                Generate a prerequisite learning graph for {{ props.subject?.name ?? 'this subject' }} and review it before saving.
            </p>

            <v-alert
                v-if="dialogError"
                class="mb-4"
                closable
                density="compact"
                :icon="false"
                type="error"
                variant="tonal"
                @click:close="dialogError = null"
            >
                {{ dialogError }}

                <template #close="{ props: closeProps }">
                    <v-btn
                        v-bind="closeProps"
                        color="error"
                    />
                </template>
            </v-alert>

            <div v-if="!previewTree">
                <v-alert
                    v-if="!loadingAssets && attachedAssets.length === 0"
                    class="mb-4"
                    density="compact"
                    :icon="false"
                    type="info"
                    variant="tonal"
                >
                    No course materials are attached yet. Attach files in Subject Assets for better
                    results, or paste a syllabus or topic list below.
                </v-alert>

                <div
                    v-else-if="attachedAssets.length > 0"
                    class="mb-3"
                >
                    <div class="text-caption text-medium-emphasis mb-1">
                        Attached subject materials
                    </div>
                    <div class="d-flex flex-wrap ga-1">
                        <v-chip
                            v-for="asset in attachedAssets"
                            :key="asset.id"
                            prepend-icon="mdi-file-document-outline"
                            size="small"
                            variant="outlined"
                        >
                            {{ asset.name }}
                        </v-chip>
                    </div>
                </div>

                <v-textarea
                    v-model="syllabusContext"
                    density="compact"
                    :label="attachedAssets.length > 0 ? 'Additional syllabus or topic notes (optional)' : 'Syllabus or topic list'"
                    placeholder="Paste lecture topics, weekly schedule or key concepts..."
                    rows="4"
                    variant="outlined"
                />

                <div class="d-flex justify-end ga-2 mt-4">
                    <v-btn
                        color="medium-emphasis"
                        variant="text"
                        @click="isOpen = false"
                    >
                        Cancel
                    </v-btn>

                    <v-btn
                        color="on-surface"
                        :disabled="!hasGenerationInput || loadingAssets"
                        :loading="generating"
                        prepend-icon="mdi-auto-fix"
                        variant="tonal"
                        @click="handleGenerate"
                    >
                        Generate Preview
                    </v-btn>
                </div>
            </div>

            <div v-else>
                <div class="preview-scroll d-flex flex-column ga-3 mb-4">
                    <div
                        v-for="group in previewLayers"
                        :key="group.layer"
                        class="layer-box pa-3 rounded-lg"
                    >
                        <div class="text-caption text-medium-emphasis mb-2">
                            Layer {{ group.layer + 1 }}
                        </div>

                        <div class="d-flex flex-wrap ga-2">
                            <div
                                v-for="node in group.nodes"
                                :key="node.id"
                                class="preview-node px-3 py-2 rounded"
                            >
                                <div class="text-body-2 font-weight-medium">
                                    {{ node.name }}
                                </div>
                                <div
                                    v-if="node.prereqs.length > 0"
                                    class="text-caption text-medium-emphasis"
                                >
                                    After: {{ node.prereqs.join( ', ' ) }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="d-flex justify-space-between ga-2">
                    <v-btn
                        color="medium-emphasis"
                        variant="text"
                        @click="previewTree = null"
                    >
                        Back
                    </v-btn>

                    <div class="d-flex ga-2">
                        <v-btn
                            color="medium-emphasis"
                            :loading="generating"
                            variant="outlined"
                            @click="handleGenerate"
                        >
                            Regenerate
                        </v-btn>

                        <v-btn
                            color="on-surface"
                            :loading="saving"
                            prepend-icon="mdi-check"
                            variant="tonal"
                            @click="handleSave"
                        >
                            Save Tech Tree
                        </v-btn>
                    </div>
                </div>
            </div>
        </v-sheet>
    </v-dialog>
</template>

<style scoped lang="scss">
    .preview-scroll {
        max-height: 420px;
        overflow-y: auto;
    }

    .layer-box {
        border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    }

    .preview-node {
        background-color: rgb(var(--v-theme-surface-variant));
    }
</style>
