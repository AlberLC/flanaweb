<script setup lang="ts">
import FilesUploader from '@/components/FilesUploader.vue'
</script>

<template>
    <v-app>
        <v-main class="main">
            <FilesUploader class="files-updater" />
        </v-main>
    </v-app>
</template>

<style scoped>
.main {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 5vh 5vw;
}

.files-updater {
    min-width: 50vw;
    min-height: 50vh;
    margin: 10vh 0;
}
</style>
