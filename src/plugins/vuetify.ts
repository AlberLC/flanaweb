import 'vuetify/styles'

import { mdiClose, mdiCloudUpload, mdiDownload, mdiFileImport, mdiLinkVariant, mdiPause } from '@mdi/js'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg'
import { es } from 'vuetify/locale'

export default createVuetify({
    theme: {
        defaultTheme: 'system'
    },
    icons: {
        aliases: {
            ...aliases,
            close: mdiClose,
            cloudUpload: mdiCloudUpload,
            download: mdiDownload,
            fileImport: mdiFileImport,
            linkVariant: mdiLinkVariant,
            pause: mdiPause
        },
        sets: {
            mdi
        }
    },
    locale: {
        locale: 'es',
        messages: {
            es
        }
    }
})
