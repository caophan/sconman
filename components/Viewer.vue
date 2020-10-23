<template>
  <div>
    <div id="forgeViewer"></div>
    <v-alert v-if="status == 'translation'" prominent type="info">
      <span v-if="progress == 'start'">
        Translation started! Please try again in a moment.
      </span>
      <span v-else>
        The translation job still running: {{ progress }}. Please try again in a
        moment.
      </span>
      <v-btn color="primary" @click="reloadObject"
        ><v-icon left>mdi-reload</v-icon>Reload</v-btn
      >
    </v-alert>
    <v-alert v-if="status == 'error'" prominent type="error">
      <span>This file is not translated yet!</span>
      <v-btn color="primary" @click="translateObject"
        ><v-icon left>mdi-eye</v-icon>Start translation</v-btn
      >
    </v-alert>
  </div>
</template>

<script>
export default {
  props: ['geometry', 'translateGeometry'],
  data: () => ({
    viewer: null,
    status: undefined,
    progress: undefined,
    urn: undefined,
  }),

  watch: {
    'geometry.objectName'(newVal) {
      this.loadObject(newVal)
    },

    'translateGeometry.objectName'(newVal) {
      if (this.viewer != null) {
        this.viewer.finish()
        this.viewer = null
      }
      this.translateObject()
    },
  },

  methods: {
    getForgeToken(callback) {
      fetch('/api/forge/oauth/token')
        .then((res) => res.json())
        .then((data) => {
          callback(data.access_token, arguments[1])
        })
    },

    getData(token, urn) {
      fetch(
        'https://developer.api.autodesk.com/modelderivative/v2/designdata/' +
          urn +
          '/manifest',
        {
          headers: {
            Authorization: 'Bearer ' + token,
          },
        }
      )
        .then((res) => {
          if (res.ok) {
            return res.json()
          } else {
            return Promise.reject(res.statusText)
          }
        })
        .then((data) => {
          if (data.status === 'success') {
            this.status = 'success'
            this.launchViewer(urn)
          } else {
            this.status = 'translation'
            this.progress = data.progress
            this.urn = urn
          }
        })
        .catch((err) => {
          console.error(err)
          this.status = 'error'
        })
    },

    launchViewer(urn) {
      const options = {
        env: 'AutodeskProduction',
        getAccessToken: this.getForgeToken,
      }

      Autodesk.Viewing.Initializer(options, () => {
        this.viewer = new Autodesk.Viewing.GuiViewer3D(
          document.getElementById('forgeViewer'),
          { extensions: ['CustomMenuExtension'] }
        )
        this.viewer.start()
        const documentId = 'urn:' + urn
        Autodesk.Viewing.Document.load(
          documentId,
          this.onDocumentLoadSuccess,
          this.onDocumentLoadFailure
        )
      })
    },

    onDocumentLoadSuccess(doc) {
      const filter = {
        type: 'geometry',
        role: '3d', //! <<< the key
      }
      const viewables = doc.getRoot().search(filter)
      this.viewer.loadDocumentNode(doc, viewables[0]).then((i) => {
        // documented loaded, any action?
      })
    },

    onDocumentLoadFailure(viewerErrorCode) {
      console.error('onDocumentLoadFailure() - errorCode:' + viewerErrorCode)
    },

    translateObject(param) {
      let geometry
      if (param instanceof MouseEvent) {
        geometry = this.geometry
      } else {
        geometry = this.translateGeometry
      }
      this.urn = geometry.objectName

      fetch('/api/forge/modelderivative/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(geometry),
      }).then((res) => {
        this.status = 'translation'
        this.progress = 'start'
      })
    },

    reloadObject() {
      this.loadObject(this.urn)
    },

    loadObject(urn) {
      if (this.viewer != null) {
        this.viewer.finish()
        this.viewer = null
      }
      this.getForgeToken(this.getData, urn)
    },
  },
}
</script>
